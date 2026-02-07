import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { createHash } from 'crypto';
import { PatientService } from '../patients/patient/patient.service';

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly patientService: PatientService,
  ) {
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '3600s';
  }

  async login(loginDto: LoginDto) {
    const sanitizedIdentifier = (loginDto.identifier ?? '').trim();
    const sanitizedPassword = loginDto.password ?? '';

    if (!sanitizedIdentifier || !sanitizedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userRecord = await this.validateUser(
      sanitizedIdentifier,
      sanitizedPassword,
    );
    if (!userRecord) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: userRecord.id,
      role: userRecord.rol,
      email: userRecord.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.jwtExpiresIn,
    });

    return {
      accessToken,
      expiresIn: this.jwtExpiresIn,
      user: this.buildProfileResponse(userRecord),
    };
  }

  async register(registerDto: RegisterDto) {
    const email = (registerDto.email ?? '').trim().toLowerCase();
    const password = (registerDto.password ?? '').trim();
    const firstName = (registerDto.firstName ?? '').trim();
    const lastName = (registerDto.lastName ?? '').trim();
    const requestedRole = (registerDto.role ?? 'patient').toString().trim();
    const nationalId = (registerDto.nationalId ?? '').trim();
    const birthDate = (registerDto.birthDate ?? '').trim();
    const gender = (registerDto.gender ?? '').trim();
    const contactPhone = (registerDto.contactPhone ?? '').trim();

    if (!email || !password || !firstName || !lastName) {
      throw new BadRequestException('Missing required registration data');
    }

    const duplicate = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { email: email.toLowerCase() }],
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const hashedPassword = this.hashPassword(password);
    const normalizedRole = this.normalizeRole(requestedRole);
    const username = `${firstName} ${lastName}`.trim() || email;
    const timestamp = new Date();

    let createdUser:
      | {
          id: number;
          email: string | null;
          rol: string | null;
          username: string | null;
          active: number | null;
          created_at: Date | null;
          updated_at: Date | null;
        }
      | null = null;

    try {
      createdUser = await this.prisma.usuario.create({
        data: {
          email,
          username,
          password: hashedPassword,
          rol: normalizedRole,
          active: 1,
          created_at: timestamp,
          updated_at: timestamp,
        },
        select: {
          id: true,
          email: true,
          rol: true,
          username: true,
          active: true,
          created_at: true,
          updated_at: true,
        },
      });

      await this.patientService.create({
        id_usuario: createdUser.id,
        nombres: firstName,
        apellidos: lastName,
        genero: gender || undefined,
        fecha_nacimiento: birthDate || undefined,
        telefono: contactPhone || undefined,
        contacto: username,
        contacto_correo: email,
        contacto_telefono: contactPhone || undefined,
        activo: 1,
        user_role: normalizedRole,
        cedula: nationalId || undefined,
      } as any);
    } catch (error) {
      if (createdUser) {
        await this.prisma.usuario
          .delete({ where: { id: createdUser.id } })
          .catch(() => undefined);
      }
      throw error;
    }

    const payload: JwtPayload = {
      sub: createdUser.id,
      role: normalizedRole,
      email: createdUser.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.jwtExpiresIn,
    });

    const profile = this.buildProfileResponse({
      ...createdUser,
      nombres: firstName,
      apellidos: lastName,
    });

    return {
      accessToken,
      expiresIn: this.jwtExpiresIn,
      user: profile,
    };
  }

  async validateUser(identifier: string, password: string) {
    const lowered = identifier.toLowerCase();
    const user = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: lowered },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      return null;
    }

    if (
      typeof user.active !== 'undefined' &&
      user.active !== null &&
      Number(user.active) === 0
    ) {
      throw new UnauthorizedException('User is inactive');
    }

    const passwordMatches = await this.comparePassword(
      password,
      user.password ?? '',
    );
    if (!passwordMatches) {
      return null;
    }

    return user;
  }

  buildProfileResponse(user: any) {
    if (!user) return null;

    const normalizeRole = (role: string | null | undefined): string => {
      const value = (role ?? '').toString().trim().toLowerCase();
      if (['administrator', 'admin', 'administrador'].includes(value))
        return 'administrator';
      if (
        ['patient', 'paciente', 'usuario', 'user', 'usuarios'].includes(value)
      )
        return 'patient';
      if (['student', 'estudiante'].includes(value)) return 'student';
      if (['therapist', 'therapeuta'].includes(value)) return 'therapist';
      if (['coach'].includes(value)) return 'coach';
      if (['trainer'].includes(value)) return 'trainer';
      return ['doctor', 'medico'].includes(value) ? 'doctor' : 'doctor';
    };

    return {
      id: user.id,
      username: user.username ?? '',
      email: user.email ?? '',
      firstName: user.nombres ?? '',
      lastName: user.apellidos ?? '',
      role: normalizeRole(user.rol),
      avatar: user.avatar ?? null,
      createdAt: user.created_at ?? null,
      lastLogin: user.updated_at ?? null,
      isActive:
        typeof user.active === 'undefined' ? true : Number(user.active) === 1,
    };
  }

  private async comparePassword(
    plain: string,
    hashed: string,
  ): Promise<boolean> {
    if (!hashed) return false;

    const trimmedHash = hashed.trim();
    if (!trimmedHash) return false;

    const lowerHash = trimmedHash.toLowerCase();
    const md5Prefix = lowerHash.startsWith('md5:')
      ? lowerHash.slice(4)
      : lowerHash;
    const md5Pattern = /^[a-f0-9]{32}$/;
    if (md5Pattern.test(md5Prefix)) {
      const computed = createHash('md5').update(plain).digest('hex');
      return computed === md5Prefix;
    }

    const looksHashed =
      trimmedHash.startsWith('$2a$') ||
      trimmedHash.startsWith('$2b$') ||
      trimmedHash.startsWith('$2y$');
    if (looksHashed) {
      try {
        return await bcrypt.compare(plain, trimmedHash);
      } catch (err) {
        this.logger.error(
          'bcrypt compare failed',
          err instanceof Error ? err.stack : String(err),
        );
        return false;
      }
    }

    return plain === trimmedHash;
  }

  private hashPassword(password: string): string {
    const trimmed = password.trim();
    if (!trimmed) {
      throw new BadRequestException('La contraseña es requerida');
    }

    const md5Hash = createHash('md5').update(trimmed).digest('hex');
    return `md5:${md5Hash}`;
  }

  private normalizeRole(role: string): string {
    const value = role.toLowerCase();
    if (['administrator', 'admin', 'administrador'].includes(value)) {
      return 'administrator';
    }
    if (['doctor', 'medico'].includes(value)) {
      return 'doctor';
    }
    if (['therapist', 'terapeuta'].includes(value)) {
      return 'therapist';
    }
    if (['coach'].includes(value)) {
      return 'coach';
    }
    if (['trainer', 'entrenador'].includes(value)) {
      return 'trainer';
    }
    if (['student', 'estudiante'].includes(value)) {
      return 'student';
    }
    return 'patient';
  }
}

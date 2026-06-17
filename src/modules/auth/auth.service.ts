import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { createHash, randomInt } from 'crypto';
import { PatientService } from '../patients/patient/patient.service';
import { MailService } from '../mail/mail.service';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { VerifyPasswordResetDto } from './dto/verify-password-reset.dto';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly patientService: PatientService,
    private readonly mailService: MailService,
    // private readonly permissionsService: PermissionsService,
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
      // user: await this.buildProfileResponseWithPermissions(userRecord),
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
    // const profile = await this.buildProfileResponseWithPermissions({
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

    const patient = await this.prisma.paciente.findFirst({
      where: { id_usuario: user.id },
      select: {
        nombres: true,
        apellidos: true,
        contacto_correo: true,
        contacto_telefono: true,
      },
    });

    return {
      ...user,
      nombres: patient?.nombres ?? null,
      apellidos: patient?.apellidos ?? null,
      contacto_correo: patient?.contacto_correo ?? null,
      contacto_telefono: patient?.contacto_telefono ?? null,
    };
  }

  buildProfileResponse(user: any) {
    if (!user) return null;

    const deriveNameParts = (value: string | null | undefined) => {
      const trimmed = (value ?? '').toString().trim();
      if (!trimmed) {
        return { first: '', last: '' };
      }

      const [first, ...rest] = trimmed.split(/\s+/);
      return { first: first ?? '', last: rest.join(' ').trim() };
    };

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

    const fallbackNames = deriveNameParts(user.username);
    const firstName = (user.nombres ?? '').toString().trim() || fallbackNames.first;
    const lastName = (user.apellidos ?? '').toString().trim() || fallbackNames.last;

    return {
      id: user.id,
      username: user.username ?? '',
      email: user.email ?? '',
      firstName,
      lastName,
      role: normalizeRole(user.rol),
      avatar: (user.avatar ?? '').toString().trim() || null,
      createdAt: user.created_at ?? null,
      lastLogin: user.updated_at ?? null,
      isActive:
        typeof user.active === 'undefined' ? true : Number(user.active) === 1,
    };
  }

  async getProfileByUserId(userId: number) {
    const record = await this.findUserWithPatientById(userId);
    if (!record) {
      throw new NotFoundException('Usuario no encontrado');
    }

        return this.buildProfileResponse(record);
  //   return this.buildProfileResponseWithPermissions(record);
  // }

  // private async buildProfileResponseWithPermissions(user: any) {
  //   const profile = this.buildProfileResponse(user);
  //   if (!profile) {
  //     return profile;
  //   }

  //   const effectivePermissions = await this.permissionsService.getEffectivePermissionsForUser(
  //     Number(profile.id),
  //     profile.role,
  //   );

  //   return {
  //     ...profile,
  //     permissions: effectivePermissions.permissionKeys,
  //     hasCustomPermissions: effectivePermissions.hasCustomConfiguration,
  //   };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const firstName = this.sanitizeName(dto.firstName);
    const lastName = this.sanitizeName(dto.lastName);
    const email = this.sanitizeEmail(dto.email);
    const avatarProvided = Object.prototype.hasOwnProperty.call(dto, 'avatar');
    const avatar = avatarProvided ? this.normalizeAvatar(dto.avatar) : null;

    if (!firstName || !lastName || !email) {
      throw new BadRequestException('Debes proporcionar nombre, apellido y correo válidos');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Debes proporcionar un correo válido');
    }

    const existingUser = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const duplicateEmail = await this.prisma.usuario.findFirst({
      where: {
        email,
        NOT: {
          id: userId,
        },
      },
      select: { id: true },
    });

    if (duplicateEmail) {
      throw new BadRequestException('El correo ya está en uso por otro usuario');
    }

    const username = this.composeDisplayName(firstName, lastName, existingUser.username ?? email);
    const timestamp = new Date();

    await this.prisma.$transaction(async (prisma) => {
      await prisma.usuario.update({
        where: { id: userId },
        data: {
          email,
          username,
          updated_at: timestamp,
          ...(avatarProvided ? { avatar } : {}),
        },
      });

      const patient = await prisma.paciente.findFirst({
        where: { id_usuario: userId },
        select: { id: true },
      });

      if (patient) {
        await prisma.paciente.update({
          where: { id: patient.id },
          data: {
            nombres: firstName,
            apellidos: lastName,
            contacto: username,
            contacto_correo: email,
          },
        });
      }
    });

    return this.getProfileByUserId(userId);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const currentPassword = (dto.currentPassword ?? '').trim();
    const newPassword = (dto.newPassword ?? '').trim();

    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Debes proporcionar la contraseña actual y la nueva contraseña');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const matches = await this.comparePassword(currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const newMatchesOld = await this.comparePassword(newPassword, user.password);
    if (newMatchesOld) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    const hashedPassword = this.hashPassword(newPassword);

    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    return { success: true };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const email = this.sanitizeEmail(dto.email);
    if (!email) {
      throw new BadRequestException('Debes proporcionar un correo electrónico');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Debes proporcionar un correo válido');
    }

    const user = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { email: email.toLowerCase() }],
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      return { success: true };
    }

    const verificationCode = this.generateResetCode();
    const codeHash = this.hashResetCode(verificationCode);

    const verificationToken = await this.jwtService.signAsync(
      {
        email: user.email ?? email,
        codeHash,
        type: 'password-reset',
      },
      {
        expiresIn: '180s',
      },
    );

    const displayName = (user.username ?? '').toString().trim() || user.email || email;
    const safeName = this.escapeHtml(displayName);
    const textLines = [
      `Hola ${displayName},`,
      '',
      'Hemos recibido una solicitud para restablecer tu contraseña.',
      `Tu código de verificación es: ${verificationCode}`,
      'Este código caduca en 3 minutos.',
      '',
      'Si no solicitaste este cambio, puedes ignorar este mensaje.',
      '',
      'Equipo Holístico Hoffmann',
    ];

    const htmlMessage = [
      `<p>Hola ${safeName},</p>`,
      '<p>Hemos recibido una solicitud para restablecer tu contraseña.</p>',
      `<p style="font-size: 1.5rem; font-weight: 700; letter-spacing: 0.3rem;">${verificationCode}</p>`,
      '<p>Este código caduca en 3 minutos.</p>',
      '<p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>',
      '<p>Equipo Holístico Hoffmann</p>',
    ].join('');

    await this.mailService.sendMail({
      to: user.email ?? email,
      subject: 'Código de verificación para restablecer tu contraseña',
      text: textLines.join('\n'),
      html: htmlMessage,
    });

    return { success: true, token: verificationToken };
  }

  async verifyPasswordReset(dto: VerifyPasswordResetDto) {
    const email = this.sanitizeEmail(dto.email);
    const code = (dto.code ?? '').toString().trim();
    const newPassword = (dto.newPassword ?? '').toString().trim();
    const token = (dto.token ?? '').toString().trim();

    if (!email || !code || !newPassword || !token) {
      throw new BadRequestException('Debes proporcionar correo, código de verificación, token y la nueva contraseña');
    }

    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Debes proporcionar un correo válido');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');
    }

    let payload: { email?: string; codeHash?: string; type?: string } | null = null;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new BadRequestException('El código de verificación no es válido o ha expirado');
    }

    if (!payload || payload.type !== 'password-reset') {
      throw new BadRequestException('El código de verificación no es válido o ha expirado');
    }

    const payloadEmail = this.sanitizeEmail(payload.email);
    if (payloadEmail !== email) {
      throw new BadRequestException('El código de verificación no es válido o ha expirado');
    }

    const hashedCode = this.hashResetCode(code);
    if (!payload.codeHash || payload.codeHash !== hashedCode) {
      throw new BadRequestException('El código de verificación no es válido o ha expirado');
    }

    const user = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { email: email.toLowerCase() }],
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException('El código de verificación no es válido o ha expirado');
    }

    const hashedPassword = this.hashPassword(newPassword);

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    return { success: true };
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

  private async findUserWithPatientById(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const patient = await this.prisma.paciente.findFirst({
      where: { id_usuario: userId },
      select: {
        nombres: true,
        apellidos: true,
        contacto_correo: true,
        contacto_telefono: true,
      },
    });

    return {
      ...user,
      nombres: patient?.nombres ?? null,
      apellidos: patient?.apellidos ?? null,
      contacto_correo: patient?.contacto_correo ?? null,
      contacto_telefono: patient?.contacto_telefono ?? null,
    };
  }

  private sanitizeName(value: string | null | undefined) {
    return (value ?? '').toString().trim();
  }

  private sanitizeEmail(value: string | null | undefined) {
    return (value ?? '').toString().trim().toLowerCase();
  }

  private isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private normalizeAvatar(avatar: string | null | undefined) {
    const trimmed = (avatar ?? '').toString().trim();
    return trimmed.length ? trimmed : null;
  }

  private composeDisplayName(firstName: string, lastName: string, fallback: string) {
    const parts = [firstName, lastName]
      .map((value) => (value ?? '').toString().trim())
      .filter(Boolean);

    if (!parts.length) {
      const normalizedFallback = (fallback ?? '').toString().trim();
      return normalizedFallback || `${Date.now()}`;
    }

    return parts.join(' ');
  }

  private generateResetCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const length = 6;
    let code = '';
    for (let index = 0; index < length; index += 1) {
      const randomIndex = randomInt(alphabet.length);
      code += alphabet[randomIndex];
    }
    return code;
  }

  private hashResetCode(code: string): string {
    const normalized = code.replace(/\s+/g, '');
    return createHash('sha256').update(normalized).digest('hex');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

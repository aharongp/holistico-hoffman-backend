import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {

  private readonly jwtExpiresIn: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '3600s';
  }

  async login(loginDto: LoginDto) {
    const sanitizedIdentifier = (loginDto.identifier ?? '').trim();
    const sanitizedPassword = loginDto.password ?? '';

    if (!sanitizedIdentifier || !sanitizedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userRecord = await this.validateUser(sanitizedIdentifier, sanitizedPassword);
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

    if (typeof user.active !== 'undefined' && user.active !== null && Number(user.active) === 0) {
      throw new UnauthorizedException('User is inactive');
    }

    const passwordMatches = await this.comparePassword(password, user.password ?? '');
    if (!passwordMatches) {
      return null;
    }

    return user;
  }

  buildProfileResponse(user: any) {
    if (!user) return null;

    const normalizeRole = (role: string | null | undefined): string => {
      const value = (role ?? '').toString().trim().toLowerCase();
      if (['administrator', 'admin', 'administrador'].includes(value)) return 'administrator';
      if (['patient', 'paciente'].includes(value)) return 'patient';
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
      firstName: (user as any).nombres ?? '',
      lastName: (user as any).apellidos ?? '',
      role: normalizeRole(user.rol),
      avatar: user.avatar ?? null,
      createdAt: user.created_at ?? null,
      lastLogin: user.updated_at ?? null,
      isActive: typeof user.active === 'undefined' ? true : Number(user.active) === 1,
    };
  }

  private async comparePassword(plain: string, hashed: string): Promise<boolean> {
    if (!hashed) return false;

    const trimmedHash = hashed.trim();
    if (!trimmedHash) return false;

    const lowerHash = trimmedHash.toLowerCase();
    const md5Prefix = lowerHash.startsWith('md5:') ? lowerHash.slice(4) : lowerHash;
    const md5Pattern = /^[a-f0-9]{32}$/;
    if (md5Pattern.test(md5Prefix)) {
      const computed = createHash('md5').update(plain).digest('hex');
      return computed === md5Prefix;
    }

    const looksHashed = trimmedHash.startsWith('$2a$') || trimmedHash.startsWith('$2b$') || trimmedHash.startsWith('$2y$');
    if (looksHashed) {
      try {
        return await bcrypt.compare(plain, trimmedHash);
      } catch (err) {
        this.logger.error('bcrypt compare failed', err instanceof Error ? err.stack : String(err));
        return false;
      }
    }

    return plain === trimmedHash;
  }

}

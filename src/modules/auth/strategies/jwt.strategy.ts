import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'development-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        rol: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      typeof user.active !== 'undefined' &&
      user.active !== null &&
      Number(user.active) === 0
    ) {
      throw new UnauthorizedException('User is inactive');
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
}

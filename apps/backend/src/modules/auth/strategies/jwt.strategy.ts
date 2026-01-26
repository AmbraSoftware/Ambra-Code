import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
// FIX: Replaced failing import with a local type alias to resolve the type error.
// import { UserRole } from '@prisma/client';
type UserRole =
  | 'GLOBAL_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'CANTEEN_OPERATOR'
  | 'GUARDIAN'
  | 'STUDENT';

// Estrutura do payload decodificado do token JWT
interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-nodum',
    });
  }

  // Este método é chamado pelo Passport após a decodificação bem-sucedida do token.
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      // Selecionamos apenas os campos necessários para o contexto da aplicação.
      select: {
        id: true,
        email: true,
        role: true,
        schoolId: true,
        canteenId: true,
        deletedAt: true,
      },
    });

    // Fail-fast: Se o usuário não existe ou foi desativado, o token é inválido.
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Token inválido ou usuário desativado.');
    }

    // O objeto retornado aqui será anexado ao objeto `request` como `request.user`.
    // Omitimos `deletedAt` pois já foi validado.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { deletedAt, ...secureUserPayload } = user;
    return secureUserPayload;
  }
}

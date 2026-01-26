import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticatedUserPayload } from '../../modules/auth/dto/user-payload.dto';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  // FIX: Changed method to be async and return Promise<string> to match base class.
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as AuthenticatedUserPayload;

    // Usa o schoolId como chave para o rate limit de usuários autenticados,
    // o que isola o limite por tenant.
    if (user && user.schoolId) {
      return user.schoolId;
    }

    // Para requisições públicas ou sem schoolId, usa o tracker padrão (IP).
    return super.getTracker(req);
  }
}

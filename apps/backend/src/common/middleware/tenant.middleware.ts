/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestContext } from '../context/request-context';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const hostname = req.hostname;
    const tenantSlugHeader = req.headers['x-tenant-slug'] as string;

    // Se for localhost e não houver header, pode ser o Admin Global acessando
    if (!hostname && !tenantSlugHeader) {
      return next();
    }

    const identifier = tenantSlugHeader || hostname.split('.')[0];
    const cacheKey = `tenant:${identifier}`;

    let school: any = this.cacheService.get<any>(cacheKey);

    if (!school) {
      school = await this.prisma.school.findFirst({
        where: {
          OR: [{ slug: identifier }, { customDomain: hostname }],
        },
        select: { id: true, config: true },
      });

      if (school) {
        this.cacheService.set(cacheKey, school, 10 * 60 * 1000);
      }
    }

    /**
     * AJUSTE INDUSTRIAL:
     * Se não encontrar escola, NÃO damos 404 aqui.
     * Apenas não setamos o schoolId. O AuthGuard/RolesGuard
     * barrará o acesso se a rota exigir uma escola.
     */
    if (school) {
      RequestContext.set('schoolId', school.id);
      req['tenant'] = { id: school.id, config: school.config };
    }

    next();
  }
}

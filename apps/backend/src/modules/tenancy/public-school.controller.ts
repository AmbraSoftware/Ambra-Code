import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { RedisCacheService } from '../../common/cache/redis-cache.service';

@ApiTags('Public School (White-label)')
@Controller('public/school')
export class PublicSchoolController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisCacheService,
  ) {}

  @Get(':slug')
  @Public()
  @ApiOperation({
    summary: 'Busca configurações públicas da escola (Tema, Logo) via Slug.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações white-label localizadas.',
  })
  @ApiResponse({ status: 404, description: 'Escola não encontrada.' })
  async getSchoolConfig(@Param('slug') slug: string) {
    const cacheKey = `public_school_config:${slug}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const school = await this.prisma.school.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        config: true, // RAW JSON (Will be filtered)
        // [v4.1] Handshake de Features
        plan: {
          select: {
            features: true,
            maxStudents: true,
          },
        },
        system: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('Escola não encontrada ou slug inválido.');
    }

    // ELITE SECURITY: Extract only visual fields + Capabilities
    const config: any = school.config || {};
    const features = school.plan.features as any;

    const safeResponse = {
      id: school.id,
      name: school.name,
      slug: school.slug,
      logoUrl: config.logoUrl || null,
      primaryColor: config.primaryColor || null,
      heraldry: config.heraldry || null,

      // [v4.1] Capabilities Handshake
      activeFeatures: this.extractActiveFeatures(features),
      limits: {
        students: school.plan.maxStudents,
      },

      systemName: school.system.name,
    };

    // Cache for 10 minutes (600 seconds)
    await this.redisService.set(cacheKey, safeResponse, 600);

    return safeResponse;
  }

  private extractActiveFeatures(featuresJson: any): string[] {
    if (!featuresJson) return [];
    return Object.keys(featuresJson).filter((k) => featuresJson[k] === true);
  }
}

import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * METRICS MODULE v1.0.0
 * Módulo de métricas operacionais e dashboard administrativo.
 * Fornece dados em tempo real sobre pedidos, receita, usuários e estoque.
 */
@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}

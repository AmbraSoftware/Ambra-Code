import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisCacheService } from './redis-cache.service';

/**
 * Módulo de Cache Global.
 * Fornece instâncias singleton do CacheService (in-memory) e RedisCacheService (Redis)
 * para toda a aplicação.
 * A estratégia in-memory é ideal para cache de metadados como resolução de tenants.
 * O Redis é usado para cache distribuído e sessões.
 */
@Global()
@Module({
  providers: [CacheService, RedisCacheService],
  exports: [CacheService, RedisCacheService],
})
export class CacheModule {}

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

interface CacheEntry {
  value: any;
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> to avoid dependency on the NodeJS namespace.
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Serviço de cache em memória com TTL (Time-To-Live).
 * Uma solução leve e performática para armazenar dados temporários.
 * A principal vantagem é a redução de latência e carga no banco de dados para
 * consultas frequentes e de dados semi-estáticos, como informações de tenant.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly logger = new Logger(CacheService.name);

  /**
   * Obtém um valor do cache pela chave.
   * @param key A chave do cache.
   * @returns O valor armazenado ou `undefined` se a chave não existir ou tiver expirado.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    return entry ? entry.value : undefined;
  }

  /**
   * Adiciona ou atualiza um valor no cache com um tempo de vida (TTL).
   * @param key A chave do cache.
   * @param value O valor a ser armazenado.
   * @param ttlMilliseconds O tempo de vida do cache em milissegundos.
   */
  set<T>(key: string, value: T, ttlMilliseconds: number): void {
    const item = this.cache.get(key);
    if (item) {
      clearTimeout(item.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      this.cache.delete(key);
      this.logger.log(`Cache key expired and removed: ${key}`);
    }, ttlMilliseconds);

    // Não manter o event loop vivo apenas por timers de cache (especialmente em testes).
    // Em produção isso não afeta o comportamento; em testes evita "Jest did not exit".
    (timeoutId as any)?.unref?.();

    this.cache.set(key, { value, timeoutId });
  }

  /**
   * Remove um item do cache manualmente.
   * Útil para invalidação explícita quando os dados mudam.
   */
  del(key: string): void {
    const item = this.cache.get(key);
    if (item) {
      clearTimeout(item.timeoutId);
      this.cache.delete(key);
      this.logger.log(`Cache key manually removed: ${key}`);
    }
  }

  onModuleDestroy() {
    for (const [key, entry] of this.cache.entries()) {
      clearTimeout(entry.timeoutId);
      this.cache.delete(key);
    }
  }
}

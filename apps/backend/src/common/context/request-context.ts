import { AsyncLocalStorage } from 'async_hooks';

/**
 * Interface que define os dados globais da requisição.
 * schoolId: Essencial para o isolamento de Multi-tenancy (RLS).
 * userId: Essencial para logs de auditoria e permissões.
 */
export interface RequestContextData {
  schoolId: string | null;
  userId: string | null;
}

/**
 * RequestContext v3.8.1 - Master Industrial
 * * Esta classe utiliza o AsyncLocalStorage para permitir que qualquer serviço
 * (como o PrismaService ou o AuditService) aceda aos dados da requisição atual
 * sem a necessidade de "prop drilling" (passar o ID por todos os métodos).
 */
export class RequestContext {
  private static als = new AsyncLocalStorage<RequestContextData>();

  /**
   * Obtém um valor específico do contexto.
   * Retorna 'undefined' se for chamado fora de uma requisição ativa.
   */
  static get<T extends keyof RequestContextData>(
    key: T,
  ): RequestContextData[T] | undefined {
    const store = this.als.getStore();
    return store ? store[key] : undefined;
  }

  /**
   * Atualiza um valor no contexto da requisição atual.
   */
  static set<T extends keyof RequestContextData>(
    key: T,
    value: RequestContextData[T],
  ): void {
    const store = this.als.getStore();
    if (store) {
      store[key] = value;
    }
  }

  /**
   * Inicia o contexto para uma nova execução.
   * Geralmente chamado dentro do RequestContextInterceptor.
   */
  static run(defaults: RequestContextData, fn: () => any): any {
    return this.als.run(defaults, fn);
  }

  /**
   * Atalho para obter o objeto completo do contexto.
   */
  static getStore(): RequestContextData | undefined {
    return this.als.getStore();
  }

  /**
   * Verifica se existe um schoolId ativo no contexto atual.
   */
  static hasSchoolContext(): boolean {
    const store = this.als.getStore();
    return !!store?.schoolId;
  }
}
export const requestContext = RequestContext;

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Swagger Badge Decorators
 * 
 * Adiciona etiquetas visuais no Swagger UI para indicar status da rota:
 * - ✅ Verificado (Verde) - Rota testada e funcionando
 * - 🟡 Mock (Laranja) - Rota mockada para desenvolvimento
 * - ⚫ Morta/Legado (Cinza) - Rota deprecada ou não utilizada
 * - 🔴 Quebrada (Vermelho) - Rota com erro conhecido
 */

/**
 * Rota verificada e funcionando corretamente
 */
export function VerifiedRoute(
  summary: string,
  options?: { description?: string; deprecated?: boolean },
) {
  const badge = '✅';
  const fullSummary = `${badge} ${summary}`;
  
  return applyDecorators(
    ApiTags('✅ Verificado'),
    ApiOperation({
      summary: fullSummary,
      description: options?.description,
      deprecated: options?.deprecated,
    }),
  );
}

/**
 * Rota mockada (mock) para desenvolvimento/testes
 */
export function MockRoute(
  summary: string,
  options?: { description?: string; deprecated?: boolean },
) {
  const badge = '🟡';
  const fullSummary = `${badge} [MOCK] ${summary}`;
  
  const defaultDescription = options?.description
    ? `${options.description}\n\n> 📝 **Nota**: Esta é uma rota mockada para desenvolvimento.`
    : '📝 **Nota**: Esta é uma rota mockada para desenvolvimento.';

  return applyDecorators(
    ApiTags('🟡 Mock'),
    ApiOperation({
      summary: fullSummary,
      description: defaultDescription,
      deprecated: options?.deprecated,
    }),
  );
}

/**
 * Rota morta, legada ou deprecada
 */
export function LegacyRoute(
  summary: string,
  options?: { description?: string; replacement?: string },
) {
  const badge = '⚫';
  const fullSummary = `${badge} [LEGADO] ${summary}`;
  
  let fullDescription = options?.description || '';
  fullDescription += '\n\n> ⚠️ **Atenção**: Esta rota está deprecada ou não está em uso.';
  
  if (options?.replacement) {
    fullDescription += `\n> \n> Use em vez disso: \`${options.replacement}\``;
  }

  return applyDecorators(
    ApiTags('⚫ Legado/Morto'),
    ApiOperation({
      summary: fullSummary,
      description: fullDescription,
      deprecated: true,
    }),
  );
}

/**
 * Rota com erro conhecido ou quebrada
 */
export function BrokenRoute(
  summary: string,
  options?: { description?: string; issue?: string },
) {
  const badge = '🔴';
  const fullSummary = `${badge} [QUEBRADA] ${summary}`;
  
  let fullDescription = options?.description || '';
  fullDescription += '\n\n> 🐛 **Atenção**: Esta rota tem um problema conhecido.';
  
  if (options?.issue) {
    fullDescription += `\n> Issue: ${options.issue}`;
  }

  return applyDecorators(
    ApiTags('🔴 Quebrada'),
    ApiOperation({
      summary: fullSummary,
      description: fullDescription,
    }),
  );
}

/**
 * Rota em desenvolvimento/WIP
 */
export function WipRoute(
  summary: string,
  options?: { description?: string },
) {
  const badge = '🚧';
  const fullSummary = `${badge} [WIP] ${summary}`;
  
  const defaultDescription = options?.description
    ? `${options.description}\n\n> 🚧 **Atenção**: Esta rota está em desenvolvimento e pode mudar.`
    : '🚧 **Atenção**: Esta rota está em desenvolvimento e pode mudar.';

  return applyDecorators(
    ApiTags('🚧 Em Desenvolvimento'),
    ApiOperation({
      summary: fullSummary,
      description: defaultDescription,
    }),
  );
}

/**
 * Rota que requer atenção especial (privilégios, configuração, etc)
 */
export function AttentionRoute(
  summary: string,
  options?: { description?: string; warning?: string },
) {
  const badge = '⚠️';
  const fullSummary = `${badge} ${summary}`;
  
  let fullDescription = options?.description || '';
  if (options?.warning) {
    fullDescription += `\n\n> ⚠️ **Importante**: ${options.warning}`;
  }

  return applyDecorators(
    ApiTags('⚠️ Atenção'),
    ApiOperation({
      summary: fullSummary,
      description: fullDescription,
    }),
  );
}

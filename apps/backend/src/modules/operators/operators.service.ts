import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../asaas/asaas.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class OperatorsService {
  private readonly logger = new Logger(OperatorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Creates a new Operator and its associated Asaas Subaccount.
   */
  async createOperator(data: {
    name: string;
    taxId: string; // CPF/CNPJ
    email: string;
    mobilePhone?: string;
    postalCode: string;
    address: string;

    // White-label info (optional in creation, usually done via Profile update, but here for completeness)
  }) {
    this.logger.log(`Onboarding Operator ${data.name}...`);

    // 1. Create Subaccount in Asaas
    // We do this BEFORE DB to ensure we have the financial keys.
    // If it fails, we abort.
    let asaasAccount;
    try {
      asaasAccount = await this.asaasService.createSubAccount({
        name: data.name,
        email: data.email,
        cpfCnpj: data.taxId,
        mobilePhone: data.mobilePhone,
        postalCode: data.postalCode,
        address: data.address,
        addressNumber: '0', // Default or fetch from address split
      });
    } catch (e) {
      this.logger.error('Failed to create Asaas Subaccount', e);
      throw new BadRequestException(
        'Falha ao criar subconta financeira: ' + e.message,
      );
    }

    // 2. Persist Operator
    const operator = await this.prisma.operator.create({
      data: {
        name: data.name,
        taxId: data.taxId,
        asaasId: asaasAccount.id,
        asaasApiKey: this.encryptionService.encrypt(asaasAccount.apiKey), // Criptografado!
        asaasWalletId: asaasAccount.walletId,
      },
    });

    this.logger.log(`Operator created with Asaas ID ${operator.asaasId}`);

    return operator;
  }

  async findAll() {
    return this.prisma.operator.findMany({
      include: {
        _count: { select: { canteens: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, data: any) {
    // Check if exists
    const existing = await this.prisma.operator.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Operador não encontrado');

    // Update in Asaas if necessary (Address, Phone, etc.)
    // For now, only local update
    return this.prisma.operator.update({
      where: { id },
      data: {
        name: data.name,
        taxId: data.taxId,
        // Add other fields as per schema
      },
    });
  }

  async remove(id: string) {
    // Check constraints
    const canteens = await this.prisma.canteen.count({
      where: { operatorId: id },
    });
    if (canteens > 0) {
      throw new BadRequestException(
        'Não é possível remover operador com cantinas ativas.',
      );
    }

    return this.prisma.operator.delete({ where: { id } });
  }

  /**
   * Retorna as credenciais Asaas descriptografadas do operador
   * @param operatorId ID do operador
   * @returns Credenciais descriptografadas
   */
  async getDecryptedCredentials(operatorId: string) {
    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
      select: { asaasId: true, asaasApiKey: true, asaasWalletId: true },
    });

    if (!operator) {
      throw new NotFoundException('Operador não encontrado');
    }

    return {
      asaasId: operator.asaasId,
      asaasApiKey: operator.asaasApiKey
        ? this.encryptionService.decrypt(operator.asaasApiKey)
        : null,
      asaasWalletId: operator.asaasWalletId,
    };
  }

  /**
   * Busca operador por ID (sem expor credenciais sensíveis)
   */
  async findByIdSecure(operatorId: string) {
    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
      select: {
        id: true,
        name: true,
        taxId: true,
        asaasId: true,
        asaasWalletId: true,
        // NÃO inclui asaasApiKey
        createdAt: true,
        updatedAt: true,
      },
    });

    return operator;
  }

  /**
   * [v4.8] Configura subconta Asaas para operador existente (seed/demo)
   * 
   * Esta função permite que SUPER_ADMIN configure subcontas reais do Asaas Sandbox
   * para operadores que foram criados via seed com dados fake.
   * 
   * É idempotente - se a subconta já existe, retorna os dados atuais.
   * 
   * @param operatorId ID do operador
   * @param data Dados necessários para criar a subconta Asaas
   * @returns Operador com credenciais Asaas configuradas
   */
  async setupAsaasSubaccount(
    operatorId: string,
    data: {
      mobilePhone: string;
      postalCode: string;
      address: string;
      addressNumber: string;
      birthDate?: string;
      incomeValue?: number;
    },
  ) {
    this.logger.log(`[SetupAsaas] Iniciando setup para operador ${operatorId}`);

    // 1. Buscar operador
    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator) {
      throw new NotFoundException('Operador não encontrado');
    }

    // 2. Verificar se já tem subconta válida (não fake)
    const hasValidSubaccount =
      operator.asaasId &&
      !operator.asaasId.startsWith('wall_') &&
      operator.asaasApiKey;

    if (hasValidSubaccount) {
      this.logger.log(
        `[SetupAsaas] Operador ${operatorId} já possui subconta válida: ${operator.asaasId}`,
      );
      return {
        success: true,
        message: 'Operador já possui subconta Asaas configurada',
        operator: await this.findByIdSecure(operatorId),
        alreadyConfigured: true,
      };
    }

    // 3. Validar dados obrigatórios
    if (!operator.taxId) {
      throw new BadRequestException(
        'Operador não possui CPF/CNPJ (taxId) cadastrado',
      );
    }

    // 4. Criar subconta no Asaas
    this.logger.log(
      `[SetupAsaas] Criando subconta Asaas para ${operator.name} (${operator.taxId})`,
    );

    let asaasAccount;
    try {
      const isCompany = operator.taxId.length > 11;
      
      asaasAccount = await this.asaasService.createSubAccount({
        name: operator.name,
        email: `financeiro+${operatorId}@demo.ambra.io`, // Email único por operador
        cpfCnpj: operator.taxId,
        mobilePhone: data.mobilePhone,
        postalCode: data.postalCode,
        address: data.address,
        addressNumber: data.addressNumber,
        companyType: isCompany ? 'LIMITED' : 'INDIVIDUAL',
        birthDate: !isCompany ? data.birthDate : undefined,
        incomeValue: !isCompany ? (data.incomeValue || 3000) : undefined,
      });
    } catch (error: any) {
      this.logger.error(
        `[SetupAsaas] Falha ao criar subconta Asaas:`,
        error.message,
      );
      throw new BadRequestException(
        `Falha ao criar subconta Asaas: ${error.message}`,
      );
    }

    // 5. Atualizar operador com credenciais reais
    const updatedOperator = await this.prisma.operator.update({
      where: { id: operatorId },
      data: {
        mobilePhone: data.mobilePhone,
        postalCode: data.postalCode,
        address: data.address,
        addressNumber: data.addressNumber,
        asaasId: asaasAccount.id,
        asaasApiKey: this.encryptionService.encrypt(asaasAccount.apiKey),
        asaasWalletId: asaasAccount.walletId,
      },
    });

    this.logger.log(
      `[SetupAsaas] ✓ Subconta criada com sucesso: ${asaasAccount.id}`,
    );

    return {
      success: true,
      message: 'Subconta Asaas configurada com sucesso',
      operator: await this.findByIdSecure(operatorId),
      asaasAccount: {
        id: asaasAccount.id,
        walletId: asaasAccount.walletId,
        // Não retorna apiKey por segurança
      },
      alreadyConfigured: false,
    };
  }

  async linkSchool(user: any, accessCode: string) {
    // 1. Encontrar a escola pelo "código" (slug ou taxId)
    const school = await this.prisma.school.findFirst({
      where: {
        OR: [
          { slug: accessCode },
          { taxId: accessCode }, // Busca por CNPJ
        ],
      },
    });

    if (!school) {
      throw new NotFoundException('Escola não encontrada com este código.');
    }

    // 2. Identificar o Operador do usuário atual
    let operatorId: string | null = null;

    // Se o usuário tem um operatorId direto (assumindo que User tem esse campo, se não, usamos a lógica da cantina)
    // No schema atual, o vínculo pode ser indireto. Vamos verificar se o user é um operador.
    // Para simplificar, assumimos que o MERCHANT_ADMIN foi criado junto com o Operator.

    // Buscar se o usuário administra alguma cantina ou operador
    // Esta lógica depende do seu schema exato.
    // Vamos assumir que o usuário logado (MERCHANT_ADMIN) deve estar vinculado a uma cantina ou operador.

    // Alternativa: Se o usuário ainda não tem cantina, ele pode estar "solto".
    // Mas ele precisa estar atrelado a um `Operator` (entidade fiscal).

    // Se não tivermos o ID do operador no token, precisamos buscá-lo.
    // Vamos assumir que o usuário foi criado no contexto de um Operator.

    // [FIX] Buscando o operador associado ao usuário (se houver tabela de vínculo ou campo)
    // Se não houver, isso é um problema de modelagem.
    // Assumindo que o usuário tem um `operatorId` ou similar.

    // Fallback: Se o usuário tem uma cantina, pegamos o operador dela.
    if (user.canteenId) {
      const canteen = await this.prisma.canteen.findUnique({
        where: { id: user.canteenId },
        select: { operatorId: true },
      });
      operatorId = canteen?.operatorId || null;
    } else {
      // Tentar encontrar uma cantina onde este usuário é staff?
      // Ou assumir que o usuário DEVE ter um operatorId no payload do token se for MERCHANT_ADMIN?
      // Se não tiver, vamos buscar a primeira cantina vinculada a ele (se houver relação N:N)

      // Simplificação: Vamos assumir que o usuário MERCHANT_ADMIN tem acesso a um Operator.
      // Se o seu sistema permite múltiplos operadores, isso precisa ser revisto.
      // Por hora, vamos lançar erro se não encontrar.
      throw new BadRequestException(
        'Usuário não está vinculado a uma operação ativa. Contate o suporte.',
      );
    }

    if (!operatorId) {
      throw new BadRequestException('Operador fiscal não identificado.');
    }

    // 3. Verificar se já existe vínculo
    const existingCanteen = await this.prisma.canteen.findFirst({
      where: {
        schoolId: school.id,
        operatorId: operatorId,
      },
    });

    if (existingCanteen) {
      return {
        success: true,
        message: `Já vinculado à escola ${school.name}.`,
        schoolId: school.id,
        schoolName: school.name,
        canteen: existingCanteen,
      };
    }

    // 4. Criar vínculo (Nova Cantina)
    const newCanteen = await this.prisma.canteen.create({
      data: {
        name: `Cantina - ${school.name}`,
        schoolId: school.id,
        operatorId: operatorId,
        type: 'COMMERCIAL',
        status: 'ACTIVE',
      },
    });

    return {
      success: true,
      message: `Vinculado à escola ${school.name} com sucesso!`,
      schoolId: school.id,
      schoolName: school.name,
      canteen: newCanteen,
    };
  }
}

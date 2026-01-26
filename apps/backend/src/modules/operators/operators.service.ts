import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../asaas/asaas.service';

@Injectable()
export class OperatorsService {
  private readonly logger = new Logger(OperatorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) { }

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
        asaasApiKey: asaasAccount.apiKey, // Storing API Key securely
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
        }
    });
  }

  async remove(id: string) {
    // Check constraints
    const canteens = await this.prisma.canteen.count({ where: { operatorId: id } });
    if (canteens > 0) {
        throw new BadRequestException('Não é possível remover operador com cantinas ativas.');
    }

    return this.prisma.operator.delete({ where: { id } });
  }

  async linkSchool(user: any, accessCode: string) {
    // 1. Encontrar a escola pelo "código" (slug ou taxId)
    const school = await this.prisma.school.findFirst({
        where: {
            OR: [
                { slug: accessCode },
                { taxId: accessCode } // Busca por CNPJ
            ]
        }
    });

    if (!school) {
        throw new NotFoundException('Escola não encontrada com este código.');
    }

    // 2. Identificar o Operador do usuário atual
    let operatorId: string | null = null;
    
    // Se o usuário tem um operatorId direto (assumindo que User tem esse campo, se não, usamos a lógica da cantina)
    // No schema atual, o vínculo pode ser indireto. Vamos verificar se o user é um operador.
    // Para simplificar, assumimos que o OPERATOR_ADMIN foi criado junto com o Operator.
    
    // Buscar se o usuário administra alguma cantina ou operador
    // Esta lógica depende do seu schema exato. 
    // Vamos assumir que o usuário logado (OPERATOR_ADMIN) deve estar vinculado a uma cantina ou operador.
    
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
            select: { operatorId: true }
        });
        operatorId = canteen?.operatorId || null;
    } else {
        // Tentar encontrar uma cantina onde este usuário é staff?
        // Ou assumir que o usuário DEVE ter um operatorId no payload do token se for OPERATOR_ADMIN?
        // Se não tiver, vamos buscar a primeira cantina vinculada a ele (se houver relação N:N)
        
        // Simplificação: Vamos assumir que o usuário OPERATOR_ADMIN tem acesso a um Operator.
        // Se o seu sistema permite múltiplos operadores, isso precisa ser revisto.
        // Por hora, vamos lançar erro se não encontrar.
        throw new BadRequestException('Usuário não está vinculado a uma operação ativa. Contate o suporte.');
    }
    
    if (!operatorId) {
         throw new BadRequestException('Operador fiscal não identificado.');
    }

    // 3. Verificar se já existe vínculo
    const existingCanteen = await this.prisma.canteen.findFirst({
        where: {
            schoolId: school.id,
            operatorId: operatorId
        }
    });

    if (existingCanteen) {
        return {
            success: true,
            message: `Já vinculado à escola ${school.name}.`,
            schoolId: school.id,
            schoolName: school.name,
            canteen: existingCanteen
        };
    }

    // 4. Criar vínculo (Nova Cantina)
    const newCanteen = await this.prisma.canteen.create({
        data: {
            name: `Cantina - ${school.name}`,
            schoolId: school.id,
            operatorId: operatorId,
            type: 'COMMERCIAL',
            status: 'ACTIVE'
        }
    });

    return {
        success: true,
        message: `Vinculado à escola ${school.name} com sucesso!`,
        schoolId: school.id,
        schoolName: school.name,
        canteen: newCanteen
    };
  }
}

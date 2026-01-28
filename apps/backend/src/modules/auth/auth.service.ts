import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException, // [FIX] Added missing import
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole, SchoolStatus } from '@prisma/client';
import { UserProfileDto } from './dto/user-payload.dto';
import { RegisterDto } from './dto/register.dto';
import { AsaasService } from '../asaas/asaas.service'; // [FIX] Import AsaasService

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly asaasService: AsaasService, // [FIX] Inject AsaasService
  ) { }

  /**
   * Autentica um usuário com base em suas credenciais.
   * O 'porquê': A lógica vai além da simples verificação de senha. Ela também valida
   * o status da escola (tenant), impedindo que usuários de escolas suspensas ou canceladas
   * acessem o sistema. Isso é uma regra de negócio de segurança crítica para um SaaS multi-tenant.
   * @param loginDto - O DTO contendo email e senha.
   * @returns Um objeto com o token de acesso e um resumo do perfil do usuário.
   * @throws {UnauthorizedException} Se as credenciais forem inválidas.
   * @throws {ForbiddenException} Se a escola do usuário não estiver ativa.
   * @throws {InternalServerErrorException} Se houver um erro na geração do token.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        school: {
          select: { status: true },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    this.validateTenantAccess(user.roles as unknown as UserRole[], user.school?.status as SchoolStatus);

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles as unknown as UserRole[],
      schoolId: user.schoolId,
      mustChangePassword: user.mustChangePassword, // [v4.5] Security flag
    };

    try {
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          name: user.name,
          roles: user.roles as unknown as UserRole[],
          schoolId: user.schoolId,
          mustChangePassword: user.mustChangePassword,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao gerar token de acesso.');
    }
  }

  /**
   * Obtém um perfil de usuário seguro para exibição no frontend.
   * O 'porquê': Seleciona explicitamente (`select`) apenas os campos não sensíveis,
   * garantindo que informações como hash de senha ou data de exclusão nunca sejam
   * acidentalmente expostas, aderindo ao princípio de "data minimization".
   * @param userId - O ID do usuário extraído do token JWT.
   * @returns Um DTO com os dados públicos do perfil do usuário.
   * @throws {NotFoundException} Se o usuário não for encontrado ou estiver desativado.
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        schoolId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user as unknown as UserProfileDto;
  }

  /**
   * Valida se um usuário (não-global) pode acessar seu tenant.
   * @param roles As roles do usuário.
   * @param schoolStatus O status da escola associada.
   */
  private validateTenantAccess(roles: UserRole[], schoolStatus?: SchoolStatus) {
    // [v5.0] Multi-Role Support
    if (roles.includes('SUPER_ADMIN' as UserRole)) return;

    if (!schoolStatus || schoolStatus !== SchoolStatus.ACTIVE) {
      throw new ForbiddenException(
        'Acesso bloqueado. A unidade escolar não está ativa.',
      );
    }
  }
  /**
   * Registra um novo tenant (Escola ou Operador) e seu administrador inicial.
   * [v3.8.5] PLG Flow: Cria Subconta Asaas e Assinatura Automaticamente.
   */
  async register(dto: RegisterDto) {
    const { email, password, profileType, entityName, taxId, consentVersion } =
      dto;

    // 1. Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('Email já cadastrado.');
    }

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Transaction with External API Integration
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // A. Fetch Defaults
          const defaultSystem = await tx.platformSystem.findFirst();
          if (!defaultSystem)
            throw new InternalServerErrorException('System not configured.');

          const planId = dto.planId;
          let selectedPlan;

          if (planId) {
            selectedPlan = await tx.plan.findUnique({ where: { id: planId } });
          }
          if (!selectedPlan) {
            selectedPlan = await tx.plan.findFirst();
          }
          if (!selectedPlan)
            throw new InternalServerErrorException('Plans not configured.');

          // B. Prepare Variables
          let schoolId: string | null = null;
          let operatorId: string | null = null;
          let asaasWalletId: string | null = null;
          let asaasApiKey: string | null = null;
          let asaasAccountId: string | null = null;

          // C. [PLG] Create Asaas Subaccount (Blocking Step)
          // We do this INSIDE the transaction logic block but it's an external side-effect.
          // Both Schools and Operators need a Wallet to receive/split funds.
          if (profileType === 'school' || profileType === 'operator') {
            if (
              !dto.mobilePhone ||
              !dto.postalCode ||
              !dto.address ||
              !dto.addressNumber
            ) {
              throw new BadRequestException(
                'Para ativação financeira (Asaas), endereço e celular são obrigatórios.',
              );
            }

            try {
              const asaasAccount = await this.asaasService.createSubAccount({
                name: entityName,
                cpfCnpj: taxId,
                email: email,
                mobilePhone: dto.mobilePhone,
                postalCode: dto.postalCode,
                address: dto.address,
                addressNumber: dto.addressNumber,
                companyType: taxId.length > 11 ? 'LIMITED' : 'INDIVIDUAL',
                birthDate: dto.birthDate, // [v4.6] Required for CPF
                incomeValue: dto.incomeValue || 3000, // [v4.7] Default Income for Micro-entrepreneurs
              });

              asaasWalletId = asaasAccount.walletId;
              asaasApiKey = asaasAccount.apiKey;
              asaasAccountId = asaasAccount.id;
            } catch (error) {
              // This throws, causing Transaction Rollback
              throw new BadRequestException(
                'Falha na criação da Conta Digital Asaas: ' +
                (error.message || 'Erro desconhecido'),
              );
            }
          }

          // D. Create Entities (DB Write)
          if (profileType === 'school') {
            const school = await tx.school.create({
              data: {
                name: entityName,
                taxId: taxId,
                slug:
                  entityName.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
                  '-' +
                  Date.now(),
                status: 'PENDING',
                systemId: defaultSystem.id,
                planId: selectedPlan.id,

                // [v4.6] Coherence: Store Address & Asaas IDs Correctly
                mobilePhone: dto.mobilePhone,
                postalCode: dto.postalCode,
                address: dto.address,
                addressNumber: dto.addressNumber,

                asaasWalletId: asaasWalletId,
                asaasApiKey: asaasApiKey,
                asaasAccountId: asaasAccountId, // [NEW] Subaccount ID (acc_...)
                asaasCustomerId: null, // [NEW] Will be filled if they subscribe (cus_...)
              },
            });
            schoolId = school.id;
          } else {
            const operator = await tx.operator.create({
              data: {
                name: entityName,
                taxId: taxId,
                asaasApiKey: asaasApiKey,
                asaasWalletId: asaasWalletId,
                asaasId: asaasAccountId, // Subaccount ID

                // [v4.6] Coherence: Store Address
                mobilePhone: dto.mobilePhone,
                postalCode: dto.postalCode,
                address: dto.address,
                addressNumber: dto.addressNumber,
              },
            });
            operatorId = operator.id;
          }

          // E. Create User
          const user = await tx.user.create({
            data: {
              name: email.split('@')[0],
              email,
              passwordHash,
              // [v5.0] Multi-Role Support
              roles: [
                profileType === 'school'
                  ? 'SCHOOL_ADMIN'
                  : 'MERCHANT_ADMIN'
              ] as any,
              role: profileType === 'school' ? UserRole.SCHOOL_ADMIN : 'MERCHANT_ADMIN' as any, // Legacy
              schoolId: schoolId,
              termsAccepted: true,
              termsVersion: consentVersion,
            },
          });

          // F. Create Consent Log
          await tx.consentLog.create({
            data: {
              userId: user.id,
              action: 'REGISTER_TERMS',
              version: consentVersion,
              ipAddress: '127.0.0.1',
              userAgent: 'Browser',
            },
          });

          return { user, schoolId, selectedPlan };
        },
        {
          maxWait: 10000, // Increase timeout for external API
          timeout: 20000,
        },
      );

      // 4. [Post-Transaction] Create Subscription (Non-Blocking / Best Effort)
      // The User/School is safe in DB. Now we try to bill them.
      if (
        profileType === 'school' &&
        result.schoolId &&
        result.selectedPlan &&
        Number(result.selectedPlan.price) > 0
      ) {
        try {
          // Create Subscription in Master Account (Charging the School)
          const customerId = await this.asaasService.ensureCustomer({
            name: entityName,
            cpfCnpj: taxId,
            email: email,
          });

          const sub = await this.asaasService.createSubscription({
            customer: customerId,
            billingType: 'BOLETO',
            value: Number(result.selectedPlan.price),
            nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0], // 7 Days Trial
            cycle: 'MONTHLY',
            description: `Plano Ambra ${result.selectedPlan.name} - Assinatura SaaS`,
          });

          await this.prisma.school.update({
            where: { id: result.schoolId },
            data: {
              asaasCustomerId: customerId,
              subscriptionId: sub.id,
            },
          });
        } catch (billingError) {
          console.error(
            '[PLG Billing Error] Failed to create subscription:',
            billingError.message,
          );
          // Silent Fail: Support will fix manually in Console
        }
      }

      return {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
      };
    } catch (error) {
      throw error; // Re-throw to controller
    }
  }

  /**
   * [v4.5] Change Password with Token Refresh
   * O 'porquê': Após trocar a senha, o usuário recebe um novo JWT com mustChangePassword: false,
   * evitando logout/login manual e melhorando a UX.
   * @param userId - ID do usuário autenticado
   * @param newPassword - Nova senha
   * @returns Novo access_token e dados do usuário atualizados
   */
  async changePassword(userId: string, newPassword: string) {
    // 1. Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 2. Update user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false, // Reset flag
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        mustChangePassword: true,
      },
    });

    // 3. Generate new JWT with updated flag
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      mustChangePassword: user.mustChangePassword, // Now false
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}

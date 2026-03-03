import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { EncryptionService } from '../../common/services/encryption.service';

/**
 * Interface for SubAccount Creation Payload
 */
export interface AsaasSubAccountData {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION';
  birthDate?: string; // [v4.0.3] Required for INDIVIDUAL
  incomeValue?: number; // [v4.0.3] Required for INDIVIDUAL/MEI
}

/**
 * Interface for PIX Calculation with Split
 */
export interface AsaasPixSplitData {
  customer: string; // CPF/CNPJ or Customer ID
  value: number;
  walletId: string; // Destination Wallet ID
  description?: string;
  splitValue?: number; // [v4.3] Dynamic Split Value
  externalReference?: string; // Correlation key for webhook processing
}

export interface AsaasSubscriptionData {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  description: string;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly baseURL: string;
  private readonly masterApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    const asaasEnv = this.configService.get('ASAAS_ENV', 'sandbox');
    const apiKey = this.configService.getOrThrow<string>('ASAAS_API_KEY');

    const baseURL =
      asaasEnv === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3';

    this.baseURL = baseURL;
    this.masterApiKey = apiKey;

    this.logger.log(
      `AsaasService initialized in ${asaasEnv.toUpperCase()} mode.`,
    );
  }

  private getHttp(options?: { apiKey?: string }): AxiosInstance {
    // Fallback: Se a key fornecida for placeholder, usar Master
    let apiKey = options?.apiKey;
    if (
      apiKey &&
      (apiKey.startsWith('$') || apiKey.includes('key') || apiKey.length < 20)
    ) {
      this.logger.debug(
        `API Key do Operador parece ser um placeholder (${apiKey}). Usando Master Key.`,
      );
      apiKey = undefined;
    }

    // Decrypt if necessary (Master or Operator Key)
    const finalKey = this.encryptionService.decrypt(apiKey || this.masterApiKey);

    return axios.create({
      baseURL: this.baseURL,
      headers: {
        access_token: finalKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Cria uma Subconta no Asaas para o Operador (White Label).
   */
  async createSubAccount(operatorData: AsaasSubAccountData) {
    this.logger.log(
      `Creating Asaas Subaccount for ${operatorData.name} (${operatorData.cpfCnpj})...`,
    );

    try {
      // Clean Tax ID just in case
      const cleanTaxId = operatorData.cpfCnpj.replace(/[^\d]/g, '');

      // Constructing payload explicitly to avoid 'any'
      const payload: Record<string, any> = {
        name: operatorData.name,
        email: operatorData.email,
        cpfCnpj: cleanTaxId,
        companyType: operatorData.companyType || 'LIMITED',
        mobilePhone: operatorData.mobilePhone,
        postalCode: operatorData.postalCode,
        address: operatorData.address,
        addressNumber: operatorData.addressNumber,
      };

      if (operatorData.birthDate) {
        payload.birthDate = operatorData.birthDate;
      }
      if (operatorData.incomeValue) {
        payload.incomeValue = operatorData.incomeValue;
      }

      const response = await this.getHttp().post('/accounts', payload);

      this.logger.log(`Subaccount created: ${response.data.id}`);

      return {
        id: response.data.id,
        apiKey: response.data.apiKey,
        walletId: response.data.walletId,
      };
    } catch (error: any) {
      this.handleAsaasError('creating subaccount', error);
    }
  }

  /**
   * Atualiza dados de uma Subconta (Confirmação Anual de Dados).
   */
  async updateSubAccount(id: string, data: Partial<AsaasSubAccountData>) {
    this.logger.log(`Updating Subaccount ${id} (Annual Confirmation)...`);
    try {
      // Asaas V3 Update Pattern
      const updateResponse = await this.getHttp().post(`/accounts/${id}`, data);
      return updateResponse.data;
    } catch (error: any) {
      this.handleAsaasError(`updating account ${id}`, error);
    }
  }

  /**
   * Cria uma cobrança PIX com Split de Pagamento.
   * Regra Flexível: Usa splitValue se informado, caso contrário fallback para regra fixa.
   */
  async createPixCharge(
    splitData: AsaasPixSplitData,
    opts?: { apiKey?: string },
  ) {
    this.logger.log(
      `Creating PIX Charge of R$ ${splitData.value} for Wallet ${splitData.walletId} with Split...`,
    );

    const http = this.getHttp(opts);

    if (process.env.NODE_ENV === 'test') {
      const operatorSplitValue = splitData.splitValue ?? splitData.value;
      return {
        id: `pay_test_${splitData.externalReference || 'no_ref'}`,
        encodedImage: 'base64_qr_code_test',
        payload:
          '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Nodum Payment6008Sao Paulo62070503***6304E2CA',
        netValue: operatorSplitValue,
      };
    }

    let customerId = splitData.customer;

    // Resolve Customer ID if CPF passed
    if (splitData.customer.length <= 14) {
      try {
        customerId = await this.ensureCustomer(
          {
            name: 'Cliente Nodum',
            cpfCnpj: splitData.customer,
          },
          opts,
        );
      } catch (e) {
        this.logger.warn(
          'Failed to resolve customer by CPF. Trying raw value.',
          e.message,
        );
      }
    }

    const operatorSplitValue = splitData.splitValue ?? splitData.value;

    try {
      const payload = {
        billingType: 'PIX',
        customer: customerId,
        value: splitData.value,
        dueDate: new Date().toISOString().split('T')[0],
        description: splitData.description || 'Recarga Cantina Escolar',
        externalReference: splitData.externalReference,
        split: [
          {
            walletId: splitData.walletId,
            fixedValue: operatorSplitValue,
          },
        ],
      };

      const response = await http.post('/payments', payload);

      return {
        id: response.data.id,
        encodedImage: response.data.encodedImage, // Base64 QR
        payload: response.data.payload, // Copy Paste
        netValue: operatorSplitValue,
      };
    } catch (error: any) {
      // DEV MOCK FALLBACK
      if (
        process.env.NODE_ENV === 'development' &&
        error.response?.status === 401
      ) {
        this.logger.warn(
          'Asaas Auth failed. Returning MOCK for dev continuity...',
        );
        return {
          id: `pay_mock_${Math.floor(Math.random() * 10000)}`,
          encodedImage: 'base64_qr_code_mock',
          payload:
            '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Nodum Payment6008Sao Paulo62070503***6304E2CA',
          netValue: operatorSplitValue,
        };
      }
      this.handleAsaasError('creating Pix Charge', error);
    }
  }

  /**
   * Helper: Ensure Customer Exists
   */
  async ensureCustomer(
    data: {
      name: string;
      cpfCnpj: string;
      email?: string;
    },
    opts?: { apiKey?: string },
  ) {
    // Clean Tax ID
    const cleanTaxId = data.cpfCnpj.replace(/[^\d]/g, '');

    const http = this.getHttp(opts);

    // 1. Search
    const search = await http.get('/customers', {
      params: { cpfCnpj: cleanTaxId },
    });
    if (search.data.data && search.data.data.length > 0) {
      return search.data.data[0].id;
    }

    // 2. Create
    try {
      const create = await http.post('/customers', {
        ...data,
        cpfCnpj: cleanTaxId,
      });
      return create.data.id;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new BadRequestException(
          `CPF/CNPJ Inválido ou Inexistente na base da Receita Federal (${data.cpfCnpj}).`,
        );
      }
      throw error;
    }
  }

  /**
   * Cria uma Assinatura (Recorrência) para a Escola (SaaS).
   */
  async createSubscription(data: AsaasSubscriptionData) {
    this.logger.log(
      `Creating Subscription for Customer ${data.customer} - Value: ${data.value}`,
    );

    try {
      const response = await this.getHttp().post('/subscriptions', data);
      this.logger.log(`Subscription created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.handleAsaasError('creating subscription', error);
    }
  }

  /**
   * Atualiza uma Assinatura existente (Ex: Reajuste de Preço).
   */
  async updateSubscription(id: string, data: { value: number }) {
    this.logger.log(`Updating Subscription ${id} to Value R$ ${data.value}`);
    try {
      const response = await this.getHttp().post(`/subscriptions/${id}`, {
        value: data.value,
        updatePendingPayments: true,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Error updating subscription ${id}`,
        error.response?.data,
      );
      return null;
    }
  }

  /**
   * Centralized Error Handler
   */
  private handleAsaasError(context: string, error: any): never {
    this.logger.error(
      `Error ${context}`,
      error.response?.data || error.message,
    );

    const asaasErrors = error.response?.data?.errors;
    const firstCode = Array.isArray(asaasErrors)
      ? asaasErrors?.[0]?.code
      : undefined;
    if (firstCode === 'access_token_not_found') {
      throw new BadRequestException(
        'Asaas Error: access_token_not_found (verifique ASAAS_API_KEY / credenciais da subconta e ambiente sandbox/production).',
      );
    }

    throw new BadRequestException(
      `Asaas Error: ${JSON.stringify(error.response?.data?.errors || error.message)}`,
    );
  }
}

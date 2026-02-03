import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenAI | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.API_KEY) {
      this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      this.logger.warn(
        'Gemini API key is not configured. AiService will not work.',
      );
    }
  }

  /**
   * Verifica a disponibilidade do serviço de IA.
   * Usado pelo Health Check para garantir que a chave de API está configurada.
   * @returns Uma promessa que resolve para `true` se o serviço estiver pronto.
   * @throws {Error} Se a chave de API do Gemini não estiver configurada.
   */

  async ping(): Promise<boolean> {
    if (!this.genAI) {
      throw new Error('Gemini API Key not configured');
    }
    return true;
  }

  /**
   * Gera um relatório nutricional personalizado para um aluno com base em seu histórico de consumo recente.
   * O 'porquê': Esta funcionalidade agrega valor ao fornecer insights práticos e positivos aos pais,
   * incentivando hábitos alimentares mais saudáveis de forma não impositiva. Utiliza um prompt
   * cuidadosamente elaborado para garantir que a resposta da IA seja sempre amigável e útil.
   * @param studentId O ID do aluno para o qual o relatório será gerado.
   * @returns Um objeto contendo o relatório textual gerado pela IA.
   * @throws {NotFoundException} Se o aluno não for encontrado no banco de dados.
   */
  async generateNutritionalReport(
    studentId: string,
  ): Promise<{ report: string }> {
    // Feature Flag Check
    if (process.env.ENABLE_AI_REPORT !== 'true') {
      return {
        report: 'A análise nutricional por IA está desativada temporariamente.',
      };
    }

    if (!this.genAI) {
      return {
        report:
          'O serviço de análise nutricional está temporariamente indisponível.',
      };
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const consumedItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          studentId: studentId,
          status: { in: ['PAID', 'DELIVERED'] },
          createdAt: { gte: sevenDaysAgo },
        },
      },
      include: {
        product: { select: { name: true } },
      },
    });

    if (consumedItems.length === 0) {
      return {
        report: `Não encontramos registros de consumo para ${student.name} na última semana.`,
      };
    }

    const consumptionSummary = consumedItems
      .reduce(
        (acc, item) => {
          const existing = acc.find((p) => p.name === item.product.name);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            acc.push({ name: item.product.name, quantity: item.quantity });
          }
          return acc;
        },
        [] as { name: string; quantity: number }[],
      )
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(', ');

    const prompt = `
      Você é um nutricionista pediátrico amigável.
      Analise o seguinte consumo alimentar de um aluno chamado ${student.name} na cantina escolar durante a última semana.
      Gere um parágrafo curto (máximo 3 frases) com uma recomendação gentil e positiva para os pais.
      Foque em uma única sugestão prática, como balancear com frutas ou incentivar a hidratação.
      Consumo: ${consumptionSummary}.
    `;

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });

      const text = response.text;
      return { report: text || 'Relatório não disponível.' };
    } catch (error) {
      this.logger.error('Erro ao chamar a API do Gemini', error.stack);
      return {
        report:
          'Não foi possível gerar a análise nutricional no momento. Tente novamente mais tarde.',
      };
    }
  }

  /**
   * Utiliza a IA multimodal do Gemini para extrair dados estruturados de alunos e responsáveis de um arquivo.
   * O 'porquê': Resolve o principal gargalo de onboarding em um SaaS escolar, que é a entrada manual de dados.
   * Ao forçar uma resposta JSON estruturada (`responseSchema`), garantimos a consistência dos dados e
   * minimizamos a chance de erros de parsing, tornando o processo robusto e confiável.
   * @param fileBase64 O conteúdo do arquivo (imagem, CSV, etc.) codificado em Base64.
   * @param mimeType O tipo MIME do arquivo (ex: 'image/png', 'text/csv').
   * @returns Uma promessa que resolve para um objeto com a lista de usuários extraídos.
   * @throws {InternalServerErrorException} Se a API do Gemini falhar ou a chave não estiver configurada.
   */
  async extractStudentGuardianData(
    fileBase64: string,
    mimeType: string,
  ): Promise<{ users: any[] }> {
    if (!this.genAI) {
      throw new InternalServerErrorException(
        'O serviço de IA não está configurado.',
      );
    }

    const prompt = `
      Você é um assistente de IA especialista em extrair e estruturar dados para o sistema escolar CantApp. Analise o conteúdo a seguir (imagem de lista, CSV, etc.) e extraia as informações dos alunos e seus responsáveis.

      REGRAS:
      1. Extraia o nome completo do ALUNO e do RESPONSÁVEL.
      2. O email do RESPONSÁVEL é obrigatório. Se não encontrar, gere um placeholder único.
      3. Se encontrar uma data de nascimento para o aluno, formate-a como DD/MM/AAAA.
      4. Retorne os dados EXCLUSIVAMENTE no formato JSON especificado. Se o arquivo for ilegível, retorne um array 'users' vazio.
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        users: {
          type: Type.ARRAY,
          description: 'Lista de alunos e seus responsáveis.',
          items: {
            type: Type.OBJECT,
            properties: {
              studentName: {
                type: Type.STRING,
                description: 'Nome completo do aluno.',
              },
              studentBirthDate: {
                type: Type.STRING,
                description:
                  'Data de nascimento do aluno (DD/MM/AAAA). Opcional.',
              },
              guardianName: {
                type: Type.STRING,
                description: 'Nome completo do responsável.',
              },
              guardianEmail: {
                type: Type.STRING,
                description: 'Email do responsável.',
              },
              guardianDocument: {
                type: Type.STRING,
                description: 'Documento (CPF) do responsável. Opcional.',
              },
            },
            required: ['studentName', 'guardianName', 'guardianEmail'],
          },
        },
      },
    };

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: {
          parts: [
            { inlineData: { data: fileBase64, mimeType: mimeType } },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('A IA não retornou texto válido.');
      }
      const jsonString = text.trim();

      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error(
        'Erro ao chamar a API do Gemini para extração de dados.',
        error.stack,
      );
      throw new InternalServerErrorException(
        'Falha ao extrair dados do arquivo com IA.',
      );
    }
  }
}

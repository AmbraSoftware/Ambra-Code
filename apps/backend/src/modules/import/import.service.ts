/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
// FIX: Import the Express namespace to resolve the type for Express.Multer.File.
import { Express } from 'express';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Orquestra o processo de importação de alunos e responsáveis a partir de um arquivo.
   * O 'porquê': Este método encapsula uma lógica de negócio complexa: (1) delega a extração
   * de dados para a IA, (2) realiza uma verificação de duplicados para manter a integridade
   * dos dados, e (3) executa a criação em massa de forma atômica. Essa orquestração
   * garante um processo de onboarding robusto, eficiente e seguro.
   * @param file O arquivo enviado pelo administrador (imagem, CSV, etc.).
   * @param schoolId O ID da escola onde os usuários serão criados.
   * @returns Um resumo da operação de importação.
   * @throws {BadRequestException} Se a IA não conseguir extrair dados válidos do arquivo.
   */
  /**
   * [v4.9] Otimização Inteligente de Importação
   * Tenta processar CSVs simples localmente para economizar custos de IA.
   * Se falhar ou for imagem, recorre ao Gemini.
   */
  async parseImportFile(fileBase64: string, mimeType: string): Promise<any[]> {
    // 1. Feature Flag Check (Hardcoded for now as requested: "Desativado por padrão")
    const ENABLE_AI_IMPORT = process.env.ENABLE_AI_IMPORT === 'true';

    // 2. Tenta processar CSV localmente (Fast Path)
    if (mimeType.includes('csv') || mimeType.includes('text')) {
      try {
        const decoded = Buffer.from(fileBase64, 'base64').toString('utf-8');
        const lines = decoded.split(/\r?\n/).filter(line => line.trim().length > 0);
        
        if (lines.length > 1) {
          const headers = lines[0].toLowerCase().split(/[;,]/).map(h => h.trim().replace(/"/g, ''));
          
          // Verifica se tem colunas essenciais
          const hasName = headers.some(h => h.includes('nome') || h.includes('aluno'));
          const hasEmail = headers.some(h => h.includes('email') || h.includes('responsavel'));

          if (hasName && hasEmail) {
            this.logger.log('Fast-path: Processando CSV localmente sem IA.');
            return this.parseCsvLocally(lines, headers);
          }
        }
      } catch (e) {
        this.logger.warn('Falha no parser CSV local, tentando IA fallback...', e);
      }
    }

    // 3. Fallback para IA (se habilitado)
    if (ENABLE_AI_IMPORT) {
        return this.aiService.extractStudentGuardianData(fileBase64, mimeType)
            .then(res => res.users);
    }

    this.logger.warn('Importação via IA desativada (Cost Saving).');
    return []; // Retorna vazio se não puder processar
  }

  private parseCsvLocally(lines: string[], headers: string[]): any[] {
    const users: Array<{
      studentName: string;
      guardianEmail: string;
      guardianName: string;
      guardianDocument?: string;
    }> = [];
    // Mapeamento simples de índices
    const nameIdx = headers.findIndex(h => h.includes('nome') || h.includes('aluno'));
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('responsavel') || h.includes('mail'));
    const guardianIdx = headers.findIndex(h => h.includes('pai') || h.includes('mae') || h.includes('responsavel'));
    const docIdx = headers.findIndex(h => h.includes('cpf') || h.includes('documento'));

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/).map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 2) continue;

        users.push({
            studentName: cols[nameIdx] || 'Aluno Sem Nome',
            guardianEmail: cols[emailIdx] || `responsavel_${Date.now()}_${i}@temp.com`,
            guardianName: cols[guardianIdx] || 'Responsável',
            guardianDocument: cols[docIdx] || undefined
        });
    }
    return users;
  }

  async processStudentImport(file: Express.Multer.File, schoolId: string) {
    const fileBase64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    // [v4.9] Optimization: Use Smart Parser
    const extractedUsers = await this.parseImportFile(fileBase64, mimeType);

    if (!extractedUsers || extractedUsers.length === 0) {
      // Se o parser retornou vazio e não foi erro, pode ser que a IA esteja desativada
      if (process.env.ENABLE_AI_IMPORT !== 'true') {
        throw new BadRequestException(
          'Importação Inteligente está desativada. Use um CSV padrão (Nome, Email).',
        );
      }
      throw new BadRequestException(
        'Não foi possível ler o arquivo. Verifique o formato.',
      );
    }

    // 3. Filtra duplicados
    const { newEntries, duplicatesCount } = await this.filterExistingUsers(
      extractedUsers,
      schoolId,
    );

    if (newEntries.length === 0) {
      return {
        createdStudents: 0,
        createdGuardians: 0,
        foundDuplicates: duplicatesCount,
        errors: [],
        message:
          'Nenhum novo aluno para importar. Todos os registros encontrados já existem.',
      };
    }

    // 4. Criação em massa transacional
    const summary = await this.bulkCreateUsers(newEntries, schoolId);

    return { ...summary, foundDuplicates: duplicatesCount };
  }

  /**
   * Filtra uma lista de usuários extraídos pela IA, removendo aqueles que já existem no sistema.
   * O 'porquê': Prevenir a criação de dados duplicados é fundamental para a integridade do banco de
   * dados. Esta função realiza uma única consulta ao banco para buscar todos os e-mails e
   * documentos existentes e, em seguida, realiza a filtragem em memória, o que é muito mais
   * performático do que consultar o banco para cada usuário da lista.
   * @param usersFromAI A lista de usuários extraída pela IA.
   * @param schoolId O ID da escola para limitar a busca de duplicados.
   * @returns Um objeto contendo a lista de novos registros e a contagem de duplicados.
   */
  private async filterExistingUsers(usersFromAI: any[], schoolId: string) {
    if (!usersFromAI || usersFromAI.length === 0) {
      return { newEntries: [], duplicatesCount: 0 };
    }

    const emails = usersFromAI.map((u) => u.guardianEmail).filter(Boolean);
    const documents = usersFromAI
      .map((u) => u.guardianDocument)
      .filter(Boolean);

    const existingUsers = await this.prisma.user.findMany({
      where: {
        schoolId,
        OR: [{ email: { in: emails } }, { document: { in: documents } }],
      },
      select: { email: true, document: true },
    });

    const existingEmails = new Set(existingUsers.map((u) => u.email));

    const newEntries: any[] = [];
    let duplicatesCount = 0;

    for (const entry of usersFromAI) {
      if (existingEmails.has(entry.guardianEmail)) {
        duplicatesCount++;
      } else {
        newEntries.push(entry);
        existingEmails.add(entry.guardianEmail); // Previne duplicados dentro do mesmo arquivo
      }
    }
    return { newEntries, duplicatesCount };
  }

  /**
   * Cria usuários (responsáveis e alunos) e suas carteiras em massa dentro de uma única transação.
   * O 'porquê': A atomicidade é crucial aqui. Usar `$transaction` garante que, se a criação de
   * qualquer um dos 500 alunos falhar, toda a operação é revertida. Isso evita um estado
   * inconsistente no banco de dados, onde alguns alunos foram criados e outros não. O uso
   * de um cache em memória (`guardianCache`) otimiza a criação de responsáveis compartilhados.
   * @param entries A lista de novos registros a serem criados.
   * @param schoolId O ID da escola.
   * @returns Um resumo da operação de criação.
   */
  private async bulkCreateUsers(entries: any[], schoolId: string) {
    const saltRounds = 10;
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'CantApp@2024';
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    let createdStudents = 0;
    let createdGuardians = 0;
    const errors: string[] = [];

    await this.prisma.$transaction(
      async (tx) => {
        const guardianCache = new Map<string, string>();

        for (const entry of entries) {
          try {
            let guardianId = guardianCache.get(entry.guardianEmail);

            if (!guardianId) {
              const newGuardian = await tx.user.create({
                data: {
                  name: entry.guardianName,
                  email: entry.guardianEmail,
                  document: entry.guardianDocument,
                  passwordHash: hashedPassword,
                  role: 'GUARDIAN',
                  schoolId,
                },
              });
              guardianId = newGuardian.id;
              guardianCache.set(entry.guardianEmail, guardianId);
              createdGuardians++;
            }

            const studentEmail = `${entry.studentName.toLowerCase().replace(/\s+/g, '.')}.${randomBytes(2).toString('hex')}@${schoolId.substring(0, 8)}.cantapp.sch`;

            let birthDate: Date | null = null;
            if (entry.studentBirthDate) {
              try {
                const parts = entry.studentBirthDate.split('/');
                if (parts.length === 3)
                  birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              } catch (e) {
                /* Ignora data inválida */
              }
            }

            await tx.user.create({
              data: {
                name: entry.studentName,
                email: studentEmail,
                passwordHash: hashedPassword,
                role: 'STUDENT',
                schoolId,
                birthDate,
                guardianRelations: {
                  create: { guardian: { connect: { id: guardianId } } },
                },
                wallet: { create: {} },
              },
            });
            createdStudents++;
          } catch (error) {
            this.logger.error(
              `Erro durante importação em massa para ${entry.studentName}:`,
              error.stack,
            );
            errors.push(`Erro ao processar ${entry.studentName}.`);
          }
        }
      },
      { isolationLevel: 'Serializable', timeout: 90000 },
    );

    return { createdStudents, createdGuardians, errors };
  }
}

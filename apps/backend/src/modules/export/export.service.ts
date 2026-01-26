import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * [v5.0 Future] Smart Export (IA)
   * Gera relatórios CSV baseados em linguagem natural.
   * Ex: "Quais alunos não compraram nada nos últimos 30 dias?"
   * 
   * STATUS: DESATIVADO (Mock Implementation)
   */
  async generateSmartReport(schoolId: string, query: string): Promise<string> {
    const ENABLE_AI_EXPORT = process.env.ENABLE_AI_EXPORT === 'true';

    if (!ENABLE_AI_EXPORT) {
        this.logger.log(`Smart Export requested but disabled: "${query}"`);
        return this.generateStandardReport(schoolId); // Fallback
    }

    // Aqui entraria a chamada ao Gemini para converter NLP -> SQL/Prisma Query
    // const prismaQuery = await this.ai.textToQuery(query);
    // const data = await this.prisma.queryRaw(prismaQuery);
    
    return '';
  }

  private async generateStandardReport(schoolId: string): Promise<string> {
      // Exemplo de fallback simples
      const students = await this.prisma.user.findMany({
          where: { schoolId, role: 'STUDENT' },
          select: { name: true, class: true }
      });
      
      const header = 'Nome,Turma\n';
      const rows = students.map(s => `${s.name},${s.class || ''}`).join('\n');
      return header + rows;
  }
}

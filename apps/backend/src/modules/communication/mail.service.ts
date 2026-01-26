import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * (MOCK) Simula o envio de um e-mail de recuperação de senha.
   * O 'porquê': Em desenvolvimento e testes, não queremos disparar e-mails reais.
   * Este mock permite que toda a lógica de geração de token e fluxo de usuário seja
   * testada de ponta a ponta sem a necessidade de configurar um serviço de e-mail real.
   * O link de redefinição é logado no console para fácil acesso durante o desenvolvimento.
   * @param email O e-mail do destinatário.
   * @param token O token de redefinição de senha.
   * @param name O nome do usuário para personalizar o e-mail.
   */
  async sendPasswordResetEmail(
    email: string,
    token: string,
    name: string,
  ): Promise<void> {
    const resetLink = `https://app.cantapp.com/reset-password?token=${token}`;

    // Fallback for dev/mock if API key is missing
    if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY not found. Using Mock fallback.');
      this.logger.log('--- SIMULAÇÃO DE ENVIO DE E-MAIL ---');
      this.logger.log(`Para: ${email}`);
      this.logger.log(`Assunto: Redefinição de Senha - CantApp`);
      this.logger.log(`Link: ${resetLink}`);
      this.logger.log('------------------------------------');
      return;
    }

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'CantApp <nao-responda@ambra.tech>', // Update with real verified domain when available
        to: email,
        subject: 'Redefinição de Senha - CantApp',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Olá ${name},</h2>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para prosseguir:</p>
            <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Se você não solicitou isso, ignore este e-mail.</p>
          </div>
        `
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending email via Resend: ${error.message}`, error.stack);
      throw error;
    }
  }
}

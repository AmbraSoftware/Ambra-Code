import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Serviço de Criptografia para dados sensíveis
 * Usa AES-256-GCM para criptografia autenticada
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY não configurada nas variáveis de ambiente');
    }
    
    // Deriva uma chave de 32 bytes usando SHA-256
    this.key = crypto.createHash('sha256').update(encryptionKey).digest();
  }

  /**
   * Criptografa um texto
   * @param text Texto a ser criptografado
   * @returns String no formato: iv:authTag:ciphertext (base64)
   */
  encrypt(text: string): string {
    if (!text) return text;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Formato: iv:authTag:ciphertext
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Descriptografa um texto
   * @param encryptedText Texto no formato iv:authTag:ciphertext
   * @returns Texto original
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    
    const [ivBase64, authTagBase64, ciphertext] = encryptedText.split(':');
    
    if (!ivBase64 || !authTagBase64 || !ciphertext) {
      throw new Error('Formato de texto criptografado inválido');
    }
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Verifica se um texto está criptografado (formato básico)
   */
  isEncrypted(text: string): boolean {
    if (!text) return false;
    // Verifica se tem o formato iv:authTag:ciphertext (3 partes separadas por :)
    const parts = text.split(':');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }
}

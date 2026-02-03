import { Injectable, Logger } from '@nestjs/common';
// FIX: Import Buffer type to resolve 'Cannot find name 'Buffer'' error.
import { Buffer } from 'buffer';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<{ url: string }> {
    const uniqueFileName = `${Date.now()}-${fileName}`;

    try {
      // Vercel Blob: Put file
      // Requires BLOB_READ_WRITE_TOKEN in .env
      const { put } = await import('@vercel/blob');

      const blob = await put(uniqueFileName, fileBuffer, {
        access: 'public',
        addRandomSuffix: false, // We already made it unique
      });

      this.logger.log(`File uploaded to Vercel Blob: ${blob.url}`);
      return { url: blob.url };
    } catch (error) {
      this.logger.error(
        `Error uploading to Vercel Blob: ${error.message}`,
        error.stack,
      );

      // Fallback for dev/mock if token is missing, to not block local dev completely if not configured
      if (
        process.env.NODE_ENV !== 'production' &&
        !process.env.BLOB_READ_WRITE_TOKEN
      ) {
        this.logger.warn(
          'BLOB_READ_WRITE_TOKEN not found. Using Mock fallback.',
        );
        return { url: `https://mock-storage.local/${uniqueFileName}` };
      }

      throw error;
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const { del } = await import('@vercel/blob');
      await del(url);
      this.logger.log(`File deleted from Vercel Blob: ${url}`);
    } catch (error) {
      this.logger.error(
        `Error deleting from Vercel Blob: ${error.message}`,
        error.stack,
      );
      // Don't throw on delete error to avoid regarding "cleanup" as critical failure
    }
  }
}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

export const FileUploadResponseSchema = z.object({
    success: z.boolean().describe('Статус операции'),
    url: z.string().describe('URL загруженного файла'),
    message: z.string().optional().describe('Сообщение для пользователя'),
});

export type FileUploadResponseDto = z.infer<typeof FileUploadResponseSchema>;

export class FileUploadResponse extends createZodDto(FileUploadResponseSchema) {}

import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { IMAGE_MIME_TYPES } from '../constants';
import type { FileUploadDto } from '../../modules/media';

export const ExtractFastifyFile = createParamDecorator(
    async (
        data: { allowedMimetypes?: string[] } = { allowedMimetypes: IMAGE_MIME_TYPES },
        ctx: ExecutionContext,
    ): Promise<FileUploadDto> => {
        const req = ctx.switchToHttp().getRequest<FastifyRequest>();

        if (!req.isMultipart()) {
            throw new BadRequestException('Request is not multipart');
        }

        const file = await req.file();
        if (!file) {
            throw new BadRequestException('Файл не найден');
        }

        if (data?.allowedMimetypes && !data.allowedMimetypes.includes(file.mimetype)) {
            throw new BadRequestException('Недопустимый формат файла');
        }

        const buffer = await file.toBuffer();

        return {
            buffer,
            filename: file.filename,
            mimetype: file.mimetype,
        };
    },
);

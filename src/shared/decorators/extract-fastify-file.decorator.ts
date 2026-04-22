import { createParamDecorator, type ExecutionContext, HttpStatus } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { IMAGE_MIME_TYPES } from '../constants';
import type { FileUploadDto } from '../../modules/media';
import { BaseException } from '@shared/error';

export const ExtractFastifyFile = createParamDecorator(
    async (
        data: { allowedMimetypes?: string[] } = { allowedMimetypes: IMAGE_MIME_TYPES },
        ctx: ExecutionContext,
    ): Promise<FileUploadDto> => {
        const req = ctx.switchToHttp().getRequest<FastifyRequest>();

        if (!req.isMultipart()) {
            throw new BaseException(
                {
                    code: 'INVALID_CONTENT_TYPE',
                    message: 'Ожидался multipart/form-data запрос',
                    details: [
                        { target: 'header', message: 'Content-Type must be multipart/form-data' },
                    ],
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        const file = await req.file();
        if (!file) {
            throw new BaseException(
                {
                    code: 'FILE_NOT_FOUND',
                    message: 'Файл не был передан в запросе',
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        if (data?.allowedMimetypes && !data.allowedMimetypes.includes(file.mimetype)) {
            throw new BaseException(
                {
                    code: 'INVALID_FILE_TYPE',
                    message: 'Недопустимый формат файла',
                    details: [
                        {
                            target: 'mimetype',
                            received: file.mimetype,
                            expected: data.allowedMimetypes,
                        },
                    ],
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        const buffer = await file.toBuffer();

        return {
            buffer,
            filename: file.filename,
            mimetype: file.mimetype,
        };
    },
);

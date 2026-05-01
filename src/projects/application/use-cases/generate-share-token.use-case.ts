import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { CreateShareTokenDto } from '../dtos';
import { createHash, randomBytes } from 'crypto';
import { BaseException } from '@shared/error';
import { ProjectAccessPolicy } from '@core/projects/domain/policy';
import { IProjectsRepository } from '@core/projects/domain/repository';

@Injectable()
export class GenerateShareTokenUseCase {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly policy: ProjectAccessPolicy,
    ) {}

    public async execute(id: string, slug: string, userId: string, dto: CreateShareTokenDto) {
        const { project } = await this.policy.validateProjectAccess(id, slug, userId);

        let expiresAt: Date;

        if (dto.ttl) {
            expiresAt = new Date(dto.ttl);

            if (expiresAt <= new Date()) {
                throw new BaseException(
                    {
                        code: 'INVALID_EXPIRATION',
                        message: 'Дата истечения не может быть в прошлом',
                        details: [
                            { target: 'ttl', message: 'Expiration date is behind current time' },
                        ],
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
        } else {
            expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 3);
        }

        const rawToken = this.generateSecureToken();

        const isSaved = await this.projectsRepo.createShare({
            projectId: project.id,
            token: this.hash(rawToken),
            expiresAt,
            createdBy: userId,
        });

        if (!isSaved) {
            throw new BaseException(
                {
                    code: 'SHARE_CREATE_FAILED',
                    message: 'Не удалось сгенерировать ссылку доступа',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const durationMsg = dto.ttl
            ? `закроется ${expiresAt.toLocaleDateString('ru-RU')}`
            : 'бессрочна (на 3 месяца по умолчанию)';

        return {
            success: true,
            message: `Ссылка для проекта «${project.name}» создана и ${durationMsg}`,
            payload: {
                token: rawToken,
                isYourself: !!dto,
                expiresAt: expiresAt.toISOString(),
            },
        };
    }

    private generateSecureToken(): string {
        return `st_${randomBytes(32).toString('hex')}`;
    }

    private hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}

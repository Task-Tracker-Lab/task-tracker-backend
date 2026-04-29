import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IProjectsRepository } from '../repository';
import type { CreateProjectDto, CreateShareTokenDto, UpdateProjectDto } from '../dtos';
import { ROLE_PRIORITY } from '@shared/constants';
import { ProjectStatus } from '../entities';
import { ProjectsMapper } from '../mappers';
import { createHash, randomBytes } from 'crypto';
import { BaseException } from '@shared/error';
import { FindTeamMemberQuery, FindTeamQuery } from '@core/teams';

@Injectable()
export class ProjectsService {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly findTeamQ: FindTeamQuery,
        private readonly findTeamMemberQ: FindTeamMemberQuery,
    ) {}

    public create = async (userId: string, slug: string, dto: CreateProjectDto) => {
        const { team } = await this.ensureTeamAccess(slug, userId, 'admin');

        const data = {
            ...dto,
            teamId: team.id,
            ownerId: userId,
            key: dto.key.toUpperCase(),
            status: ProjectStatus.Active,
        };

        const { result, id } = await this.projectsRepo.create(data);

        return {
            success: result,
            message: `Проект ${dto.name} успешно создан`,
            projectId: id,
        };
    };

    public generateToken = async (
        id: string,
        slug: string,
        userId: string,
        dto: CreateShareTokenDto,
    ) => {
        const project = await this.validateAccess(id, slug, userId);

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
    };

    public delete = async (id: string, slug: string, userId: string) => {
        const project = await this.validateAccess(id, slug, userId);
        const result = await this.projectsRepo.delete(project.id);

        if (!result) {
            throw new BaseException(
                {
                    code: 'DELETE_FAILED',
                    message: 'Не удалось удалить проект',
                },
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        return {
            success: result,
            message: result
                ? `Проект ${project.name} успешно перемещен в корзину`
                : 'Не удалось удалить проект, попробуйте позже',
        };
    };

    public update = async (id: string, slug: string, userId: string, dto: UpdateProjectDto) => {
        const project = await this.validateAccess(id, slug, userId);
        const { isPublic, key, ...data } = dto;

        const result = await this.projectsRepo.update(project.id, {
            ...data,
            ...(key && { key: key.toUpperCase() }),
            ...(typeof isPublic === 'boolean' && {
                visibility: isPublic ? 'public' : 'private',
            }),
        });

        if (!result) {
            throw new BaseException(
                {
                    code: 'UPDATE_FAILED',
                    message:
                        'Изменения не были применены. Возможно, данные идентичны текущим или проект недоступен',
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        return {
            success: result,
            message: result ? 'Настройки проекта успешно обновлены' : 'Изменения не были применены',
        };
    };

    public findOne = async (id: string, slug: string, userId: string, token: string) => {
        const project = await this.projectsRepo.findOne(id);

        if (!project) {
            throw new BaseException(
                {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Проект не найден',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        if (token) {
            const hashedToken = this.hash(token);
            const isValidAccess = await this.projectsRepo.hasValidShareToken(
                project.id,
                hashedToken,
            );

            if (!isValidAccess) {
                throw new BaseException(
                    {
                        code: 'INVALID_TOKEN',
                        message: 'Ссылка недействительна или срок её действия истек',
                    },
                    HttpStatus.GONE,
                );
            }

            return ProjectsMapper.toDetailResponse(project, null, token);
        }

        if (!userId) {
            throw new BaseException(
                { code: 'AUTH_REQUIRED', message: 'Требуется авторизация' },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const { member, team } = await this.ensureTeamAccess(slug, userId, 'viewer');

        if (team.id !== project.teamId) {
            throw new BaseException(
                { code: 'PROJECT_MISMATCH', message: 'Проект не принадлежит этой команде' },
                HttpStatus.BAD_REQUEST,
            );
        }

        return ProjectsMapper.toDetailResponse(project, member);
    };

    public findByTeam = async (slug: string, userId: string) => {
        const { team, member } = await this.ensureTeamAccess(slug, userId, 'viewer');
        const projects = await this.projectsRepo.findByTeam(team.id);

        return {
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
                role: member.role,
            },
            items: projects.map((p) => ProjectsMapper.toListResponse(p, member)),
            meta: {
                total: projects.length,
            },
        };
    };

    public setStatus = async (id: string, slug: string, userId: string, status: ProjectStatus) => {
        const project = await this.validateAccess(id, slug, userId);
        const result = await this.projectsRepo.update(project.id, { status });

        if (!result) {
            throw new BaseException(
                {
                    code: 'STATUS_UPDATE_FAILED',
                    message: 'Не удалось обновить статус проекта',
                    details: [{ target: 'status', value: status }],
                },
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        const messages: Record<ProjectStatus, string> = {
            archived: `Проект «${project.name}» успешно архивирован`,
            active: `Проект «${project.name}» теперь активен`,
            template: `Проект «${project.name}» успешно сохранен как шаблон`,
        };

        return {
            success: result,
            message: messages[status] || `Статус проекта «${project.name}» изменен`,
        };
    };

    private async ensureTeamAccess(
        slug: string,
        userId: string,
        minRole: keyof typeof ROLE_PRIORITY = 'viewer',
    ) {
        const team = await this.findTeamQ.execute(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const member = await this.findTeamMemberQ.execute(team.id, userId);
        if (!member) {
            throw new BaseException(
                {
                    code: 'NOT_TEAM_MEMBER',
                    message: 'Вы не являетесь участником этой команды',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        if (ROLE_PRIORITY[member.role] < ROLE_PRIORITY[minRole]) {
            throw new BaseException(
                {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `Только ${minRole} и выше могут выполнять это действие`,
                    details: [
                        {
                            target: 'role',
                            message: `Current role: ${member.role}, Required: ${minRole}`,
                        },
                    ],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        return { team, member };
    }

    private async validateAccess(
        id: string,
        slug: string,
        userId: string,
        minRole: keyof typeof ROLE_PRIORITY = 'admin',
    ) {
        const { team } = await this.ensureTeamAccess(slug, userId, minRole);

        const project = await this.projectsRepo.findOne(id);
        if (!project || project.teamId !== team.id) {
            throw new BaseException(
                {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Проект не найден в этой команде',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        return project;
    }

    private generateSecureToken(): string {
        return `st_${randomBytes(32).toString('hex')}`;
    }

    private hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}

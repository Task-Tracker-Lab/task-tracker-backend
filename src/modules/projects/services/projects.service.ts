import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { IProjectsRepository } from '../repository';
import type { CreateProjectDto, CreateShareTokenDto, UpdateProjectDto } from '../dtos';
import { FindTeamCommand, FindTeamMemberCommand } from '@core/modules/teams';
import { ROLE_PRIORITY } from '../../teams/entities/teams.domain';
import { ProjectStatus } from '../entities';
import { ProjectsMapper } from '../mappers';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ProjectsService {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly findTeamCommand: FindTeamCommand,
        private readonly findTeamMemberCommand: FindTeamMemberCommand,
    ) {}

    public create = async (userId: string, slug: string, dto: CreateProjectDto) => {
        const team = await this.findTeamCommand.execute(slug);
        if (!team) {
            throw new NotFoundException('Команда не найдена');
        }

        const member = await this.findTeamMemberCommand.execute(team.id, userId);
        if (!member) {
            throw new ForbiddenException('Вы не являетесь участником этой команды');
        }

        if (ROLE_PRIORITY[member.role] < ROLE_PRIORITY.admin) {
            throw new ForbiddenException(
                'Только администраторы и владельцы могут создавать проекты',
            );
        }

        const data = {
            ...dto,
            teamId: team.id,
            ownerId: userId,
            key: dto.key.toUpperCase(),
            status: ProjectStatus.Active,
        };

        try {
            const { result, id } = await this.projectsRepo.create(data);

            // TODO: RESOLVE AT ACTION RESPONSE EXTEND WITH PROJECT ID
            return {
                success: result,
                message: `Проект ${dto.name} успешно создан`,
                projectId: id,
            };
        } catch (error) {
            throw error;
        }
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
                throw new BadRequestException({
                    code: 'INVALID_EXPIRATION',
                    message: 'Дата истечения не может быть в прошлом',
                });
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
            throw new InternalServerErrorException({
                code: 'SHARE_CREATE_FAILED',
                message: 'Не удалось сгенерировать ссылку доступа',
                service: 'pg',
            });
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

        return {
            success: result,
            message: result ? 'Настройки проекта успешно обновлены' : 'Изменения не были применены',
        };
    };

    public findOne = async (id: string, slug: string, userId: string, token: string) => {
        const project = await this.projectsRepo.findOne(id);

        if (!project) {
            throw new NotFoundException('Проект не найден');
        }

        if (token) {
            const hashedToken = this.hash(token);
            const isValidAccess = await this.projectsRepo.hasValidShareToken(
                project.id,
                hashedToken,
            );

            if (!isValidAccess) {
                throw new NotFoundException('Ссылка недействительна или срок её действия истек');
            }

            return ProjectsMapper.toDetailResponse(project, null, token);
        }

        let member = null;

        if (!userId) {
            throw new UnauthorizedException('Требуется авторизация');
        }

        const team = await this.findTeamCommand.execute(slug);
        if (!team || team.id !== project.teamId) {
            throw new NotFoundException('Команда не найдена или проект к ней не относится');
        }

        member = await this.findTeamMemberCommand.execute(team.id, userId);
        if (!member) {
            throw new ForbiddenException('У вас нет доступа к этой команде');
        }

        return ProjectsMapper.toDetailResponse(project, member);
    };

    public findByTeam = async (slug: string, userId: string) => {
        const team = await this.findTeamCommand.execute(slug);

        if (!team) {
            throw new NotFoundException('Команда не найдена');
        }

        const member = await this.findTeamMemberCommand.execute(team.id, userId);
        if (!member) {
            throw new ForbiddenException('У вас нет доступа к этой команде');
        }

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

    private async validateAccess(id: string, slug: string, userId: string, minRole = 'admin') {
        const team = await this.findTeamCommand.execute(slug);
        if (!team) {
            throw new NotFoundException('Team not found');
        }

        const member = await this.findTeamMemberCommand.execute(team.id, userId);
        if (!member || ROLE_PRIORITY[member.role] < ROLE_PRIORITY[minRole]) {
            throw new ForbiddenException(`You need at least ${minRole} role to manage projects`);
        }

        const project = await this.projectsRepo.findOne(id);
        if (!project || project.teamId !== team.id) {
            throw new NotFoundException('Project not found in this team');
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

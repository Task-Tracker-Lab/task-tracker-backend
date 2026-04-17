import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { ROLE_PRIORITY } from '../entities';
import type { UpdateMemberDto } from '../dtos';
import { TeamMemberMapper } from '../mappers';

@Injectable()
export class TeamMembersService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    public getMembers = async (slug: string) => {
        const team = await this.teamsRepo.findBySlug(slug);

        if (!team) {
            throw new NotFoundException(`Команда ${slug} не найдена`);
        }

        const members = await this.teamsRepo.findMembers(team.id);
        return TeamMemberMapper.toList(members);
    };

    public updateMember = async (
        slug: string,
        currentUserId: string,
        targetUserId: string,
        dto: UpdateMemberDto,
    ) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) throw new NotFoundException('Команда не найдена');

        const [currentUser, targetUser] = await Promise.all([
            this.teamsRepo.findMember(team.id, currentUserId),
            this.teamsRepo.findMember(team.id, targetUserId),
        ]);

        if (!currentUser || !targetUser) throw new NotFoundException('Участник не найден');

        if (ROLE_PRIORITY[currentUser.role] < ROLE_PRIORITY.admin) {
            throw new ForbiddenException('У вас нет прав на редактирование участников');
        }

        // Нельзя менять роль тому, кто выше тебя или равен тебе по весу
        if (
            currentUserId !== targetUserId &&
            ROLE_PRIORITY[currentUser.role] <= ROLE_PRIORITY[targetUser.role]
        ) {
            throw new ForbiddenException(
                'Вы не можете менять данные участника с равным или высшим рангом',
            );
        }

        // Защита от потери овнера: нельзя разжаловать овнера в админа
        if (targetUser.role === 'owner' && dto.role && dto.role !== 'owner') {
            throw new BadRequestException(
                'Нельзя изменить роль владельца. Используйте процедуру передачи прав.',
            );
        }

        // Нельзя назначить роль выше своей (Админ не может сделать кого-то Овнером)
        if (
            dto.role &&
            ROLE_PRIORITY[dto.role] >= ROLE_PRIORITY[currentUser.role] &&
            currentUser.role !== 'owner'
        ) {
            throw new ForbiddenException('Вы не можете назначить роль выше своей');
        }

        const result = await this.teamsRepo.updateMember(team.id, targetUserId, dto);

        return {
            success: result,
            message: `Данные участника команды "${team.name}" успешно обновлены`,
        };
    };

    public removeMember = async (slug: string, currentUserId: string, targetUserId: string) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) throw new NotFoundException('Команда не найдена');

        const [currentUser, targetUser] = await Promise.all([
            this.teamsRepo.findMember(team.id, currentUserId),
            this.teamsRepo.findMember(team.id, targetUserId),
        ]);

        if (!targetUser) throw new NotFoundException('Участник не найден в этой команде');
        if (!currentUser) throw new ForbiddenException('Вы не состоите в этой команде');

        const isSelfRemoval = currentUserId === targetUserId;

        if (isSelfRemoval) {
            if (currentUser.role === 'owner') {
                throw new BadRequestException(
                    'Владелец не может покинуть команду. Передайте права или удалите команду.',
                );
            }
        } else {
            const canKick = ROLE_PRIORITY[currentUser.role] > ROLE_PRIORITY[targetUser.role];
            const hasAuthority = ROLE_PRIORITY[currentUser.role] >= ROLE_PRIORITY.admin;

            if (!hasAuthority || !canKick) {
                throw new ForbiddenException(
                    'У вас недостаточно прав, чтобы исключить этого участника',
                );
            }
        }

        const result = await this.teamsRepo.removeMember(team.id, targetUserId);

        return {
            success: result,
            message: isSelfRemoval
                ? `Вы успешно покинули команду ${team.name}`
                : `Участник успешно исключен из команды ${team.name}`,
        };
    };
}

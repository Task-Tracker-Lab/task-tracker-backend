import { Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../repository';

@Injectable()
export class TeamsService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    public create = (userId: string, dto: any) => {
        return { userId, dto };
    };

    public update = (slug: string, dto: any) => {
        return { slug, dto };
    };

    public remove = (slug: string) => {
        return { slug };
    };

    public syncTags = (slug: string, tags: string[]) => {
        return { slug, tags };
    };

    public getAll = (userId: string, pagination: Record<string, string>) => {
        return { userId, pagination };
    };

    public getOne = (slug: string) => {
        return { slug };
    };

    public getAllTags = (search?: string) => {
        return { search };
    };

    public getMembers = (slug: string) => {
        return { slug };
    };

    public invite = (slug: string, userId: string, dto: any) => {
        return { slug, dto, userId };
    };

    public updateMember = (slug: string, userId: string, dto: any) => {
        return { slug, userId, dto };
    };

    public removeMember = (slug: string, userId: string) => {
        return { slug, userId };
    };
}

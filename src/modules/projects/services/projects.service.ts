import { Inject, Injectable } from '@nestjs/common';
import { IProjectsRepository } from '../repository';

@Injectable()
export class ProjectsService {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
    ) {}

    public create = async (userId: string, slug: string, dto: any) => {
        this.projectsRepo;
        return { userId, slug, dto };
    };
    public delete = async (id: string, userId: string) => {
        return { userId, id };
    };
    public update = async (id: string, userId: string, dto: any) => {
        return { userId, id, dto };
    };
    public findOne = async (id: string, userId: string) => {
        return { userId, id };
    };
    public findByTeam = async (userId: string, slug: string) => {
        return { userId, slug };
    };
    public findByToken = async (token: string) => {
        return { token };
    };
    public setStatus = async (id: string, userId: string, status: string) => {
        return { id, status };
    };
}

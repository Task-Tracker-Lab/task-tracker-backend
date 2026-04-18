import { Inject, Injectable } from '@nestjs/common';
import { IProjectsRepository } from '../repository';

@Injectable()
export class NestedProjectsService {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
    ) {}

    public create = async (userId: string, slug: string, dto: any) => {
        this.projectsRepo;
        return { userId, slug, dto };
    };
    public generateToken = async (id: string, userId: string) => {
        this.projectsRepo;
        return { userId, id };
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
    public findByTeam = async (slug: string, userId: string) => {
        return { slug, userId };
    };
    public setStatus = async (id: string, userId: string, status: string) => {
        return { id, status };
    };
}

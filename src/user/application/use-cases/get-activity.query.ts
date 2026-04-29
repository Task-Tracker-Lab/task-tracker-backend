import { IUserRepository } from '@core/user/domain/repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetActivityQuery {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(id: string, page: number, limit: number) {
        const safeLimit = Math.min(limit, 50);
        const offset = (page - 1) * safeLimit;

        const { items, total } = await this.userRepo.findActivityByUser(id, {
            limit: safeLimit,
            offset,
        });

        return {
            items,
            meta: {
                total,
                page,
                limit: safeLimit,
                totalPages: Math.ceil(total / safeLimit),
            },
        };
    }
}

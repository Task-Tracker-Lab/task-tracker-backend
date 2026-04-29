import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@core/user/domain/repository';
import { BaseException } from '@shared/error';

@Injectable()
export class FindUserQuery {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(params: { email?: string; id?: string }) {
        if (params.email) return this.repository.findByEmail(params.email);
        if (params.id) return this.repository.findById(params.id);

        throw new BaseException(
            {
                code: 'QUERY_PARAMS_MISSING',
                message: 'Не указаны параметры поиска',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}

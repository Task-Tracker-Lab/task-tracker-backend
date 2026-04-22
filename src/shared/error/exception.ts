import { HttpException, HttpStatus } from '@nestjs/common';

interface IDetailsOptions {
    target?: string;
    [key: string]: any;
}

export interface IErrorOptions {
    code: string;
    message: string;
    details?: IDetailsOptions[];
}

export class BaseException extends HttpException {
    constructor(options: IErrorOptions, status: HttpStatus) {
        super(options, status);
    }
}

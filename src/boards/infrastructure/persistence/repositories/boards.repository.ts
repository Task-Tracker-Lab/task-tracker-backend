import { Injectable } from '@nestjs/common';
import { IBoardsRepository } from '../../../domain/repository';

@Injectable()
export class BoardsRepository implements IBoardsRepository {}

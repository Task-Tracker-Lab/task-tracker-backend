// eslint-disable-next-line no-restricted-syntax
import type { IssueQueryDto } from '../../application/dtos';
import type { Issue, NewIssue } from '../entities';

export interface IIssueRepository {
    create(data: NewIssue, userId: string): Promise<{ id: string }>;
    update(id: string, data: Partial<NewIssue>): Promise<boolean>;
    delete(id: string, userId: string): Promise<boolean>;
    findOne(id: string, userId: string): Promise<Issue | null>;
    find(query: IssueQueryDto): Promise<Issue[]>;
    restore(id: string, userId: string): Promise<boolean>;
    reorder(stateId: string): Promise<void>;
}

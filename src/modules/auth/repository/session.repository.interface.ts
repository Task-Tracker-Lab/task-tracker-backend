import { sessions } from '../entities';

export type SessionInsert = typeof sessions.$inferInsert;
export type SessionSelect = typeof sessions.$inferSelect;

export interface ISessionRepository {
    create(data: SessionInsert): Promise<SessionSelect>;
    findById(id: string): Promise<SessionSelect | null>;
    findAllByUserId(userId: string): Promise<SessionSelect[]>;
    revoke(id: string): Promise<void>;
    revokeAllByUserId(userId: string, exceptSessionId?: string): Promise<void>;
    deleteExpired(): Promise<number>;
}

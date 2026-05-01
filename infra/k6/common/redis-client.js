import redis from 'k6/x/redis';
import { REDIS_URL } from './config.js';

/**
 * Обертка для работы с Redis в k6.
 */
export class RedisClient {
    /**
     * @param {string} url - URL редиса (напр. 'redis://localhost:6379').
     */
    constructor(url = REDIS_URL) {
        this.client = redis.connect(url);
    }

    /**
     * Формирует ключи по тем же правилам, что и бэкенд/сидер.
     * @private
     */
    _keys = {
        invite: (code) => `inv:code:${code}`,
        teamInvites: (teamId) => `team:invites:${teamId}`,
        userInvites: (email) => `user:invites:${email.toLowerCase()}`,
        otp: (email) => `otp:${email.toLowerCase()}`,
    };

    /**
     * Получает OTP код для юзера.
     * @param {string} email
     * @returns {string|null}
     */
    getOtp(email) {
        return redis.get(this.client, this._keys.otp(email));
    }

    /**
     * Получает данные инвайта по коду.
     * @param {string} code
     * @returns {Object|null}
     */
    getInvite(code) {
        const data = redis.get(this.client, this._keys.invite(code));
        return data ? JSON.parse(data) : null;
    }

    /**
     * Получает все коды инвайтов для конкретной команды (из Set).
     * @param {string} teamId
     * @returns {string[]}
     */
    getTeamInvitesCodes(teamId) {
        return redis.smembers(this.client, this._keys.teamInvites(teamId));
    }

    getUserInvitesCodes(email) {
        return redis.smembers(this.client, this._keys.userInvites(email));
    }

    /**
     * Удаляет ключ
     */
    del(key) {
        redis.del(this.client, key);
    }
}

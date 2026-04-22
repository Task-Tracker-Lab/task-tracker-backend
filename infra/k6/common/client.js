import http from 'k6/http';
import { check } from 'k6';

/**
 * Обертка над стандартным HTTP-клиентом k6.
 */
export class ApiClient {
    /**
     * @param {string} baseUrl - Базовый адрес API.
     * @param {string|null} [token=null] - Bearer токен для авторизации.
     */
    constructor(baseUrl, token = null) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    /**
     * Формирует заголовки запроса.
     * @private
     * @returns {Object.<string, string>}
     */
    _getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    /**
     * Выполняет GET запрос.
     * @param {string} path - Относительный путь (напр. '/tasks').
     * @param {Object.<string, string>} [params] - Query-параметры.
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    get(path, params = {}) {
        const query = Object.keys(params).length
            ? `?${Object.entries(params)
                  .map(([k, v]) => `${k}=${v}`)
                  .join('&')}`
            : '';

        const res = http.get(`${this.baseUrl}${path}`, { headers: this._getHeaders() });
        this._logError(res, path);
        return res;
    }

    /**
     * Выполняет POST запрос.
     * @param {string} path - Относительный путь.
     * @param {Object} body - Объект данных (будет преобразован в JSON).
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    post(path, body) {
        const res = http.post(`${this.baseUrl}${path}`, JSON.stringify(body), {
            headers: this._getHeaders(),
        });
        this._logError(res, path);
        return res;
    }

    /**
     * Выполняет PATCH запрос.
     * @param {string} path - Относительный путь.
     * @param {Object} body - Данные для частичного обновления.
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    patch(path, body) {
        const res = http.patch(`${this.baseUrl}${path}`, JSON.stringify(body), {
            headers: this._getHeaders(),
        });
        this._logError(res, 'PATCH', path);
        return res;
    }

    /**
     * Выполняет PUT запрос.
     * @param {string} path - Относительный путь.
     * @param {Object} body - Данные для полного обновления.
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    put(path, body) {
        const res = http.put(`${this.baseUrl}${path}`, JSON.stringify(body), {
            headers: this._getHeaders(),
        });
        this._logError(res, 'PUT', path);
        return res;
    }

    /**
     * Выполняет DELETE запрос.
     * @param {string} path - Относительный путь.
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    del(path) {
        const res = http.del(`${this.baseUrl}${path}`, null, {
            headers: this._getHeaders(),
        });
        this._logError(res, 'DELETE', path);
        return res;
    }

    /**
     * Внутренняя валидация ответа и логирование ошибок.
     * @private
     * @param {import('k6/http').RefinedResponse<any>} res - Объект ответа k6.
     * @param {string} method - Название HTTP метода для лога.
     * @param {string} path - Путь запроса для лога.
     */
    _logError(res, path) {
        check(res, {
            [`${path} status is 2xx`]: (r) => r.status >= 200 && r.status < 300,
        });

        if (res.status >= 400) {
            console.error(`Error on ${path}: [${res.status}] ${res.body}`);
        }
    }
}

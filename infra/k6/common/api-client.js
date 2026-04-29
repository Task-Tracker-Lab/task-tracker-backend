import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './config.js';

/**
 * Обертка над стандартным HTTP-клиентом k6.
 */
export class ApiClient {
    /**
     * @param {string} baseUrl - Базовый адрес API.
     * @param {string|null} [token=null] - Bearer токен для авторизации.
     */
    constructor({ baseUrl = BASE_URL, token = null } = {}) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    /**
     * Формирует заголовки запроса.
     * @private
     * @returns {Object.<string, string>}
     */
    _getHeaders(useJsonDefault = true, extraHeaders = {}) {
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        if (useJsonDefault) {
            headers['Content-Type'] = 'application/json';
        }
        return Object.assign(headers, extraHeaders);
    }

    /**
     * Формирует параметры запроса (headers/cookies/tags).
     * @private
     * @param {Object} [options] - Доп. параметры запроса.
     * @param {Object.<string, string>} [options.headers] - Доп. заголовки.
     * @param {Object.<string, string>} [options.cookies] - Cookies для запроса.
     * @param {Object.<string, string>} [options.tags] - Tags для метрик k6.
     * @param {boolean} [useJsonDefault=true] - Добавлять ли JSON Content-Type по умолчанию.
     * @returns {Object}
     */
    _buildOptions(options = {}, useJsonDefault = true) {
        const headers = this._getHeaders(useJsonDefault, options.headers || {});
        const reqOptions = { headers };

        if (options.cookies) {
            reqOptions.cookies = options.cookies;
        }
        if (options.tags) {
            reqOptions.tags = options.tags;
        }

        return reqOptions;
    }

    /**
     * Формирует строку query-параметров.
     * @private
     * @param {Object.<string, string|number|boolean>} [params] - Query-параметры.
     * @returns {string}
     */
    _buildQuery(params = {}) {
        return Object.keys(params).length
            ? `?${Object.entries(params)
                  .map(([k, v]) => `${k}=${v}`)
                  .join('&')}`
            : '';
    }

    /**
     * Выполняет GET запрос.
     * @param {string} path - Относительный путь (напр. '/tasks').
     * @param {Object.<string, string>} [params] - Query-параметры.
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    get(path, params = {}, options = {}) {
        const query = this._buildQuery(params);
        const res = http.get(`${this.baseUrl}${path}${query}`, this._buildOptions(options));
        this._logError(res, 'GET', path);
        return res;
    }

    /**
     * Выполняет POST запрос.
     * @param {string} path - Относительный путь.
     * @param {Object} body - Объект данных (будет преобразован в JSON).
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    post(path, body, options = {}) {
        const useJsonDefault = !options.rawBody;
        const payload = options.rawBody ? body : JSON.stringify(body);
        const res = http.post(
            `${this.baseUrl}${path}`,
            payload,
            this._buildOptions(options, useJsonDefault),
        );
        this._logError(res, 'POST', path);
        return res;
    }

    /**
     * Выполняет PATCH запрос.
     * @param {string} path - Относительный путь.
     * @param {Object} body - Данные для частичного обновления.
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    patch(path, body, options = {}) {
        const useJsonDefault = !options.rawBody;
        const payload = options.rawBody ? body : JSON.stringify(body);
        const res = http.patch(
            `${this.baseUrl}${path}`,
            payload,
            this._buildOptions(options, useJsonDefault),
        );
        this._logError(res, 'PATCH', path);
        return res;
    }

    /**
     * Выполняет PUT запрос.
     * @param {string} path - Относительный путь.
     * @param {Object} body - Данные для полного обновления.
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    put(path, body, options = {}) {
        const useJsonDefault = !options.rawBody;
        const payload = options.rawBody ? body : JSON.stringify(body);
        const res = http.put(
            `${this.baseUrl}${path}`,
            payload,
            this._buildOptions(options, useJsonDefault),
        );
        this._logError(res, 'PUT', path);
        return res;
    }

    /**
     * Выполняет DELETE запрос.
     * @param {string} path - Относительный путь.
     * @returns {import('k6/http').RefinedResponse<any>}
     */
    delete(path, options = {}) {
        const res = http.del(`${this.baseUrl}${path}`, null, this._buildOptions(options, false));
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
    _logError(res, method, path) {
        check(res, {
            [`${method} ${path} status is 2xx`]: (r) => r.status >= 200 && r.status < 300,
        });

        if (res.status >= 400) {
            console.error(`Error on ${method} ${path}: [${res.status}] ${res.body}`);
        }
    }
}

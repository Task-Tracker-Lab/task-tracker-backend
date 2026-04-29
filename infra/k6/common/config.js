export const BASE_URL = __ENV.BASE_URL || 'http://0.0.0.0:3000/v1';
export const REDIS_URL = __ENV.REDIS_URL || 'http://localhost:7000';

/**
 * Профили нагрузки (Workload Profiles).
 * Описывают поведение виртуальных пользователей (VUs) во времени.
 * * @typedef {Object} Stage
 * @property {string} duration - Продолжительность этапа (напр. '2m')
 * @property {number} target - Целевое количество активных пользователей
 * * @typedef {Object} Profile
 * @property {number} [vus] - Фиксированное количество пользователей
 * @property {string} [duration] - Общая продолжительность теста
 * @property {Stage[]} [stages] - Этапы изменения нагрузки
 */
/** @type {Object.<string, Profile>} */
export const PROFILES = {
    /** Минимальная проверка доступности: 1 юзер, 10 секунд */
    smoke: {
        vus: 1,
        duration: '10s',
    },
    /** Низкая нагрузка: проверка базовой стабильности (10 юзеров) */
    low: {
        stages: [
            { duration: '30s', target: 10 },
            { duration: '1m', target: 10 },
            { duration: '30s', target: 0 },
        ],
    },
    /** Средняя нагрузка: имитация нормальной рабочей нагрузки (50 юзеров) */
    medium: {
        stages: [
            { duration: '1m', target: 50 },
            { duration: '3m', target: 50 },
            { duration: '1m', target: 0 },
        ],
    },
    /** Высокая нагрузка: поиск предела производительности (300 юзеров) */
    high: {
        stages: [
            { duration: '2m', target: 300 },
            { duration: '5m', target: 300 },
            { duration: '2m', target: 0 },
        ],
    },
};

/** * Критерии успеха (Thresholds).
 * Если метрики выходят за эти пределы, k6 завершает тест с ошибкой.
 * @type {Object.<string, string[]>}
 */
export const THRESHOLDS = {
    /** Допустимый процент ошибок: менее 1% */
    http_req_failed: ['rate<0.01'],
    /** Допустимое время ответа: 95-й перцентиль должен быть быстрее 200мс */
    http_req_duration: ['p(95)<200'],
};

/**
 * Автоматически выбирает профиль на основе переменной окружения.
 * Использование в сценарии: export const options = GET_OPTIONS();
 */
export const GET_OPTIONS = () => {
    const profileName = __ENV.PROFILE || 'smoke';
    const profile = PROFILES[profileName] || PROFILES.smoke;

    return {
        vus: profile.vus,
        duration: profile.duration,
        stages: profile.stages,
        thresholds: THRESHOLDS,
    };
};

import type { Filters } from './filters.interface';

/**
 * Опции конфигурации модуля Imagor
 */
export interface ImagorModuleOptions {
    /** Базовый URL вашего инстанса Imagor (например, https://imagor.example.com) */
    url: string;

    /** Секретный ключ для генерации HMAC подписи (безопасные URL) */
    secret?: string;

    /** Глобальные фильтры, которые будут применяться ко всем изображениям по умолчанию */
    filters?: Filters;

    /** Базовый путь в S3/хранилище (например, 'products/') */
    storageRoot?: string;

    /**
     * Именованные пресеты для часто используемых трансформаций.
     * @example { 'thumb': { width: 150, height: 150, smart: true } }
     */
    presets?: Record<string, Filters>;

    /** Включает логирование процесса генерации URL для отладки */
    debug?: boolean;
}

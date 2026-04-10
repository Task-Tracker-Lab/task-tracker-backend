import '@nestjs/config';
import { Config } from './config.schema';

declare module '@nestjs/config' {
  interface ConfigService<_K = unknown, _WasValidated extends boolean = false> {
    /**
     * Переопределяем метод get, чтобы он предлагал ключи из нашей схемы
     */
    get<T extends keyof Config>(key: T): Config[T];
    /**
     * Переопределяем метод getOrThrow, чтобы он предлагал ключи из нашей схемы
     */
    getOrThrow<T extends keyof Config>(key: T): Config[T];
  }
}

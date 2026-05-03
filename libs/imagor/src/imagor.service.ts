import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './imagor.module-definition';
import type { ImagorModuleOptions, Filters } from './interfaces';
import { createHmac } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { ImagorPathBuilder } from './utils';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ImagorService {
    constructor(
        @Inject(MODULE_OPTIONS_TOKEN)
        private options: ImagorModuleOptions,
        private readonly http: HttpService,
    ) {}

    prepare(path: string): ImagorPathBuilder {
        const builder = new ImagorPathBuilder(path, this.options.storageRoot);
        if (this.options.filters) builder.applyFilters(this.options.filters);
        return builder;
    }

    async buffer(path: string, preset?: string): Promise<Buffer> {
        const url = this.buildUrl(path, preset);
        const { data } = await firstValueFrom(this.http.get(url, { responseType: 'arraybuffer' }));
        return Buffer.from(data);
    }

    async response(path: string, preset?: string): Promise<StreamableFile> {
        const url = this.buildUrl(path, preset);
        const { data, headers } = await firstValueFrom(
            this.http.get(url, { responseType: 'stream' }),
        );

        return new StreamableFile(data, {
            type: headers['content-type'] as string,
            length: headers['content-length'] ? Number(headers['content-length']) : undefined,
        });
    }

    private buildUrl(path: string, presetOrFilters?: string | any): string {
        const builder = new ImagorPathBuilder(path, this.options.storageRoot);

        if (this.options.filters) builder.applyFilters(this.options.filters);

        if (typeof presetOrFilters === 'string') {
            builder.applyFilters(this.options.presets?.[presetOrFilters] || {});
        } else if (presetOrFilters) {
            builder.applyFilters(presetOrFilters);
        }

        const transformPath = builder.build();
        const signature = this.sign(transformPath);
        const host = this.options.url.replace(/\/+$/, '');

        return `${host}/${signature}/${transformPath}`;
    }

    private sign(path: string): string {
        if (!this.options.secret) return 'unsafe';

        return createHmac('sha1', this.options.secret)
            .update(path)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    private resolveFilters(localFilters?: Filters): Filters {
        return {
            ...this.options.filters,
            ...localFilters,
        };
    }
}

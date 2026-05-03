import type { Filters } from '../interfaces';

export class ImagorPathBuilder {
    private _width: number | 'orig' = 0;
    private _height: number | 'orig' = 0;
    private _isSmart = false;
    private _fitMode?: 'fit-in' | 'stretch' | 'dashed';
    private _filters: Filters = {};

    constructor(
        private readonly path: string,
        private readonly storageRoot?: string,
    ) {}

    resize(width: number | 'orig', height: number | 'orig' = 0): this {
        this._width = width;
        this._height = height;
        return this;
    }

    smart(enabled = true): this {
        this._isSmart = enabled;
        return this;
    }

    fit(mode: 'fit-in' | 'stretch' | 'dashed'): this {
        this._fitMode = mode;
        return this;
    }

    applyFilters(filters: Filters): this {
        this._filters = { ...this._filters, ...filters };
        return this;
    }

    build(): string {
        const parts: string[] = [];

        if (this._fitMode) parts.push(this._fitMode);

        if (this._width || this._height) {
            parts.push(`${this._width}x${this._height}`);
        }

        if (this._isSmart) parts.push('smart');

        const filterString = this.serializeAllFilters(this._filters);
        if (filterString) parts.push(filterString);

        const fullPath = this.storageRoot
            ? `${this.storageRoot}/${this.path}`.replace(/\/+/g, '/')
            : this.path;

        parts.push(fullPath.replace(/^\/+/, ''));

        return parts.join('/');
    }

    private serializeAllFilters(f: Filters): string {
        const s: string[] = [];

        if (f.quality) s.push(`quality(${f.quality})`);
        if (f.format) s.push(`format(${f.format})`);
        if (f.autojpg) s.push('autojpg()');
        if (f.strip_exif) s.push('strip_exif()');
        if (f.strip_icc) s.push('strip_icc()');

        if (f.brightness !== undefined) s.push(`brightness(${f.brightness})`);
        if (f.contrast !== undefined) s.push(`contrast(${f.contrast})`);
        if (f.grayscale) s.push('grayscale()');
        if (f.proportion !== undefined) s.push(`proportion(${f.proportion})`);
        if (f.rgb) s.push(`rgb(${f.rgb.r},${f.rgb.g},${f.rgb.b})`);

        if (f.blur) {
            const b = f.blur;
            s.push(typeof b === 'number' ? `blur(${b})` : `blur(${b.radius},${b.sigma || 0})`);
        }
        if (f.sharpen) {
            s.push(`sharpen(${f.sharpen.amount},${f.sharpen.radius},${f.sharpen.threshold})`);
        }
        if (f.noise) s.push(`noise(${f.noise})`);
        if (f.rotate) s.push(`rotate(${f.rotate})`);

        if (f.fill) s.push(`fill(${f.fill})`);
        if (f.background_color) s.push(`background_color(${f.background_color})`);

        if (f.watermark) {
            const w = f.watermark;
            const params = [
                w.image,
                w.x ?? 0,
                w.y ?? 0,
                w.alpha ?? 0,
                w.w_ratio ?? 0,
                w.h_ratio ?? 0,
            ];
            s.push(`watermark(${params.join(',')})`);
        }

        if (f.focal) s.push(`focal(${f.focal.x}x${f.focal.y})`);
        if (f.round_corner) {
            s.push(
                `round_corner(${f.round_corner.radius}${f.round_corner.color ? ',' + f.round_corner.color : ''})`,
            );
        }

        if (f.max_bytes) s.push(`max_bytes(${f.max_bytes})`);
        if (f.no_upscale) s.push('no_upscale()');

        return s.length ? `filters:${s.join(':')}` : '';
    }
}

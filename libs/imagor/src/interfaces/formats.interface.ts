export const FORMATS = {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
    AVIF: 'avif',
    JP2: 'jp2',
    GIF: 'gif',
} as const;

export type Format = (typeof FORMATS)[keyof typeof FORMATS];

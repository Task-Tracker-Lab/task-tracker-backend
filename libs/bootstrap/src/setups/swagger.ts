import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { SwaggerOptions } from '../interfaces';
import { SWAGGER_DEFAULTS } from '../configs/swagger';
import { GlobalErrorResponse } from '@shared/error/schema';

async function getCustomCSS() {
    const rawUrl = 'https://gist.githubusercontent.com/soorq/f745e5c44cfe27aa928048d6d4ccb18a/raw';
    const res = await fetch(rawUrl);
    if (!res.ok) {
        return '';
    }
    return res.text();
}

export async function setupSwagger(app: NestFastifyApplication, options: SwaggerOptions = {}) {
    const { title, description, version, path, server } = {
        ...SWAGGER_DEFAULTS,
        ...options,
    };

    const { domain, port, stage } = server || {};

    const builder = new DocumentBuilder()
        .setTitle(title)
        .setDescription(description)
        .setVersion(version)
        .addBearerAuth();

    if (port) builder.addServer(`http://localhost:${port}`, 'Local');
    if (stage) builder.addServer(`https://api.${stage}`, 'Staging');
    if (domain) builder.addServer(`https://api.${domain}`, 'Production');

    const document = SwaggerModule.createDocument(app, builder.build(), {
        extraModels: [GlobalErrorResponse.Output],
    });

    const customCss = await getCustomCSS();

    SwaggerModule.setup(path, app, cleanupOpenApiDoc(document), {
        jsonDocumentUrl: `${path}/s/json`,
        yamlDocumentUrl: `${path}/s/yaml`,
        useGlobalPrefix: true,
        ui: true,
        customCss,
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });
}

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { SwaggerOptions } from '../interfaces';
import { SWAGGER_DEFAULTS } from '../configs/swagger';
import { GlobalErrorResponse } from 'src/shared/error/schema';

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

    SwaggerModule.setup(path, app, cleanupOpenApiDoc(document), {
        jsonDocumentUrl: `${path}/s/json`,
        yamlDocumentUrl: `${path}/s/yaml`,
        useGlobalPrefix: true,
        ui: true,
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });
}

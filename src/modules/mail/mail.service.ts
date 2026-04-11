import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as hbs from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as validator from 'email-validator';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private cfg: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.cfg.get('MAIL_HOST'),
            port: this.cfg.get('MAIL_PORT'),
            secure: true,
            auth: {
                user: this.cfg.get('MAIL_USER'),
                pass: this.cfg.get('MAIL_PASSWORD'),
            },
        });
    }

    private validateEmail(email: string) {
        const isValid = validator.validate(email);
        if (!isValid) {
            throw new BadRequestException('Invalid email address');
        }
    }

    private async sendMail(to: string, subject: string, templateName: string, context: any) {
        this.validateEmail(to);

        const templatePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
        const templateSource = fs.readFileSync(templatePath, 'utf8');

        const template = hbs.compile(templateSource);
        const html = template(context);

        return await this.transporter.sendMail({
            from: `"${this.cfg.get('MAIL_FROM_NAME')}" <${this.cfg.get('MAIL_FROM_EMAIL')}>`,
            to,
            subject,
            html,
        });
    }

    async sendRegistrationCode(email: string, name: string, code: string) {
        const codeArray = code.toString().split('');

        return this.sendMail(email, 'Код подтверждения регистрации', 'confirmation', {
            name,
            codeArray,
        });
    }

    async sendResetPasswordCode(email: string, code: string) {
        const codeArray = code.toString().split('');

        return this.sendMail(email, 'Восстановление пароля', 'reset-password', {
            codeArray,
        });
    }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as hbs from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { IMailPort } from './port';

@Injectable()
export class MailAdapter implements IMailPort {
    private transporter: nodemailer.Transporter;

    constructor(private cfg: ConfigService) {
        const port = this.cfg.get('MAIL_PORT');
        const mode = this.cfg.get('NODE_ENV');

        this.transporter = nodemailer.createTransport({
            host: this.cfg.get('MAIL_HOST'),
            port: +port,
            secure: port === 465,
            auth: {
                user: this.cfg.get('MAIL_USER'),
                pass: this.cfg.get('MAIL_PASSWORD'),
            },
            pool: true,
            connectionTimeout: 10000,
            tls: {
                rejectUnauthorized: mode === 'production',
                servername: 'smtp.gmail.com',
            },
        });
    }

    private async sendMail(to: string, subject: string, templateName: string, context: any) {
        const templatePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
        const templateSource = fs.readFileSync(templatePath, 'utf8');

        const contextWithYear = {
            ...context,
            year: new Date().getFullYear(),
        };

        const template = hbs.compile(templateSource);
        const html = template(contextWithYear);

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

    async sendTeamInvitation(email: string, teamName: string, inviteUrl: string) {
        return this.sendMail(email, `Приглашение в команду ${teamName}`, 'team-invitation', {
            teamName,
            inviteUrl,
        });
    }
}

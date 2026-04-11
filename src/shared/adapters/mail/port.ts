export interface IMailPort {
    sendRegistrationCode(email: string, name: string, code: string): Promise<void>;
    sendResetPasswordCode(email: string, code: string): Promise<void>;
}

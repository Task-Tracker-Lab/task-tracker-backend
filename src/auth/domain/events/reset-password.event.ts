export class ResetPasswordEvent {
    constructor(
        public email: string,
        public otp: string,
    ) {}
}

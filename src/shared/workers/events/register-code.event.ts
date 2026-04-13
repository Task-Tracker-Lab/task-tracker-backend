export class RegisterCodeEvent {
    constructor(
        public email: string,
        public name: string,
        public otp: string,
    ) {}
}

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    iss: string;
    aud: string;
    jti: string;
}

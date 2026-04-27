import http from 'k6/http';
import { check } from 'k6';

export default function signIn(baseUrl, user) {
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const signInRes = http.post(
        `${baseUrl}/auth/sign-in`,
        JSON.stringify({ email: user.email, password: user.password }),
        Object.assign({}, params, { tags: { name: 'sign-in' } }),
    );

    const signInToken = signInRes.json().token;
    const signInCookie = signInRes.cookies.refresh ? signInRes.cookies.refresh[0].value : 'MISSING';

    check(signInRes, {
        'sign-in: status is 201': (r) => r.status === 201,
        'sign-in: has access token': (r) => r.json().token !== undefined,
    });

    return {
        signInToken,
        signInCookie,
        signInStatus: signInRes.status,
    };
}

import { check } from 'k6';
import { ApiClient } from '../common/api-client.js';

export default function getAuthUser(user, options = {}) {
    const client = new ApiClient();
    const requestOptions = Object.assign({}, options);

    if (!requestOptions.tags) {
        requestOptions.tags = { name: 'auth-sign-in' };
    }

    const signInRes = client.post(
        '/auth/sign-in',
        {
            email: user.email,
            password: user.password,
        },
        requestOptions,
    );

    check(signInRes, {
        'POST /auth/sign-in has token': (r) => r.json().token !== undefined,
    });

    const token = signInRes.json().token;
    const refreshCookie = signInRes.cookies.refresh
        ? signInRes.cookies.refresh[0].value
        : 'MISSING';

    return {
        client: new ApiClient({ token }),
        token,
        refreshCookie,
        signInRes,
    };
}

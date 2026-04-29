import { SharedArray } from 'k6/data';
import { sleep } from 'k6';
import { GET_OPTIONS } from '../common/config.js';
import getAuthUser from '../shared/get-auth-user.js';

const users = new SharedArray('test users', function () {
    return JSON.parse(open('../data/users.json'));
});

const baseOptions = GET_OPTIONS();
baseOptions.thresholds = Object.assign({}, baseOptions.thresholds, {
    'http_req_duration{name:auth-sign-in}': ['p(95)<333'],
    'http_req_duration{name:auth-refresh}': ['p(95)<333'],
    'http_req_duration{name:auth-sign-out}': ['p(95)<333'],
});

export const options = baseOptions;

export default function () {
    const user = users[(__VU - 1) % users.length];
    const { client, token, refreshCookie } = getAuthUser(user);

    sleep(1);

    // --- REFRESH ---
    const refreshRes = client.post('/auth/refresh', null, {
        cookies: { refresh: refreshCookie },
        tags: { name: 'auth-refresh' },
    });

    const newAccessToken = refreshRes.json().token;
    const newRefreshCookie = refreshRes.cookies.refresh
        ? refreshRes.cookies.refresh[0].value
        : 'NOT_ROTATED';

    sleep(1);

    // --- SIGN OUT ---
    const refreshToken = newAccessToken || token;
    const signOutCookie = newRefreshCookie !== 'NOT_ROTATED' ? newRefreshCookie : refreshCookie;

    client.post(
        '/auth/sign-out',
        {},
        {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
            cookies: { refresh: signOutCookie },
            tags: { name: 'auth-sign-out' },
        },
    );

    sleep(1);
}

import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { check, sleep } from 'k6';
import signIn from '../shared/sign-in.js';

const users = new SharedArray('test users', function () {
    return JSON.parse(open('../data/users.json'));
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';
const VUS = parseInt(__ENV.VUS) || 10;
const DURATION = __ENV.DURATION || '1m';

export const options = {
    thresholds: {
        'http_req_duration{name:sign-in}': ['p(95)<800'],
        'http_req_duration{name:refresh}': ['p(95)<200'],
        'http_req_duration{name:sign-out}': ['p(95)<200'],
        http_req_failed: ['rate<0.1'],
    },
    scenarios: {
        auth_load_test: {
            executor: 'constant-vus',
            vus: VUS,
            duration: DURATION,
        },
    },
};

export default function () {
    const user = users[(__VU - 1) % users.length];

    // --- SIGN-IN ---
    const { signInToken, signInCookie } = signIn(BASE_URL, user);

    sleep(1);

    // --- REFRESH ---
    const refreshRes = http.post(`${BASE_URL}/auth/refresh`, null, {
        tags: { name: 'refresh' },
        cookies: { refresh: signInCookie },
    });

    const newAccessToken = refreshRes.json().token;
    const newRefreshCookie = refreshRes.cookies.refresh
        ? refreshRes.cookies.refresh[0].value
        : 'NOT_ROTATED';

    check(refreshRes, {
        'refresh: status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // --- SIGN OUT ---
    const refreshToken = newAccessToken || signInToken;
    const refreshCookie = newRefreshCookie !== 'NOT_ROTATED' ? newRefreshCookie : signInCookie;

    const signOutRes = http.post(
        `${BASE_URL}/auth/sign-out`,
        {},
        {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
            tags: { name: 'sign-out' },
            cookies: { refresh: refreshCookie },
        },
    );

    check(signOutRes, {
        'sign-out: status is 200': (r) => r.status === 200,
    });

    sleep(1);
}

import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import signIn from '../shared/sign-in.js';

const users = new SharedArray('test users', function () {
    return JSON.parse(open('../data/users.json'));
});

const BASE_URL = __ENV.BASE_URL;
const VUS = parseInt(__ENV.VUS);
const DURATION = __ENV.DURATION;

const LOGIN_WINDOW = `${Math.ceil(VUS * 0.15)}s`;

export const options = {
    thresholds: {
        'http_req_duration{name:get-me}': ['p(95)<150'],
        'http_req_duration{name:get-activity}': ['p(95)<250'],
        'http_req_duration{name:patch-me}': ['p(95)<300'],
        'http_req_duration{name:post-avatar}': ['p(95)<300'],
        'http_req_duration{name:patch-notifications}': ['p(95)<300'],
        http_req_failed: ['rate<0.1'],
    },
    scenarios: {
        login_phase: {
            executor: 'per-vu-iterations',
            vus: VUS,
            iterations: 1,
            maxDuration: LOGIN_WINDOW,
            gracefulStop: '0s',
        },
        users_load_test: {
            executor: 'constant-vus',
            vus: VUS,
            duration: DURATION,
            startTime: LOGIN_WINDOW,
            gracefulStop: '0s',
        },
    },
};

const avatar = open('../data/user-avatar.png', 'b');
const randomBool = () => Math.random() < 0.5;
const randomStr = (len = 8) =>
    Math.random()
        .toString(36)
        .substring(2, 2 + len);
let authContext = null;

export default function () {
    const user = users[(__VU - 1) % users.length];

    if (!authContext) {
        const loginDelay = (__VU - 1) * 0.1;
        sleep(loginDelay);

        const { signInToken, signInCookie, signInStatus } = signIn(BASE_URL, user);

        if (signInStatus !== 201) {
            console.error(`VU ${__VU} failed to login: Status ${signInStatus}`);
            sleep(1);
            return;
        }

        authContext = {
            token: signInToken,
            cookie: signInCookie,
        };
    }

    if (authContext && __ITER > 0) {
        const params = {
            headers: {
                Authorization: `Bearer ${authContext.token}`,
                'Content-Type': 'application/json',
            },
            cookies: { refresh: authContext.cookie },
        };

        // --- GET /me ---
        const meRes = http.get(
            `${BASE_URL}/users/me`,
            Object.assign({}, params, {
                tags: { name: 'get-me' },
            }),
        );

        check(meRes, {
            'get | me: status is 200': (r) => r.status === 200,
            'get | me: has id': (r) => r.json().id !== undefined,
        });

        sleep(1);

        // --- GET /me/activity ---
        const randomPage = Math.floor(Math.random() * 5) + 1;
        const randomLimit = Math.floor(Math.random() * 15) + 5;

        const activityRes = http.get(
            `${BASE_URL}/users/me/activity?page=${randomPage}&limit=${randomLimit}`,
            Object.assign({}, params, {
                tags: { name: 'get-activity' },
            }),
        );

        if (activityRes.status !== 200) {
            console.log(`Activity failed: Status ${activityRes.status}, Body: ${activityRes.body}`);
        }

        check(activityRes, {
            'get | me/activity: status is 200': (r) => r.status === 200,
        });

        sleep(1);

        // --- PATCH /me ---
        const meBody = JSON.stringify({
            firstName: `Name_${randomStr(5)}`,
            lastName: `Surname_${randomStr(5)}`,
            bio: `Testing bio with random data: ${randomStr(30)}`,
            language: Math.random() > 0.5 ? 'ru' : 'en',
        });
        const updateProfileRes = http.patch(
            `${BASE_URL}/users/me`,
            meBody,
            Object.assign({}, params, {
                tags: { name: 'patch-me' },
            }),
        );

        check(updateProfileRes, {
            'patch | me: status is 200': (r) => r.status === 200,
            'patch | me: success in response': (r) => r.json().success === true,
        });

        sleep(1);

        // --- POST /me/avatar ---
        const fd = new FormData();
        fd.append('file', http.file(avatar, 'avatar.png', 'image/png'));

        const avatarRes = http.post(`${BASE_URL}/users/me/avatar`, fd.body(), {
            headers: {
                Authorization: `Bearer ${authContext.token}`,
                'Content-Type': `multipart/form-data; boundary=${fd.boundary}`,
            },
            tags: { name: 'post-avatar' },
        });

        check(avatarRes, {
            'post | me/avatar: status is 201': (r) => r.status === 201,
            'post | me/avatar: success in response': (r) => r.json().success === true,
        });

        sleep(1);

        // --- PATCH /me/notifications ---
        const notificationsBody = JSON.stringify({
            email: {
                task_assigned: randomBool(),
                mentions: randomBool(),
                daily_summary: randomBool(),
            },
            push: {
                task_assigned: randomBool(),
                reminders: randomBool(),
            },
        });

        const notificationsRes = http.patch(
            `${BASE_URL}/users/me/notifications`,
            notificationsBody,
            Object.assign({}, params, {
                tags: { name: 'patch-notifications' },
            }),
        );

        check(notificationsRes, {
            'patch | me/notifications: status is 200': (r) => r.status === 200,
            'patch | me/notifications: success in response': (r) => r.json().success === true,
        });

        sleep(1);
    }
}

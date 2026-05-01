import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { GET_OPTIONS } from '../common/config.js';
import getAuthUser from '../shared/get-auth-user.js';

const users = new SharedArray('test users', function () {
    return JSON.parse(open('../data/users.json'));
});

const baseOptions = GET_OPTIONS();
baseOptions.thresholds = Object.assign({}, baseOptions.thresholds, {
    'http_req_duration{name:auth-sign-in}': ['p(95)<333'],
    'http_req_duration{name:users-me}': ['p(95)<333'],
    'http_req_duration{name:users-activity}': ['p(95)<333'],
    'http_req_duration{name:users-patch}': ['p(95)<333'],
    'http_req_duration{name:users-avatar}': ['p(95)<333'],
    'http_req_duration{name:users-notifications}': ['p(95)<333'],
});

export const options = baseOptions;

const avatar = open('../data/user-avatar.png', 'b');
const randomBool = () => Math.random() < 0.5;
const randomStr = (len = 8) =>
    Math.random()
        .toString(36)
        .substring(2, 2 + len);

export default function () {
    const user = users[(__VU - 1) % users.length];
    const { client } = getAuthUser(user);

    sleep(1);

    // --- GET /me ---
    client.get('/users/me', {}, { tags: { name: 'users-me' } });

    sleep(1);

    // --- GET /me/activity ---
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const randomLimit = Math.floor(Math.random() * 15) + 5;
    client.get(
        '/users/me/activity',
        { page: randomPage, limit: randomLimit },
        { tags: { name: 'users-activity' } },
    );

    sleep(1);

    // --- PATCH /me ---
    const meBody = {
        firstName: `Name_${randomStr(5)}`,
        lastName: `Surname_${randomStr(5)}`,
        bio: `Testing bio with random data: ${randomStr(30)}`,
        language: Math.random() > 0.5 ? 'ru' : 'en',
    };

    client.patch('/users/me', meBody, { tags: { name: 'users-patch' } });

    sleep(1);

    // --- POST /me/avatar ---
    const fd = new FormData();
    fd.append('file', http.file(avatar, 'avatar.png', 'image/png'));

    client.post('/users/me/avatar', fd.body(), {
        rawBody: true,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${fd.boundary}`,
        },
        tags: { name: 'users-avatar' },
    });

    sleep(1);

    // --- PATCH /me/notifications ---
    const notificationsBody = {
        email: {
            task_assigned: randomBool(),
            mentions: randomBool(),
            daily_summary: randomBool(),
        },
        push: {
            task_assigned: randomBool(),
            reminders: randomBool(),
        },
    };

    client.patch('/users/me/notifications', notificationsBody, {
        tags: { name: 'users-notifications' },
    });

    sleep(1);
}

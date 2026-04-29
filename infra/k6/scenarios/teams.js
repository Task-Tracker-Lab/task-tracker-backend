import { SharedArray } from 'k6/data';
import { sleep } from 'k6';
import { GET_OPTIONS } from '../common/config.js';
import getAuthUser from '../shared/get-auth-user.js';

const users = new SharedArray('test users', function () {
    return JSON.parse(open('../data/users.json'));
});
const randomStr = (len = 8) =>
    Math.random()
        .toString(36)
        .substring(2, 2 + len);
const baseOptions = GET_OPTIONS();
baseOptions.thresholds = Object.assign({}, baseOptions.thresholds, {
    'http_req_duration{name:auth-sign-in}': ['p(95)<333'],
    'http_req_duration{name:teams-create}': ['p(95)<333'],
    'http_req_duration{name:teams-check-slug}': ['p(95)<333'],
    'http_req_duration{name:teams-find-one}': ['p(95)<333'],
    'http_req_duration{name:teams-update}': ['p(95)<333'],
    'http_req_duration{name:teams-delete}': ['p(95)<333'],
});

export const options = baseOptions;

export default function () {
    const user = users[(__VU - 1) % users.length];
    const { client } = getAuthUser(user);

    sleep(1);

    // --- POST /teams ---
    const slug = randomStr(10);
    const team = {
        name: 'k6_team_' + slug,
        description: randomStr(15),
        slug: slug,
    };
    client.post('/teams', team, { tags: { name: 'teams-create' } });

    sleep(1);

    // --- GET /check-slug/:slug ---
    client.get(`/teams/check-slug/${slug}`, {}, { tags: { name: 'teams-check-slug' } });

    sleep(1);

    // --- GET /:slug ---
    client.get(`/teams/${slug}`, {}, { tags: { name: 'teams-find-one' } });

    sleep(1);

    // --- PATCH /:slug ---
    const updatedTeam = {
        description: randomStr(25),
    };
    client.patch(`/teams/${slug}`, updatedTeam, {
        tags: { name: 'teams-update' },
    });

    sleep(1);

    // --- DELETE /:slug ---
    client.delete(`/teams/${slug}`, {
        tags: { name: 'teams-delete' },
    });

    sleep(1);
}

import { SharedArray } from 'k6/data';
import { sleep, check } from 'k6';
import { GET_OPTIONS } from '../common/config.js';
import getAuthUser from '../shared/get-auth-user.js';

const users = new SharedArray('test users', function () {
    return JSON.parse(open('../data/users.json'));
});
const teams = new SharedArray('test teams', function () {
    return JSON.parse(open('../data/teams.json'));
});
const randomStr = (len = 8) =>
    Math.random()
        .toString(36)
        .substring(2, 2 + len);
const randomNum = (min = 1, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min;
const baseOptions = GET_OPTIONS();
baseOptions.thresholds = Object.assign({}, baseOptions.thresholds, {
    'http_req_duration{name:auth-sign-in}': ['p(95)<333'],
    'http_req_duration{name:post-teams-projects}': ['p(95)<333'],
    'http_req_duration{name:teams-projects}': ['p(95)<333'],
    'http_req_duration{name:teams-projects-id}': ['p(95)<333'],
    'http_req_duration{name:teams-projects-generate-token}': ['p(95)<333'],
    'http_req_duration{name:teams-projects-archive}': ['p(95)<333'],
    'http_req_duration{name:delete-teams-projects}': ['p(95)<333'],
});

export const options = baseOptions;

export default function () {
    const user = users[(__VU - 1) % users.length];
    const team = teams[(__VU - 1) % users.length];
    const { client } = getAuthUser(user);

    sleep(1);

    // --- create project ---
    const projectName = randomStr();
    const project = {
        name: projectName,
        key: `QWE${randomNum(1000, 9999)}`,
        description: 'description for k6_test_project',
        visibility: 'public',
    };
    const createRes = client.post(`/teams/${team.slug}/projects`, project, {
        tags: { name: 'post-teams-projects' },
    });
    const projectId = createRes.json().projectId;

    sleep(1);

    // --- update project ---
    const newProjectName = randomStr();
    const updatedProject = {
        name: newProjectName,
    };
    client.patch(`/teams/${team.slug}/projects/${projectId}`, updatedProject, {
        tags: { name: 'patch-teams-projects' },
    });

    sleep(1);

    // --- get all teams projects ---

    const getAllRes = client.get(
        `/teams/${team.slug}/projects`,
        {},
        { tags: { name: 'get-teams-projects' } },
    );

    check(getAllRes, { 'projects list has meta': (r) => r.json().meta !== undefined });

    sleep(1);

    // --- get one team project ---
    client.get(
        `/teams/${team.slug}/projects/${projectId}`,
        {},
        { tags: { name: 'teams-projects-id' } },
    );

    sleep(1);

    // --- generate share token ---
    const shareTokenRes = client.post(
        `/teams/${team.slug}/projects/${projectId}/share`,
        {},
        { tags: { name: 'teams-projects-generate-token' } },
    );

    check(shareTokenRes, {
        'POST /teams/:slug/projects/:id/share: has token': (r) =>
            r.json().payload.token !== undefined,
    });

    sleep(1);

    // --- archive project ---

    client.post(
        `/teams/${team.slug}/projects/${projectId}/archive`,
        {},
        { tags: { name: 'teams-projects-archive' } },
    );

    sleep(1);

    // --- delete project ---

    client.delete(
        `/teams/${team.slug}/projects/${projectId}`,
        {},
        { tags: { name: 'delete-teams-projects' } },
    );

    sleep(1);
}

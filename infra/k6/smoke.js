import { sleep } from 'k6';
import { ApiClient } from './common/client.js';
import { BASE_URL, GET_OPTIONS } from './common/config.js';

export const options = GET_OPTIONS();

const client = new ApiClient(BASE_URL);

export default function () {
    client.get('/health');
    sleep(1);
}

import { edenTreaty } from '@elysiajs/eden';
import type { App } from '../../api/src/index.ts';
const api = edenTreaty<App>('http://localhost:3000');
console.log(api);

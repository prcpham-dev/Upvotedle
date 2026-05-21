import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { api } from './routes/api';
import { menu } from './routes/menu';
import { triggers } from './routes/triggers';
import { scheduler } from './routes/scheduler';
const app = new Hono();
const internal = new Hono();
// Internal routes: triggered by Devvit platform events
internal.route('/menu', menu);
internal.route('/triggers', triggers);
internal.route('/scheduler', scheduler);
// Public API routes: called by the client webview
app.route('/api', api);
app.route('/internal', internal);
serve({
    fetch: app.fetch,
    createServer,
    port: getServerPort(),
});
//# sourceMappingURL=index.js.map
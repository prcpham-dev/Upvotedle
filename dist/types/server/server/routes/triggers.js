import { Hono } from 'hono';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';
export const triggers = new Hono();
triggers.post('/on-app-install', async (c) => {
    try {
        const post = await createPost();
        const input = await c.req.json();
        return c.json({
            status: 'success',
            message: `Post created in r/${context.subredditName} with id ${post.id} (trigger: ${input.type})`,
        }, 200);
    }
    catch (error) {
        console.error('[triggers/on-app-install] Failed:', error);
        return c.json({ status: 'error', message: 'Failed to create post' }, 400);
    }
});
//# sourceMappingURL=triggers.js.map
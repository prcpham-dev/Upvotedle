import { Hono } from 'hono';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';
export const menu = new Hono();
/**
 * POST /internal/menu/post-create
 * Moderator menu item: creates the Redditdle game post in the subreddit.
 */
menu.post('/post-create', async (c) => {
    try {
        const post = await createPost();
        return c.json({ navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}` }, 200);
    }
    catch (error) {
        console.error('[menu/post-create] Failed:', error);
        return c.json({ showToast: 'Failed to create post' }, 400);
    }
});
//# sourceMappingURL=menu.js.map
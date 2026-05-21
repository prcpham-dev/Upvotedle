import { reddit } from '@devvit/web/server';
export const createPost = async () => {
    return await reddit.submitCustomPost({
        title: 'upvotedle-game',
    });
};
//# sourceMappingURL=post.js.map
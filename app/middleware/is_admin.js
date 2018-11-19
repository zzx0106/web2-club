'use strict';

module.exports = () => {
    return async (ctx, next) => {
        if (!(ctx.state.user && ctx.state.user.data._id)) {
            ctx.helper.error({
                ctx,
                rspinf: '你还没有登录。',
            });
            return;
        }

        // if (!ctx.user.is_admin) {
        //     ctx.helper.error({
        //         ctx,
        //         rspinf: '需要管理员权限。',
        //     });
        //     return;
        // }

        await next();
    };
};

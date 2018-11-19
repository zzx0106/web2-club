'use strict';

const moment = require('moment');

module.exports = (limit) => {
    return async function createUserLimit(ctx, next) {
        const { service, helper } = ctx;
        const ip = ctx.ip;
        const time = moment().format('YYYYMMDDHHmmss');
        const key = `user_count_${ip}_${time}`;
        let count = (await service.cache.getCache(key)) || 0;
        if (count >= limit) {
            helper({
                ctx,
                rspinf: '抱歉！每个ip仅允许注册一次！',
                status: 403,
            });
            return;
        }
        await next();
        // TODO: 这个地方需要改造，通过ip和admin下发的token作为制定标识存储
        if (ctx.status === 302) {
            count += 1;
            await service.cache.incrCache(key, 60 * 60 * 24);
            console.log('进入302没？')

            // Header名称	含义 https://developers.douban.com/wiki/?title=oauth2
            // X-Ratelimit-Limit	单用户每小时次数
            // X-RateLimit-Remaining	单用户每小时剩余次数
            // X-Ratelimit-Limit2	单ip每小时次数
            // X-RateLimit-Remaining2	单ip每小时剩余次数
            ctx.set('X-RateLimit-Limit', limit);
            ctx.set('X-RateLimit-Remaining', limit - count);
        }
    };
};

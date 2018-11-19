'use strict';

const Service = require('egg').Service;

class CacheService extends Service {
    async getCache(key) {
        const { redis, logger } = this.app;
        const time = Date.now();
        let data = await redis.get(key);
        if (!data) return;
        data = JSON.parse(data);
        const duration = Date.now() - time;
        logger.debug('Cache', 'get', key, duration + 'ms');
        return data;
    }
    /**
     * 
     * @param {String} key 键
     * @param {Object} value 值
     * @param {Number} cachetime 缓存时间默认EX(秒)
     */
    async setCache(key, value, cachetime) {
        const { redis, logger } = this.app;
        const time = Date.now();
        value = JSON.stringify(value);
        // EX seconds − 设置指定的到期时间(以秒为单位)。
        // PX milliseconds - 设置指定的到期时间(以毫秒为单位)。
        // NX - 仅在键不存在时设置键。
        // XX - 只有在键已存在时才设置。
        await redis.set(key, value, 'EX', cachetime);
        const duration = Date.now() - time;
        logger.debug('Cache', 'set', key, (duration + 'ms').green);
    }

    async incrCache(key, cachetime) {
        const { redis, logger } = this.app;
        const time = Date.now();
        const result = await redis
            //命令用于标记一个事务块的开始。
            //事务块内的多条命令会按照先后顺序被放进一个队列当中，最后由 EXEC 命令原子性(atomic)地执行。
            .multi()
            //Redis Incr 命令将 key 中储存的数字值增一。
            //如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 INCR 操作。
            .incr(key)
            //Redis Expire 命令用于设置 key 的过期时间。key 过期后将不再可用。
            .expire(key, cachetime)
            //返回一个promise实例
            .exec();
        const duration = Date.now() - time;
        logger.debug('Cache', 'set', key, duration + 'ms');
        return result[0][1];
    }
}
module.exports = CacheService;

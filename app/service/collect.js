'use strict';

const Service = require('egg').Service;

class CollectService extends Service {
    /**
     * 新增收藏
     * @param {ObjectId} userId
     * @param {ObjectId} topicId
     */
    newAndSave(userId, topicId) {
        const topic_collect = new this.ctx.model.Collect();
        topic_collect.user_id = userId;
        topic_collect.topic_id = topicId;
        return topic_collect.save();
    }
    /**
     * 根据id查询主题收藏
     * @param {ObjectId} userId
     * @param {ObjectId} topicId
     * callback
     *  返回数据代表用于已经收藏过
     */
    getTopicCollect(userId, topicId) {
        const query = { user_id: userId, topic_id: topicId };
        return this.ctx.model.Collect.findOne(query).exec();
    }
    /**
     * 取消收藏
     * @param {ObjectId} userId
     * @param {ObjectId} topicId
     */
    remove(userId, topicId) {
        const query = { user_id: userId, topic_id: topicId };
        return this.ctx.model.Collect.remove(query).exec();
    }
    getCollectsByUserId(userId, opt) {
        const defaultOpt = { sort: '-create_at' };
        opt = Object.assign(defaultOpt, opt);
        console.log('user_id', userId)
        return this.ctx.model.Collect.find({ user_id: userId }, '', opt).exec();
    }
}
module.exports = CollectService;

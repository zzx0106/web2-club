'use strict';

const Service = require('egg').Service;
const qiniu = require('qiniu');
const _ = require('lodash');
/**
 * 根据关键词，获取主题列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 */
class TopicService extends Service {
    async getTopicsByQuery(query, opt) {
        const topics = await this.ctx.model.Topic.find(query, { content: 0 }, opt)
            .populate('author', { nickname: 1, avatar_url: 1 })
            .exec();

        if (topics.length === 0) {
            return [];
        }
        return topics;
    }

    newAndSave(title, content, tab, authorId) {
        const topic = new this.ctx.model.Topic();
        topic.title = title;
        topic.content = content;
        topic.tab = tab;
        topic.author_id = authorId;
        topic.author = authorId;
        return topic.save();
    }
    async updateTabs(topic_id, tab, authorId) {
        let other = await this.ctx.model.Other.findOne({}, { tabs: 1 }).exec();
        if (!other) {
            // 创建other
            other = await this.ctx.model.Other();
            let newTabs = tab.map((item) => {
                item.hot = 1; // 默认传进来的是0，初始化增加到1
                return Object.assign({}, item, {
                    topic_ids: [topic_id],
                    create_at: new Date().getTime(),
                });
            });
            Object.assign(other.tabs, newTabs);
            other.save();
        } else {
            let tabs = other.toObject().tabs;
            other.tabs = this.ctx.helper.newArr(tabs, tab); // 合并数组，原数组有的 hot++ 没有的push

            // 给每个tabs添加对应的topicid
            let newTabs = other.tabs.map((item) => {
                let topic_ids = item.topic_ids;
                let _tab = item;
                // 如果数组中没有这个id
                let isSameTab = tab.some((item) => {
                    return item.name === _tab.name;
                });
                // 为选中的tab添加当前topicid
                if (isSameTab) {
                    topic_ids = [...item.topic_ids, ...[topic_id]];
                }
                return Object.assign(item, {
                    topic_ids,
                    create_at: item.create_at ? item.create_at : new Date().getTime(),
                });
            });
            Object.assign(other.tabs, newTabs);
            other.save();
        }
    }
    /**
     * 根据主题ID获取主题
     * @param {String} id 主题ID
     */
    async getTopicAndAuthorById(id) {
        const topic = await this.ctx.model.Topic.findOne({ _id: id }).exec();
        if (!topic) {
            return {
                topic: null,
                author: null,
                last_reply: null,
            };
        }
        let author = await this.service.user.getUserById(topic.author_id);
        let last_reply = null;
        if (topic.last_reply) {
            last_reply = await this.service.reply.getReplyById(topic.last_reply);
        }
        return {
            topic,
            author: _.omit(author.toObject(), ['password', 'history_login_ip']), // toObject将mongoose对象转化为普通对象
            last_reply,
        };
    }
    /**
     * 根据主题ID删除主题
     * @param {String} id 主题ID
     */
    deleteTopicById(id) {
        return ctx.model.Topic.findByIdAndRemove(id);
    }
    /**
     * 获取所有信息的主题
     * @param {String} id 主题ID
     */
    async getFullTopic(id) {
        const query = { _id: id };
        const topic = await this.ctx.model.Topic.findOne(query);
        if (!topic) {
            // throw new Error('此话题不存在或已被删除。');
            return [];
        }

        topic.linkedContent = this.service.at.linkUsers(topic.content);

        const author = await this.service.user.getUserById(topic.author_id);
        if (!author) {
            // throw new Error('话题的作者丢了。');
            return [];
        }
        const replies = await this.service.reply.getRepliesByTopicId(topic._id);
        return [topic, author, replies];
    }
    /**
     * 获取主题
     * @param {String} id 主题ID
     */
    async getTopicById(id) {
        return this.ctx.model.Topic.findOne({ _id: id })
            .populate('author', { password: 0, history_login_ip: 0 }) // 关联查询
            .exec();
    }
    /**
     * 增加用户的主题浏览数
     * @param {String} id 用户id
     */
    incrementVisitCount(id) {
        const query = { _id: id };
        const update = { $inc: { visit_count: 1 } };
        return this.ctx.model.Topic.findByIdAndUpdate(query, update).exec();
    }
    /**
     * 增加用户的主题的收藏数
     * @param {String} id 用户id
     */
    incrementCollectCount(id) {
        const query = { _id: id };
        const update = { $inc: { collect_count: 1 } };
        return this.ctx.model.Topic.findByIdAndUpdate(query, update).exec();
    }
    /**
     * 减少用户的主题的收藏数
     * @param {String} id 用户id
     */
    decrementCollectCount(id) {
        const query = { _id: id };
        const update = { $inc: { collect_count: -1 } };
        return this.ctx.model.Topic.findByIdAndUpdate(query, update).exec();
    }

    /**
     * 更新主题的最后回复信息
     * @param {String} topicId 主题ID
     * @param {String} replyId 回复ID
     */
    updateLastReply(topicId, replyId) {
        const update = {
            last_reply: replyId,
            last_reply_at: new Date().getTime(),
            $inc: {
                reply_count: 1,
            },
        };
        const opts = { new: true };
        return this.ctx.model.Topic.findByIdAndUpdate(topicId, update, opts).exec();
    }
    /**
     * 将当前主题的回复计数减1，并且更新最后回复的用户，删除回复时用到
     * @param {String} id 主题ID
     */
    async reduceCount(id) {
        const update = { $inc: { reply_count: -1 } };
        const reply = await this.service.reply.getLastReplyByTopId(id);
        if (reply) {
            update.last_reply = reply._id;
        } else {
            update.last_reply = null;
        }
        const opts = { new: true };

        const topic = await this.ctx.model.Topic.findByIdAndUpdate(id, update, opts).exec();
        if (!topic) {
            throw new Error('该主题不存在');
        }

        return topic;
    }
    getAllTabs() {
        return this.ctx.model.Topic.find({}, {}, opt).exec();
    }
    getTopicsById(author_id) {
        return this.ctx.model.Topic.find({ author_id }, { content: 0 })
            .populate('author', { password: 0, history_login_ip: 0 })
            .exec();
    }
}
module.exports = TopicService;

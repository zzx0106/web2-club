'use strict';

const Service = require('egg').Service;

class ReplyService extends Service {
    async getReplyById(id) {
        if (!id) {
            return null;
        }
        const reply = await this.ctx.model.Reply.findOne({ _id: id }).exec();
        if (!reply) {
            return null;
        }
        const author_id = reply.author_id;
        const author = await this.service.user.getUserById(author_id);
        reply.author = author;
        const str = this.service.at.linkUsers(reply.content); // 判断是否@了某些人
        reply.content = str;
        return reply;
    }
    /**
     * 根据主题ID，获取回复列表
     * @param {String} id 主题ID
     */
    async getRepliesByTopicId(id) {
        const query = { topic_id: id };
        let replies = await this.ctx.model.Reply.find(query, '', { sort: 'create_at' }).exec();
        if (replies.length === 0) {
            return [];
        }
        return Promise.all(
            replies.map(async (item) => {
                const author = await this.service.user.getUserById(item.author_id);
                item.author = author || { _id: '' };
                console.log('authorid', author._id);
                item.reply_id = author._id;
                item.content = await this.service.at.linkUsers(item.content);
                return item;
            })
        );
    }

    /**
     * 创建并保存一条回复信息
     * @param {String} content 回复内容
     * @param {String} topicId 主题ID
     * @param {String} authorId 回复作者
     * @param {String} [replyId] 回复ID，当二级回复时设定该值
     */
    async newAndSave(content, topicId, authorId, replyId = null) {
        const reply = new this.ctx.model.Reply();
        reply.content = content;
        reply.topic_id = topicId;
        reply.author_id = authorId;
        if (replyId) {
            reply.reply_id = replyId;
        } else {
            reply.reply_id = authorId;
        }

        await reply.save();
        return reply;
    }

    /**
     * 删除评论
     * @param {ObjectId} reply_id 评论id
     */
    remove(reply_id) {
        const query = { reply_id };
        return this.ctx.model.Reply.remove(query).exec();
    }
    /**
     * 根据topicId查询到最新的一条未删除回复
     * @param topicId 主题ID
     * @return {Promise[reply]} 承载 replay 的 Promise 对象
     */
    getLastReplyByTopId(topicId) {
        const query = { topic_id: topicId };
        const opts = { sort: { create_at: -1 }, limit: 1 };
        return this.ctx.model.Reply.findOne(query, '_id', opts).exec();
    }
}
module.exports = ReplyService;

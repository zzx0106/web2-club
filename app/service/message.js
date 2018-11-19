'use strict';

const Service = require('egg').Service;
class MessageService extends Service {
    /**
     *
     * @param {String} userId
     * @param {String} authorId
     * @param {String} topicId
     * @param {String} replyId
     */
    async sendAtMessage(userId, authorId, topicId, replyId) {
        const message = this.ctx.model.Message();

        message.type = 'at';
        message.master_id = userId;
        message.author_id = authorId;
        message.topic_id = topicId;
        message.reply_id = replyId;

        return message.save();
    }
    async sendReplyMessage(userId, authorId, topicId, replyId) {
        const message = this.ctx.model.Message();

        message.type = 'reply';
        message.master_id = userId;
        message.author_id = authorId;
        message.topic_id = topicId;
        message.reply_id = replyId;

        return message.save();
    }
}
module.exports = MessageService;

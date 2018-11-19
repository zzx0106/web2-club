'use strict';

const Controller = require('egg').Controller;

class ReplyController extends Controller {
    // 添加回复
    async add() {
        const { ctx, service } = this;
        const { reply_id, content } = ctx.request.body;
        const topic_id = ctx.params.tid;
        const user_id = ctx.state.user.data._id;

        if (content.trim() === '') {
            ctx.helper.error({
                ctx,
                rspinf: '回复内容不能为空!',
                status: 422,
            });
            return;
        }
        let topic = await service.topic.getTopicById(topic_id);

        if (!topic) {
            ctx.helper.error({
                ctx,
                rspinf: '这个主题不存在。',
            });
            return;
        }
        console.log('create', topic_id, user_id);
        const author = await service.user.getUserById(topic.author_id);
        const newContent = content.replace(`@${author.name} `, '');
        const reply = await service.reply.newAndSave(content, topic_id, user_id, reply_id);
        await Promise.all([
            service.user.incrementScoreAndReplyCount(user_id, 5),
            service.topic.updateLastReply(topic_id, reply._id),
        ]);

        await service.at.sendMessageToMentionUsers(newContent, topic_id, user_id, reply._id);
        if (topic.author_id.toString() !== user_id.toString()) {
            await service.message.sendReplyMessage(topic.author_id, user_id, topic._id, reply._id);
        }
        ctx.helper.success({
            ctx,
            rspinf: '回复成功',
        });
    }
    // 删除回复
    async delete() {
        const { ctx, service } = this;
        const reply_id = ctx.params.rid;
        const reply = await service.reply.getReplyById(reply_id);

        if (!reply) {
            ctx.helper.error({
                ctx,
                rspinf: '并无该回复，无法删除',
            });
            return;
        }
        if (reply.author_id.toString() === ctx.user._id.toString() || ctx.user.is_admin) {
            // reply.deleted = true;
            await ctx.service.reply.remove(reply.reply_id);
            reply.save();
            reply.author.score -= 5;
            reply.author.reply_count -= 1;
            reply.author.save();
            ctx.helper.success({
                ctx,
                rspinf: '删除成功',
            });
        } else {
            ctx.helper.error({
                ctx,
                rspinf: '删除失败',
            });
        }
        // topic回复数-1
        await service.topic.reduceCount(reply.topic_id);
    }
    // 点赞
    async up() {
        const { ctx, service } = this;
        const reply_id = ctx.params.rid;
        const user_id = ctx.state.user.data._id;
        let action;
        console.log('reply_id----', reply_id);

        const reply = await service.reply.getReplyById(reply_id);
        console.log('reply----！！', reply);
        console.log('reply----', this.ctx.model.Reply());
        if (!reply) {
            ctx.helper.success({
                ctx,
                data: {
                    type: 1,
                    rspinf: '此回复不存在或已被删除。',
                },
            });
            return;
        }
        if (reply.author_id.toString() === user_id.toString()) {
            ctx.helper.success({
                ctx,
                data: {
                    type: 1,
                    rspinf: '嗯哼？不能自己赞自己哦',
                },
            });
            return;
        }
        reply.ups = reply.ups || [];
        const upIndex = reply.ups.indexOf(user_id);
        if (upIndex === -1) {
            // 如果点过就取消
            reply.ups.push(user_id);
            action = {
                type: 0,
                rspinf: '点赞成功',
            };
        } else {
            reply.ups.splice(upIndex, 1);
            action = {
                type: 1,
                rspinf: '取消点赞',
            };
        }
        await reply.save();
        ctx.helper.success({
            ctx,
            data: action,
        });
    }
}
module.exports = ReplyController;

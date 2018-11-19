'use strict';

const Service = require('egg').Service;

class SearchService extends Service {
    /**
     *
     * @param {RegExp} reg
     */
    async search(type, reg, sort) {
        sort = sort || { _id: -1 }; // 默认按时间倒序（id根据时间生成）
        const { ctx } = this;
        if (type === 'user') {
            let users = await ctx.model.User.find(
                {
                    $or: [{ nickname: { $regex: reg } }],
                },
                { _id: 0, __v: 0 }
            ).exec();
            if (users.length === 0) {
                return [];
            }
            const UserAndTopic = Promise.all(
                users.map(async (user) => {
                    user.topics = await ctx.model.Topic.find({ author_id: user._id })
                        .sort(sort)
                        .exec();
                    return user;
                })
            );
            return UserAndTopic;
        } else {
            return (
                ctx.model.Topic.find(
                    {
                        $or: [{ title: { $regex: reg } }, { content: { $regex: reg } }, { singer: { $regex: reg } }],
                    },
                    { _id: 0, __v: 0 }
                )
                    .sort(sort)
                    // .populate([{ path: 'relation' }])
                    .populate('author',  { password: 0, history_login_ip: 0 })
                    .exec()
            );
        }
    }
}

module.exports = SearchService;

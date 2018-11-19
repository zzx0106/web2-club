'use strict';

const Controller = require('egg').Controller;
const _ = require('lodash');

class SearchController extends Controller {
    async index() {
        const { ctx } = this;
        const keyword = ctx.request.body.keyword;
        const type = ctx.request.body.type || 'topic'; // 按文章搜还是按作者搜
        const sort_key = ctx.request.body.sort_key || '_id';
        const sort_val = ctx.request.body.sort_val || -1;
        const sort = {};
        sort[sort_key] = parseInt(sort_val);
        const reg = new RegExp(keyword, 'i'); //不区分大小写
        const search_content = await ctx.service.search.search(type, reg, sort);
        if (type === 'user') {
            ctx.helper.success({
                ctx,
                data: search_content.map((user) => {
                    return _.pick(user, [
                        'good_at_technology',
                        'history_login_ip',
                        'score',
                        'is_star',
                        'topic_count',
                        'reply_count',
                        'follower_count',
                        'following_count',
                        'collect_topic_count',
                        'topics',
                        'create_at',
                        'update_at',
                        'name',
                        'nickname',
                        'email',
                        'avatar',
                    ]);
                }),
            });
        } else {
            ctx.helper.success({
                ctx,
                data: search_content,
            });
        }
    }
}
module.exports = SearchController;

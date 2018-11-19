'use strict';

const Controller = require('egg').Controller;
const _ = require('lodash');

class UserController extends Controller {
    async topics(ctx) {
        const tabname = ctx.query.tab || 'all';
        console.log('进入all', tabname);
        const query = {};
        if (!tabname || tabname === 'all') {
            query.tab = { $nin: ['dev'] }; // 查询出键值不为dev的
        } else {
            if (tabname === 'good') {
                query.good = true;
            } else {
                query.tab.name = tabname;
            }
        }
        let topics_data = await ctx.service.topic.getTopicsByQuery(query, {
            sort: '-top -last_reply_at',
            ...ctx.pagination,
        });

        let new_topics_data = topics_data.map((item, index) => {
            const {
                tab,
                title,
                author,
                author_id,
                top,
                good,
                reply_count,
                visit_count,
                collect_count,
                create_at,
                update_at,
                last_reply,
                last_reply_at,
                ups,
                _id,
            } = item;
            const { name, nickname, score, level } = author;
            return {
                id: _id,
                tab,
                title,
                author_id,
                top,
                good,
                reply_count,
                visit_count,
                collect_count,
                create_at,
                update_at,
                last_reply,
                last_reply_at,
                ups,
                author: {
                    name,
                    nickname,
                    score,
                    level,
                },
            };
        });
        ctx.helper.success({
            ctx,
            data: new_topics_data,
        });
    }
    async topic_id(ctx) {
        console.log('进入topic_id');
        ctx.validate(
            {
                tid: {
                    type: 'string',
                    max: 24,
                    min: 24,
                },
            },
            ctx.params
        );
        const topic_id = String(ctx.params.tid);
        const user_id = ctx.state.user.data._id; //jwt验证通过，可以获取到之前加密的data,如获取到该token对应的user
        const user = await ctx.service.user.getUserById(user_id);
        let [topic, author, replies] = await ctx.service.topic.getFullTopic(topic_id);

        if (!topic) {
            ctx.helper.error({
                ctx,
                rspinf: '此话题不存在或已被删除',
            });
            return;
        }
        // 增加 visit_count
        const ip = ctx.ip.replace(/\./gi, '_'); //10_0_0
        const isTheSameIp = await ctx.service.cache.getCache(`TIME_${ip}`); // 放置浏览次数被f5刷
        if (!isTheSameIp) {
            // 如果时间到了，就算作新view
            topic.visit_count += 1;
            await ctx.service.topic.incrementVisitCount(topic_id);
            ctx.service.cache.setCache(`TIME_${ip}`, { ip }, 10); // 将ip存入缓存5秒
        }

        topic = _.pick(topic, [
            'id',
            'author_id',
            'tab',
            'content',
            'title',
            'last_reply_at',
            'good',
            'top',
            'ups',
            'reply_count',
            'collect_count',
            'visit_count',
            'create_at',
            'author',
        ]);
        topic.author = _.pick(author, ['name', 'nickname', 'followers', 'avatar', 'level', 'is_star']);
        topic.replies = replies.map((reply) => {
            reply.author = _.pick(reply.author, ['name', 'nickname', 'avatar', 'level', 'is_star']);
            reply.id = reply._id;
            reply = _.pick(reply, ['id', 'author', 'content', 'ups', 'create_at', 'reply_id']);
            reply.reply_id = reply.reply_id || null;

            reply.is_uped = !!(reply.ups && user && reply.ups.indexOf(user.id) !== -1);

            return reply;
        });
        topic.is_collect = user ? !!(await ctx.service.collect.getTopicCollect(user.id, topic_id)) : false;
        ctx.helper.success({
            ctx,
            data: topic,
        });
    }
    async create(ctx) {
        // TODO: 此处可以优化，将所有使用 egg_validate 的 rules 集中管理，避免即时新建对象
        ctx.validate({
            title: {
                type: 'string',
                max: 100,
                min: 5,
            },
            tab: { type: 'object' },
            content: { type: 'string' },
        });
        const body = ctx.request.body;

        const user_id = ctx.state.user.data._id; //jwt验证通过，可以获取到之前加密的data,如获取到该token对应的user
        // 储存新主题帖
        const topic = await ctx.service.topic.newAndSave(body.title, body.content, body.tab, user_id);

        // 将对应的topic关联到other表的tabs对应的tab下
        await ctx.service.topic.updateTabs(topic.id, body.tab);

        // 发帖用户增加积分,增加发表主题数量
        const result = await ctx.service.user.incrementScoreAndTopicCount(topic.author_id, 20, 1);
        console.log('result', result);
        // 通知被@的用户
        await ctx.service.at.sendMessageToMentionUsers(body.content, topic.id, user_id);

        ctx.helper.success({
            ctx,
            data: {
                topic_id: topic._id,
            },
        });
    }
    // 更新主题
    async update() {
        const { ctx, config } = this;
        const { service } = ctx;
        const topic_id = ctx.params.tid;
        let { title, tab, content } = ctx.request.body;
        const { topic } = await service.topic.getTopicAndAuthorById(topic_id);
        if (!topic) {
            ctx.helper.error({
                ctx,
                rspinf: '此话题不存在或已被删除。',
                status: 404,
            });
            return;
        }
        if (topic.author_id.toSrting() === ctx.user._id.toSrting()) {
            title = title.trim();
            tab = tab.trim();
            content = content.trim();
            // 验证
            let rspinf;
            if (title === '') {
                rspinf = '标题不能是空的。';
            } else if (title.length < 5 || title.length > 100) {
                rspinf = '标题字数太多或太少。';
            } else if (!tab) {
                rspinf = '必须选择一个版块。';
            } else if (content === '') {
                rspinf = '内容不可为空。';
            }

            if (rspinf) {
                ctx.helper.error({
                    ctx,
                    rspinf,
                });
                return;
            }
            // 保存更改
            topic.title = title;
            topic.content = content;
            topic.tab = tab;
            topic.update_at = new Date().getTime;
            await topic.save();
            // 如果@用户的话
            await service.at.sendMessageToMentionUsers(content, topic._id, ctx.state.user.data._id);
        } else {
            ctx.helper.error({
                ctx,
                rspinf: '非该主题用户，无法编辑。',
            });
            return;
        }
    }
    // 删除主题
    async delete() {
        // 删除话题, 话题作者topic_count减1
        // 删除回复，回复作者reply_count减1
        // 删除ect，用户collect_topic_count减1
        const { ctx } = this;
        const { service } = ctx;
        const topic_id = ctx.params.tid;

        const [topic, author] = await service.topic.getFullTopic(topic_id);
        if (!topic) {
            ctx.helper.error({
                ctx,
                rspinf: '此话题不存在或已被删除。',
            });
            return;
        }
        if (!ctx.user.is_admin && !topic.author_id.equals(ctx.user._id)) {
            ctx.helper.error({
                ctx,
                rspinf: '您没有删除此话题的权限！',
            });
            return;
        }
        author.score -= 5;
        author.topic_count -= 1;
        await author.save();
        // 下面原方法是用
        // topic.deleted = true; // 不知道这么做原因是啥
        await ctx.service.topic.deleteTopicById(topic_id); // 删除文章
        ctx.helper.success({
            ctx,
            rspinf: '此话题已被删除',
        });
    }
    // 加精
    async good() {
        // 需要管理员权限
        const { ctx } = this;
        const { service } = ctx;
        const topic_id = ctx.params.tid;
        // const referer = ctx.get('referer');
        const topic = await service.topic.getTopicById(topic_id);
        if (!topic) {
            ctx.helper.error({
                ctx,
                rspinf: '此话题不存在或已被删除。',
            });
            return;
        }
        topic.good = !topic.good;
        await topic.save();
        const msg = topic.good ? '加精成功！' : '取消加精!';
        ctx.helper.success({
            ctx,
            rspinf: msg,
        });
    }
    // 收藏主题
    async add_collect() {
        const { ctx, service } = this;
        const { topic_id } = ctx.request.body;
        const user_id = ctx.state.user.data._id;

        const topic = await service.topic.getTopicById(topic_id);

        if (!topic) {
            ctx.helper.error({
                ctx,
                rspinf: '收藏失败，请联系管理员',
            });
            return;
        }
        const doc = await service.collect.getTopicCollect(user_id, topic._id);

        if (doc) {
            ctx.helper.error({
                ctx,
                data: {
                    type: 'ok',
                    rspinf: '您已经收藏过该主题',
                },
            });
            return;
        }
        await service.collect.newAndSave(user_id, topic._id);
        await Promise.all([
            // 插入收藏数+1
            service.user.incrementCollectTopicCount(user_id),
            // 插入收藏数+1
            service.topic.incrementCollectCount(topic_id),
        ]);
        ctx.helper.success({
            ctx,
            data: {
                type: 'ok',
                rspinf: '收藏成功',
            },
        });
    }
    // 取消收藏
    async remove_collect() {
        const { ctx, service } = this;
        const topic_id = ctx.request.body.topic_id;
        const user_id = ctx.state.user.data._id;
        const topic = await service.topic.getTopicById(topic_id);
        console.log('topic_id', topic_id);
        console.log('topic', topic);
        if (!topic) {
            ctx.helper.error({
                ctx,
                rspinf: '取消失败',
            });
            return;
        }
        const removeResult = await ctx.service.collect.remove(user_id, topic._id);
        console.log(removeResult);
        if (removeResult.n === 0) {
            ctx.helper.error({
                ctx,
                data: {
                    type: 'error',
                    rspinf: '您已经取消收藏,无法再次取消',
                },
            });
            return;
        }

        // const user = await service.user.getUserById(user_id);
        await Promise.all([
            // 插入收藏数+1
            service.user.decrementCollectTopicCount(user_id),
            // 插入收藏数+1
            service.topic.decrementCollectCount(topic_id),
        ]);
        ctx.helper.success({
            ctx,
            data: {
                type: 'ok',
                rspinf: '取消收藏成功',
            },
        });
    }
    // 点赞
    async up() {
        const { ctx, service } = this;
        const topic_id = ctx.params.tid;
        const user_id = ctx.state.user.data._id;
        const topic = await service.topic.getTopicById(topic_id);
        let type = true;
        if (!topic) {
            ctx.helper.success({
                ctx,
                data: {
                    type: 2,
                    rspinf: '点赞失败。没有发现该文章，请联系管理员',
                },
            });
            return;
        }
        if (
            topic.ups.some((up) => {
                return up.id == user_id; // 这里的_id 是objectId类型，所以不能用===
            })
        ) {
            // 如果点过赞,就去除点赞
            topic.ups = topic.ups.filter((up) => up.id != user_id);
            console.log('userfffff', topic.ups.filter((up) => up.id != user_id));
            console.log('user', topic.ups);
            type = false;
        } else {
            let user = await ctx.service.user.getUserById(user_id);
            user.id = user._id;
            user = _.pick(user, ['nickname', 'id', 'avatar']);
            console.log('user', user);
            topic.ups.push(user);
        }
        await topic.save();
        const rspinf = type ? '点赞成功' : '取消点赞!';
        ctx.helper.success({
            ctx,
            data: {
                type: type ? 0 : 1,
                rspinf,
            },
        });
    }
    // 所有的tabs
    async all_tabs() {
        const { ctx } = this;
        try {
            const tabs = await ctx.service.other.findAllTabs();
            ctx.helper.success({
                ctx,
                data: tabs,
            });
        } catch (error) {
            ctx.helper.error({
                ctx,
                rspinf: error,
            });
        }
    }
    // 查找tabs
    async find_tab() {
        const { ctx } = this;
        const tab = ctx.request.body.tab;
        try {
            const tabs = await ctx.service.other.findTabByName(tab);
            if (tabs) {
                ctx.helper.success({
                    ctx,
                    data: {
                        type: 1,
                        message: '已存在该分类',
                    },
                });
                return;
            }
            ctx.helper.success({
                ctx,
                data: {
                    type: 0,
                    message: '未存在该分类',
                },
            });
        } catch (error) {
            ctx.helper.error({
                ctx,
                rspinf: error,
            });
        }
    }
    async find_tab_topic() {
        const { ctx } = this;
        const tabId = String(ctx.params.tdId);
        let tab = await ctx.service.other.findTopicByTabId(tabId);
        if (tab && tab[0] && tab[0].tabs.length > 0) {
            const topics = tab[0].tabs[0].topic_ids;
            console.log('topics', topics);
            const all = await Promise.all(
                topics.map(async (topicId) => {
                    let topic = await ctx.service.topic.getTopicById(topicId);
                    topic.author = _.omit(topic.toObject().author, ['password', 'history_login_ip']); // toObject将mongoose对象转化为普通对象,
                    console.log('topic---------------', topic);
                    return topic;
                })
            );
            ctx.helper.success({
                ctx,
                data: {
                    type: 0,
                    topics: all,
                    rspinf: '查找成功',
                },
            });
        } else {
            ctx.helper.success({
                ctx,
                data: {
                    topics: [],
                    type: 2,
                    rspinf: '无数据',
                },
            });
        }
    }
    async user_topics() {
        const { ctx, service } = this;
        const user_id = ctx.state.user.data._id; //jwt验证通过，可以获取到之前加密的data,如获取到该token对应的user
        const topics = await service.topic.getTopicsById(user_id);
        ctx.helper.success({
            ctx,
            data: topics,
        });
    }
}

module.exports = UserController;

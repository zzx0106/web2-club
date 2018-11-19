'use strict';

const Controller = require('egg').Controller;
const validator = require('validator');
const uuid = require('uuid');
const _ = require('lodash');

class UserController extends Controller {
    async register() {
        const { ctx, service, config } = this;
        const med = validator.trim(ctx.request.body.med || '');
        if (!med) {
            ctx.helper.error({
                ctx,
                rspinf: '注册失败',
            });
            return;
        }
        console.log('ctx.ip', ctx.ip);
        const ip = ctx.ip.replace(/\./gi, '_'); //10_0_0
        const key = await service.cache.getCache(`KEY_${ip}`);
        if (!key) {
            ctx.helper.error({
                ctx,
                rspinf: '获取秘钥失败',
            });
            return;
        }
        const data = ctx.helper.decryptionDatagram(med, 'aes-256-cbc', key.rdnum);
        console.log('data', data);
        const name = validator.trim(data.name || '').toLowerCase();
        const nickname = validator.trim(data.nickname || '').toLowerCase();
        const password = validator.trim(data.password || '');
        const rePassword = validator.trim(data.re_password || '');
        const email = validator.trim(data.email || '');
        let rspinf;
        console.log('[name, nickname, password, rePassword, email]', [name, nickname, password, rePassword, email]);
        if ([name, nickname, password, rePassword, email].some((item) => item === '')) {
            rspinf = '输入不能为空！';
        } else if (name.length > 10) {
            rspinf = '用户名不能超过10长度';
        } else if (!ctx.helper.validateId(name)) {
            rspinf = '用户名不合法';
        } else if (!validator.isEmail(email)) {
            rspinf = '邮箱不合法';
        } else if (password !== rePassword) {
            rspinf = '两次输入不一致';
        }
        if (rspinf) {
            ctx.helper.error({
                ctx,
                rspinf,
            });
            return;
        }
        // $or是一个逻辑or操作符操作在一个数据或者多个表达式并且需要选择至少一个满足条件的表达式，$or有至少以下表达式：
        const user = await service.user.getUsersByQuery(
            {
                $or: [{ name }, { email }],
            },
            {}
        );
        if (user.length > 0) {
            ctx.helper.error({
                ctx,
                rspinf: '用户名或邮箱已被注册',
            });
            return;
        }
        const passwordHash = ctx.helper.bhash(password);
        const avatarUrl = service.user.makeGravatar(email);
        await service.user.newAndSave(name, nickname, passwordHash, email, avatarUrl);
        ctx.helper.success({
            ctx,
            rspinf: '注册成功',
        });
    }
    async login() {
        const { ctx, service, config } = this;
        const med = validator.trim(ctx.request.body.med || '');
        if (!med) {
            ctx.helper.error({
                ctx,
                rspinf: '登录失败',
            });
            return;
        }
        const ip = ctx.ip.replace(/\./gi, '_'); //10_0_0
        console.log('login Ip', ip);
        const key = await service.cache.getCache(`KEY_${ip}`);
        if (!key) {
            ctx.helper.error({
                ctx,
                rspinf: '获取秘钥失败',
            });
            return;
        }
        const data = ctx.helper.decryptionDatagram(med, 'aes-256-cbc', key.rdnum);
        const name = validator.trim(data.name || '');
        const password = validator.trim(data.password || '');
        let rspinf;
        if ([name, password].some((item) => item === '')) {
            rspinf = '输入不能为空！';
        }
        if (rspinf) {
            ctx.helper.error({
                ctx,
                rspinf,
            });
            return;
        }
        let user = await service.user.getUsers({ name });
        if (!user) {
            ctx.helper.error({
                ctx,
                rspinf: '您还未注册账号！',
            });
            return;
        }
        const passwordHash = ctx.helper.bcompare(password, user.password);
        if (passwordHash) {
            //登录成功
            const token = await service.token.getToken(user._id);
            // token可以通过直传的方式，但不安全，所以使用httponly的方式将token放入cookie，预防xss攻击和crsf
            ctx.cookies.set('ck_token', token, {
                path: '/',
                // domain: 'http://localhost:3000',
                signed: true,
                overwrite: true, // 覆盖
                httpOnly: true,
                encrypt: true,
                maxAge: 24 * 3600 * 1000 * 7, // 保存7天
                // signed: false, //设置是否对 Cookie 进行签名，如果设置为 true，则设置键值对的时候会同时对这个键值对的值进行签名，后面取的时候做校验，可以防止前端对这个值进行篡改。默认为 true。
            });
            ctx.helper.success({
                ctx,
                data: {
                    id: user._id,
                    token, // 前端开启服务端代理就只能这么传
                    ..._.omit(
                        user.toObject(),
                        'password' // 筛选user 排除掉password
                    ),
                },
            });
            ctx.helper.saveIP(user, ctx.ip);
        } else {
            ctx.helper.error({
                ctx,
                rspinf: '账号或密码错误哦',
            });
            return;
        }
    }
    async loginByEmail() {
        const { ctx, service, config } = this;

        const med = validator.trim(ctx.request.body.med || '');
        if (!med) {
            ctx.helper.error({
                ctx,
                rspinf: '登录失败',
            });
            return;
        }
        const ip = ctx.ip.replace(/\./gi, '_'); //10_0_0
        console.log('med', med);
        const key = await service.cache.getCache(`KEY_${ip}`);
        console.log('key', key);
        if (!key) {
            ctx.helper.error({
                ctx,
                rspinf: '获取秘钥失败',
            });
            return;
        }
        const data = ctx.helper.decryptionDatagram(med, 'aes-256-cbc', key.rdnum);
        console.log('data', data);
        const email = validator.trim(data.email || '');
        const password = validator.trim(data.password || '');
        let rspinf;
        if ([email, password].some((item) => item === '')) {
            rspinf = '输入不能为空！';
        }
        if (!validator.isEmail(email)) {
            rspinf = '邮箱不合法';
        }
        if (rspinf) {
            ctx.helper.error({
                ctx,
                rspinf,
            });
            return;
        }
        let user = await service.user.getUserByEmail({ email });
        if (!user) {
            ctx.helper.error({
                ctx,
                rspinf: '您还未注册账号！',
            });
            return;
        }
        const passwordHash = ctx.helper.bcompare(password, user.password);
        if (passwordHash) {
            //登录成功
            const token = await service.token.getToken(user._id);
            // token可以通过直传的方式，但不安全，所以使用httponly的方式将token放入cookie，预防xss攻击和crsf
            ctx.cookies.set('ck_token', token, {
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7,
                //encrypt: true, //设置是否对 Cookie 进行加密，如果设置为 true，则在发送 Cookie 前会对这个键值对的值进行加密，客户端无法读取到 Cookie 的明文值。默认为 false。
                // signed: false, //设置是否对 Cookie 进行签名，如果设置为 true，则设置键值对的时候会同时对这个键值对的值进行签名，后面取的时候做校验，可以防止前端对这个值进行篡改。默认为 true。
            });
            ctx.helper.success({
                ctx,
                data: {
                    id: user._id,
                    // token,
                    ..._.pick(user, [
                        // 筛选user
                        'history_login_ip',
                        'score',
                        'is_star',
                        'topic_count',
                        'reply_count',
                        'follower_count',
                        'collect_topic_count',
                        'create_at',
                        'update_at',
                        'name',
                        'nickname',
                        'email',
                        'avatar',
                    ]),
                },
            });
            ctx.helper.saveIP(user, ctx.ip);
        } else {
            ctx.helper.error({
                ctx,
                rspinf: '账号或密码错误哦',
            });
            return;
        }
    }
    // 退出功能暂时无用
    async logout() {
        const { ctx, service } = this;
        await service.user.logout();
        ctx.helper.success({
            ctx,
            rspinf: '登出成功,欢迎下次再来',
        });
    }
    // 找回密码
    async findPassword() {
        const { ctx, service } = this;
        const email = validator.trim(ctx.request.body.email).toLowerCase();
        if (!validator.isEmail(email)) {
            ctx.helper.error({
                ctx,
                rspinf: '邮箱不合法',
            });
            return;
        }
        // 动态生成retrieve_key和timestamp到users collection,之后重置密码进行验证
        const retrieveKey = uuid.v4();
        const retrieveTime = Date.now();

        const user = await service.user.getUserByEmail(email);
        if (!user) {
            ctx.helper.error({
                ctx,
                rspinf: '没有这个电子邮箱。',
            });
            return;
        }
        // 重置时间和key
        user.retrieve_key = retrieveKey;
        user.retrieve_time = retrieveTime;
        await user.save();
        ctx.helper.success({
            ctx,
            rspinf: '我们已将重置信息发送至您的邮箱，请在24小时内重置密码',
        });
    }
    // 分享出去的重置密码页接口(此页面逻辑通后调取updatePass接口修改密码)
    // 重置密码验证
    async resetPass() {
        const { ctx, service } = this;
        const key = validator.trim(ctx.query.key || '');
        const name = validator.trim(ctx.query.name || '');

        const user = await service.user.getUserByNameAndKey(name, key);
        if (!user) {
            ctx.helper.error({
                ctx,
                rspinf: '信息有误，密码无法重置。',
            });
            return;
        }
        const now = Date.now();
        const oneDay = 1000 * 60 * 60 * 24;
        if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
            ctx.helper.error({
                ctx,
                rspinf: '该链接已过期，请重新申请。',
            });
            return;
        }
    }
    // 真正重置密码页接口
    async updatePassword() {
        const { ctx, service } = this;
        const password = validator.trim(ctx.request.body.password) || '';
        const rePassword = validator.trim(ctx.request.body.re_password) || '';
        const key = validator.trim(ctx.request.body.key) || '';
        const name = validator.trim(ctx.request.body.name) || '';
        if (password !== rePassword) {
            ctx.helper.error({
                ctx,
                rspinf: '两次密码输入不一致。',
            });
            return;
        }
        const user = await service.user.getUserByNameAndKey(name, key);
        if (!user) {
            ctx.helper.error({
                ctx,
                rspinf: '信息有误，密码无法重置。',
            });
            return;
        }
        const passhash = ctx.helper.bhash(password);
        user.password = password;
        user.retrieve_key = null;
        user.retrieve_time = null;
        await user.save();
        ctx.helper.success({
            ctx,
            rspinf: '你的密码已重置成功!',
        });
    }
    // 获取用户所有收藏主题
    async getCollects() {
        const { ctx, service } = this;
        const name = ctx.params.name;
        const user = await service.user.getUserByName(name);
        if (!user) {
            ctx.helper.error({
                ctx,
                rspinf: '用户不存在',
            });
            return;
        }
        const opt = { skip: 0, limit: 100 };
        const collects = await service.collect.getCollectsByUserId(user._id, opt);
        const ids = collects.map((doc) => {
            return doc.topic_id.toString();
        });
        const query = { _id: { $in: ids } }; // 查询所有id
        let topics = await service.topic.getTopicsByQuery(query, {});
        console.log('topics', topics);
        topics = _.sortBy(topics, (topic) => {
            return ids.indexOf(topic._id.toString());
        });
        ctx.helper.success({
            ctx,
            data: topics,
        });
    }
    // 通过账号获取信息
    async getUserByEmail() {
        const { ctx, service } = this;
        const email = validator.trim(ctx.request.body.email).toLowerCase();
        const user = await service.user.getUserByEmail({ email });
        if (!user) {
            ctx.helper.success({
                ctx,
                rspinf: '暂未查到该用户',
            });
            return;
        }
        ctx.helper.success({
            ctx,
            data: _.pick(user, ['_id', 'name', 'nickname', 'email']),
        });
    }
    // 通过账号获取信息
    async getUserByName() {
        const { ctx, service } = this;
        const name = validator.trim(ctx.request.body.name);
        const user = await service.user.getUserByName(name);
        if (!user) {
            ctx.helper.success({
                ctx,
                rspinf: '暂未查到该用户',
            });
            return;
        }
        ctx.helper.success({
            ctx,
            data: _.omit(user.toObject(), ['password']), // toObject将mongoose对象转化为普通对象,
        });
    }
    // 获取动态秘钥
    getKey() {
        const { ctx, service } = this;
        const rdnum = ctx.helper.getRandom(16);
        const ip = ctx.ip.replace(/\./gi, '_'); //10_0_0
        try {
            service.cache.setCache(`KEY_${ip}`, { rdnum }, 5); // 将ip存入缓存5秒
            ctx.helper.success({
                ctx,
                data: {
                    key: rdnum,
                },
            });
        } catch (error) {
            console.log(error);
            ctx.helper.error({
                ctx,
                rspinf: error,
            });
        }
    }
    async addFollowers() {
        const { ctx, service } = this;
        const user_id = ctx.state.user.data._id; //jwt验证通过，可以获取到之前加密的data,如获取到该token对应的user
        const author_id = validator.trim(ctx.request.body.author_id) || '';
        if (!author_id) {
            ctx.helper.error({
                ctx,
                rspinf: 'author_id 不能为空!',
            });
        }
        const [user, author] = await Promise.all([
            service.user.getUserById(user_id),
            service.user.getUserById(author_id),
        ]);
        if (!author) {
            ctx.helper.success({
                ctx,
                data: {
                    type: 2,
                    rspinf: '作者不存在',
                },
            });
        }
        if (
            !author.followers.some((item) => {
                return item._id == user_id;
            }) &&
            !user.following.some((item) => {
                return item._id == user_id;
            })
        ) {
            author.followers.push({
                name: user.name,
                nickname: user.nickname,
                avatar: user.avatar,
                _id: user._id,
                good_at_technology: user.good_at_technology,
            });
            user.following.push({
                name: author.name,
                nickname: author.nickname,
                avatar: author.avatar,
                _id: author._id,
                good_at_technology: author.good_at_technology,
            });
            author.save();
            user.save();
            ctx.helper.success({
                ctx,
                data: {
                    type: 0,
                    rspinf: '关注成功',
                },
            });
        } else {
            ctx.helper.success({
                ctx,
                data: {
                    type: 2,
                    rspinf: '该用户已在您的关注列表',
                },
            });
        }
    }
    async deleteFollowers() {
        const { ctx, service } = this;
        const user_id = ctx.state.user.data._id; //jwt验证通过，可以获取到之前加密的data,如获取到该token对应的user
        const author_id = validator.trim(ctx.request.body.author_id) || '';
        if (!author_id) {
            ctx.helper.error({
                ctx,
                rspinf: 'author_id 不能为空!',
            });
        }
        const [user, author] = await Promise.all([
            service.user.getUserById(user_id),
            service.user.getUserById(author_id),
        ]);
        if (!author) {
            ctx.helper.success({
                ctx,
                data: {
                    type: 2,
                    rspinf: '作者不存在',
                },
            });
        }
        //删除
        try {
            const [user_d, author_d] = await Promise.all([
                service.user.deleteFollowers(user.name, author.name),
                service.user.deleteFollowing(user.name, author.name),
            ]);
            console.log(user_d, author_d);
            ctx.helper.success({
                ctx,
                data: {
                    type: 0,
                    rspinf: '取消关注',
                },
            });
        } catch (error) {
            console.log(error);
            ctx.helper.success({
                ctx,
                data: {
                    type: 0,
                    rspinf: '取消关注失败',
                },
            });
        }
        // let author_index = author.followers.findIndex((item) => item._id === user_id);
        // let user_index = user.followers.findIndex((item) => item._id === user_id);
        // author.toObject().followers.splice(author_index, author_index > 0 ? 1 : 0);
        // user.followers.splice(user_index, user_index > 0 ? 1 : 0);
        // author.toObject().followers = author.toObject().followers.filter((item) => item._id === user_id);
        // user.toObject();
        // author.save();
        // user.save();
        // console.log('user.followers', user.followers);
    }
    //粉丝
    async getFollowers() {
        const { ctx, service } = this;
        const user_id = ctx.state.user.data._id; //jwt验证通过，可以获取到之前加密的data,如获取到该token对应的user
        const followers = await ctx.service.user.getFollowersById(user_id);
        ctx.helper.success({
            ctx,
            data: followers,
        });
    }
    // 关注的人
    async getFollowing() {
        const { ctx, service } = this;
        const user_id = ctx.state.user.data._id; //jwt验证通过，可以获取到之前加密的data,如获取到该token对应的user
        const following = await ctx.service.user.getFollowingById(user_id);
        ctx.helper.success({
            ctx,
            data: following,
        });
    }
    // 更新个人信息
    async updatePersonInfo() {
        console.log('进入');
        const { ctx, service } = this;
        const user_id = ctx.state.user.data._id; //jwt验证通过，可以获取到之前加密的data,如获取到该token对应的user
        console.log('xxxxx', user_id);
        const info_type = validator.trim(ctx.request.body.info_type) || '';
        const info_data = validator.trim(ctx.request.body.info_data) || '';
        const user = await service.user.getUserById(user_id);
        console.log('1231231', info_type, info_data);
        if (!user) {
            ctx.helper.error({
                ctx,
                rspinf: 'user can not find!',
            });
            return;
        }

        if (!info_type || !info_data) {
            ctx.helper.error({
                ctx,
                rspinf: 'params error!',
            });
            return;
        }
        if (Object.keys(user.toObject()).indexOf(info_type) < 0) {
            ctx.helper.success({
                ctx,
                data: {
                    type: 3,
                    rspinf: '没有找到这个类型',
                },
            });
            return;
        }
        const update_result = await service.user.updateUserInfo(user.name, info_type, info_data);
        if (update_result.n > 0 && update_result.nModified > 0 && update_result.ok > 0) {
            ctx.helper.success({
                ctx,
                data: {
                    type: 0,
                    rspinf: '更新成功',
                },
            });
        } else {
            ctx.helper.success({
                ctx,
                data: {
                    type: 3,
                    rspinf: '更新失败',
                },
            });
        }
    }
}

module.exports = UserController;

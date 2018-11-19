'use strict';

const utility = require('utility');

module.exports = (app) => {
    const mongoose = app.mongoose;
    const Schema = mongoose.Schema;
    const ObjectId = Schema.ObjectId;

    const UserSchema = new Schema({
        name: { type: String }, //账号
        nickname: { type: String }, //昵称
        password: { type: String }, //密码

        profile_image_url: { type: String, default: '' }, //用户头像
        email: { type: String, default: '' },
        signature: { type: String, default: '' }, //标识
        avatar: { type: String, default: '' },
        github: { type: String, default: '' },
        personal_web: { type: String, default: '' }, //个人网站
        simple_message: { type: String, default: '帅哥无需多言' }, //简单概述自己
        good_at_technology: { type: Array, default: [] }, //擅长技术
        job: { type: String, default: '' }, //职位
        job_address: { type: String, default: '' }, //工作地址
        history_login_ip: { type: Array, default: [] }, //历史登录的ip

        score: { type: Number, default: 0 }, // 积分
        level: { type: Number, default: 1 }, // 等级
        is_star: { type: Boolean, default: false }, //是否为高级用户
        topic_count: { type: Number, default: 0 }, //主题数量
        reply_count: { type: Number, default: 0 }, //回复数量
        collect_topic_count: { type: Number, default: 0 }, //收藏主题数量
        create_at: { type: Date, default: Date.now },
        update_at: { type: Date, default: Date.now },
        following: { type: Array, default: [] }, // 关注的人
        followers: { type: Array, default: [] }, // 粉丝
        retrieve_time: { type: Number }, // 重置密码的时间（计算重置密码页面过期时间（
        retrieve_key: { type: String }, // 忘记密码找回key

        topics: [{ type: ObjectId, ref: 'Topic' }], // 关联Topic表
    });
    UserSchema.index({ name: 1 }, { unique: true });
    UserSchema.index({ email: 1 }, { unique: true });
    UserSchema.index({ score: -1 });

    UserSchema.virtual('avatar_url').get(function() {
        let url = this.avatar || `https://gravatar.com/avatar/${utility.md5(this.email.toLowerCase())}?size=48`;
        url = url.replace('www.gravatar.com', 'gravatar.com');
        // 让协议自适应 protocol，使用 `//` 开头
        if (url.indexOf('http:') === 0) {
            url = url.slice(5);
        }
        return url;
    });
    UserSchema.virtual('isAdvanced').get(function() {
        // 积分高于 700 则认为是高级用户
        return this.score > 700 || this.is_star;
    });
    UserSchema.pre('save', function(next) {
        const now = new Date().getTime();
        this.update_at = now;
        next();
    });
    return mongoose.model('User', UserSchema);
};

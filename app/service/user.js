'use strict';

const utility = require('utility');
const uuid = require('uuid');
const Service = require('egg').Service;

class UserService extends Service {
    /**
     * 根据关键字，获取一组用户
     * @param {String} query 关键字
     * @param {Object} opt 选项
     */
    getUsersByQuery(query, opt) {
        return this.ctx.model.User.find(query, '', opt).exec();
    }
    getUsers(query) {
        return this.ctx.model.User.findOne(query).exec();
    }

    /**
     * 创建用户
     * @param {String} name
     * @param {String} nickname
     * @param {String} pass
     * @param {String} email
     * @param {String} avatar_url
     */
    newAndSave(name, nickname, password, email, avatar_url) {
        const user = new this.ctx.model.User();
        user.name = name;
        user.nickname = nickname;
        user.password = password;
        user.email = email;
        user.avatar = avatar_url;
        return user.save();
    }
    /**
     *根据邮箱查找用户
     * @param {string} email
     */
    getUserByEmail(email) {
        console.log('email', email);
        return this.ctx.model.User.findOne(email).exec();
    }

    /**
     * 根据查询条件，获取一个用户
     * @param {String} name 用户名
     * @param {String} key 激活码
     */
    getUserByNameAndKey(loginname, key) {
        const query = { loginname, retrieve_key: key };
        return this.ctx.model.User.findOne(query).exec();
    }
    /**
     * 根据用户ID，查找用户
     * @param {String} id 用户ID
     * @return {Promise[user]} 承载用户的 Promise 对象
     */
    getUserById(id) {
        if (!id) {
            return null;
        }
        return this.ctx.model.User.findOne({ _id: id }, { password: 0 }).exec();
    }
    /**
     * 根据用户名列表查找用户列表
     * @param {Array} names 用户名列表
     * @return {Promise[users]} 承载用户列表的 Promise 对象
     */
    getUsersByNames(names) {
        if (names.length === 0) {
            return [];
        }

        const query = { names: { $in: names } };
        return this.ctx.model.User.find(query).exec();
    }
    /**
     * 发帖用户增加积分,增加发表主题数量
     * @param {String} id 用户id
     * @param {Number} score 增加的积分
     * @param {Number} replyCount 创建文章的数量
     */
    incrementScoreAndTopicCount(id, score) {
        const query = { _id: id };
        // inc 运算 整数 + 负数-
        const update = { $inc: { score, topic_count: 1 } };
        return this.ctx.model.User.findByIdAndUpdate(query, update).exec();
    }
    /**
     * 增加用户的收藏主题数
     * @param {String} id 用户id
     */
    incrementCollectTopicCount(id) {
        const query = { _id: id };
        const update = { $inc: { collect_topic_count: 1 } };
        return this.ctx.model.User.findByIdAndUpdate(query, update).exec();
    }
    /**
     * 减少用户的收藏主题数
     * @param {String} id 用户id
     */
    decrementCollectTopicCount(id) {
        const query = { _id: id };
        const update = { $inc: { collect_topic_count: -1 } };
        return this.ctx.model.User.findByIdAndUpdate(query, update).exec();
    }

    /**
     * 增加回复数和积分
     * @param {String} id 账号
     * @param {Number} score 分数
     */
    incrementScoreAndReplyCount(id, score) {
        const query = { _id: id };
        const update = { $inc: { score, reply_count: 1 } };
        return this.ctx.model.User.findByIdAndUpdate(query, update).exec();
    }
    /**
     * 删除回复数和积分
     * @param {String} id 账号
     * @param {Number} score 分数
     */
    decrementScoreAndReplyCount(id, score) {
        const query = { _id: id };
        const update = { $inc: { score, reply_count: -1 } };
        return this.ctx.model.User.findByIdAndUpdate(query, update).exec();
    }
    /**
     * 根据账号查找用户
     * @param {String} name 账号
     */
    getUserByName(name) {
        const query = { name: new RegExp(`^${name}$`, 'i') };
        return this.ctx.model.User.findOne(query).exec();
    }
    /**
     * 根据id查找用户关注列表
     * @param {String} name 账号
     */
    getFollowingById(user_id) {
        return this.ctx.model.User.findOne({ _id: user_id }, { following: 1 }).exec();
    }
    /**
     * 根据id查找用户粉丝
     * @param {String} name 账号
     */
    getFollowersById(user_id) {
        console.log('getFollowersById', user_id);
        return this.ctx.model.User.findOne({ _id: user_id }, { followers: 1 }).exec();
    }

    makeGravatar(email) {
        return 'http://www.gravatar.com/avatar/' + utility.md5(email.toLowerCase()) + '?size=48';
    }
    deleteFollowers(user_name, author_name) {
        // 此处疑问暂时无解，name可以但是id不行
        // return this.ctx.model.User.update({ _id: author_id }, { $pull: { followers: { _id: user_id } } }).exec();
        // pull是删除数组中的某个元素
        return this.ctx.model.User.update({ name: author_name }, { $pull: { followers: { name: user_name } } }).exec();
    }
    deleteFollowing(user_name, author_name) {
        return this.ctx.model.User.update({ name: user_name }, { $pull: { following: { name: author_name } } }).exec();
    }
    updateUserInfo(user_name, info_type, info_data) {
        let query = {};
        query[info_type] = info_data;
        return this.ctx.model.User.update({ name: user_name }, { $set: query }).exec();
    }
}

module.exports = UserService;

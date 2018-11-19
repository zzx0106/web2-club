'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
    const { router, controller, config, middleware } = app;
    // 用户注册限制
    const createUserLimit = middleware.createUserLimit(config.user_ip);
    // 分页设置
    const pagination = middleware.pagination();
    const isAdmin = middleware.isAdmin();
    // 用户=======================
    // 登录
    router.post('/user/login', controller.user.login);
    // 邮箱登录
    router.post('/user/login_by_email', controller.user.loginByEmail);
    // 注册
    router.post('/user/register', createUserLimit, controller.user.register);
    // 找回密码
    router.post('/user/find_password', app.jwt, controller.user.findPassword);
    // 重置密码验证
    router.post('/user/reset_pass', app.jwt, controller.user.resetPass);
    // 重置密码
    router.post('/user/update_pass', app.jwt, controller.user.updatePassword);
    // 获取用户收藏主题
    router.get('/user/:name/get_collects', app.jwt, controller.user.getCollects);
    // 根据email获取user
    router.post('/user/get_user_by_email', controller.user.getUserByEmail);
    // 根据name获取user
    router.post('/user/get_user_by_name', controller.user.getUserByName);
    // 关注用户
    router.post('/user/add_followers', app.jwt, controller.user.addFollowers);
    // 删除关注用户
    router.post('/user/delete_followers', app.jwt, controller.user.deleteFollowers);
    // 获取关注列表
    router.get('/user/get_following', app.jwt, controller.user.getFollowing);
    // 获取粉丝列表
    router.get('/user/get_followers', app.jwt, controller.user.getFollowers);
    // 根据name获取user
    router.get('/user/get_key', controller.user.getKey);
    // 更新用户信息
    router.post('/user/update_person_info', app.jwt, controller.user.updatePersonInfo);

    // 主题=======================
    // 获得分类
    router.get('/topic/all_tabs', app.jwt, controller.topic.all_tabs);
    // 根据分类查找
    router.post('/topic/find_tab', app.jwt, controller.topic.find_tab);
    // 全部主题
    router.get('/topic/topics', app.jwt, pagination, controller.topic.topics);
    // 创建主题
    router.post('/topic/topics', app.jwt, controller.topic.create);
    // 某个主题
    router.get('/topic/:tid/detail', app.jwt, controller.topic.topic_id);
    // 更新主题
    router.post('/topic/:tid/update', app.jwt, controller.topic.update);
    // 删除主题
    router.post('/topic/:tid/delete', app.jwt, controller.topic.delete);
    // 主题加精 -admin
    router.post('/topic/:tid/good', app.jwt, controller.topic.good);
    // 收藏
    router.post('/topic/add_collect', app.jwt, controller.topic.add_collect);
    // 取消收藏
    router.post('/topic/remove_collect', app.jwt, controller.topic.remove_collect);
    // 点赞
    router.get('/topic/:tid/up', app.jwt, controller.topic.up);
    // 分类
    router.get('/topic/classify/:tdId', app.jwt, controller.topic.find_tab_topic);
    // 根据账号获取个人
    router.get('/topic/user_topics', app.jwt, controller.topic.user_topics);

    // 主题=======================
    // 添加评论
    router.post('/reply/:tid/add', app.jwt, controller.reply.add);
    // 删除评论
    router.post('/reply/:rid/add', app.jwt, controller.reply.delete);
    // 评论点赞
    router.get('/reply/:rid/up', app.jwt, controller.reply.up);
    // 搜索
    router.post('/search', controller.search.index);
};

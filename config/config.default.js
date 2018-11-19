'use strict';

module.exports = (appInfo) => {
    const config = (exports = {});

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1532354783052_5648';

    // add your config here
    config.middleware = [];
    // passport
    config.passportGithub = {
        key: process.env.EGG_PASSPORT_GITHUB_CLIENT_ID || 'test',
        secret: process.env.EGG_PASSPORT_GITHUB_CLIENT_SECRET || 'test',
    };

    config.passportLocal = {
        usernameField: 'name',
        passwordField: 'pass',
    };
    config.mongoose = {
        url: process.env.EGG_MONGODB_URL || 'mongodb://127.0.0.1:27017/egg_cnode',
        options: {
            server: { poolSize: 20 },
            useNewUrlParser: true,
        },
    }; // database
    config.redis = {
        client: {
            host: process.env.EGG_REDIS_HOST || '127.0.0.1',
            port: process.env.EGG_REDIS_PORT || 6379,
            password: process.env.EGG_REDIS_PASSWORD || '',
            db: process.env.EGG_REDIS_DB || '0',
        },
    };
    // every user can create one account number
    config.user_ip = 1;

    // cors配置
    config.security = {
        csrf: {
            enable: false,
            credentials: true,
        },
        domainWhiteList: [
            'http://localhost:7001',
            'http://192.168.18.2:3001',
            'http://192.168.56.1:7001/',
            'http://127.0.0.1:8080',
            'http://127.0.0.1:3000',
            'http://localhost:3000',
        ],
    };
    config.cors = {
        credentials: true,
        allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    };

    //   jwt 配置文件
    config.jwt = {
        secret: 'Great4-M',
        enable: true, // default is false
        match: '/jwt', // optional
        getToken: (ctx) => {
            // 获取token的方式
            let _token =
                ctx.header.authorization ||
                ctx.query.token ||
                (ctx.request.body && ctx.request.body.token) ||
                ctx.cookies.get('ck_token', {
                    signed: true, // 加签 前端无法修改
                    encrypt: true, // 加密
                }) ||
                (ctx.header.cookie && ctx.header.cookie.substring(9)) || // 空9位是ck_token=的长度
                '';
            // log(ctx.request.body);
            return _token;
        },
    };
    return config;
};

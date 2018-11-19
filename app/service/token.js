'use strict';

const Service = require('egg').Service;

class TokenService extends Service {
    async getToken(_id) {
        const { ctx } = this;
        return ctx.app.jwt.sign(
            {
                data: {
                    _id: _id,
                },
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
            },
            ctx.app.config.jwt.secret
        );
    }
}

module.exports = TokenService;

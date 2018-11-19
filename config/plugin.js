'use strict';

// had enabled by egg
// exports.static = true;
exports.validate = {
    enable: true,
    package: 'egg-validate',
};
exports.bcrypt = {
    enable: true,
    package: 'egg-bcrypt',
};
exports.mongoose = {
    enable: true,
    package: 'egg-mongoose',
};
exports.jwt = {
    enable: true,
    package: 'egg-jwt',
};
exports.cors = {
    enable: true,
    package: 'egg-cors',
};
exports.redis = {
    enable: true,
    package: 'egg-redis',
};
exports.passport = {
    enable: true,
    package: 'egg-passport',
};
exports.passportGithub = {
    enable: true,
    package: 'egg-passport-github',
};
exports.passportLocal = {
    enable: true,
    package: 'egg-passport-local',
};
exports.routerPlus = {
    enable: true,
    package: 'egg-router-plus',
};

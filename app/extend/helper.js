const moment = require('moment');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// 格式化时间
exports.formatTime = (time) => moment(time).format('YYYY-MM-DD hh:mm:ss');

// 处理成功响应
exports.success = ({ ctx, data = null, rspinf = '', msg }) => {
    ctx.body = {
        msg: 'ok',
        [data ? 'data' : 'rspinf']: data || rspinf,
        restime: moment().format('YYYYMMDDHHmmss'),
    };
    ctx.status = 200;
};
// 处理失败响应

exports.error = ({ ctx, msg = 'err', rspinf = '', status = 233 }) => {
    ctx.body = {
        msg,
        rspinf,
        restime: moment().format('YYYYMMDDHHmmss'),
    };
    ctx.status = 200;
};

// 用户名参矫正
exports.validateId = (str) => /^[a-zA-Z0-9]+$/i.test(str);

// 用户名参矫正
exports.saveIP = (user, ip) => {
    // 最大允许记录50条ip
    if (user.history_login_ip.length > 50) user.history_login_ip.shift();
    let str = `ip: ${ip}__${moment().format('YYYYMMDDHHmmss')}`;
    user.history_login_ip.push(str); // 记录登录ip地址
    user.save();
};

// hash生成
exports.bhash = (str) => bcrypt.hashSync(str, 10);
// 比较hash
exports.bcompare = (str, hash) => {
    return bcrypt.compareSync(str, hash);
};
// 生成指定长度的随机数
/**
 *
 * @param {Number} n 长度
 */
exports.getRandom = (n) => {
    var chars = [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
    ];
    var res = '';
    for (var i = 0; i < n; i++) {
        var id = Math.ceil(Math.random() * 35);
        res += chars[id];
    }
    return res;
};
// user_id解密
exports.decryptionDatagram = (
    encrypted,
    algorithm = 'aes-256-cbc',
    key = '' //秘钥
) => {
    var decrypted = '';
    var decipher = crypto.createDecipher(algorithm, key);
    decrypted += decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};
/**
 * 传入数组中如果有原数组的name，则原数组hot++
 * 传入数组汇总如果没有原数组name, 则push
 * @param {Array} old_arr 原数组
 * @param {Array} new_arr 传入数组
 * @return [] 新数组
 */
exports.newArr = (old_arr, new_arr) => {
    var crr = [...old_arr, ...new_arr]; // 合并数组
    var nobj = {};
    var narr = [];
    for (var i = 0; i < crr.length; i++) {
        if (nobj[crr[i].name]) {
            for (var j = 0; j < narr.length; j++) {
                // 对已有的数组hot++
                if (narr[j].name === crr[i].name) {
                    narr[j].hot++;
                    break;
                }
            }
        } else {
            nobj[crr[i].name] = crr[i].name; // 原数组中没有传入数组元素，则增添
            narr = [...narr, ...[crr[i]]];
        }
    }
    return narr;
};

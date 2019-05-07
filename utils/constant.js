const crypto = require('crypto');

module.exports = {
  MD5_SUFFIX: '盐值盐fdsg值盐asdasdsa值盐值',
  md5: (pwd) => {
    let md5 = crypto.createHash('md5');
    return md5.update(pwd).digest('hex');
  },
  secretKey: 'tbtbt0190507mio_jwttoken'
};
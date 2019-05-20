const expressJwt = require("express-jwt");
const { secretKey } = require('./constant');
const jwtAuth = expressJwt({secret: secretKey}).unless({
  path: [
    '/api/auth_routes',
    '/api/login/account',
    // {path: ['/api/crawler']},
    // {path: ['/api/manage']},
    // {path: ['/api/auth_routes']},
    '/api/wx/login',
    '/api/wx/pageList',
    '/api/wx/getUserInfo',
    '/api/wx/getJobDetail',
    '/api/wx/getUserCollectionById',
    '/api/wx/changeData',
    '/api/wx/test'
  ]
});

module.exports = jwtAuth;
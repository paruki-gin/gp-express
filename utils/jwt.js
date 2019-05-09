const expressJwt = require("express-jwt");
const { secretKey } = require('./constant');
const jwtAuth = expressJwt({secret: secretKey}).unless({
  path: [
    {path: ['/api/login']},
    {path: ['/api/currentUser']},
    {path: ['/api/crawler']},
    {path: ['/api/manage']},
    {path: ['/api/auth_routes']},
    '/api/wx/login',
    '/api/wx/pageList',
    '/api/wx/getUserInfo',
    '/api/wx/getJobDetail',
    '/api/wx/getUserCollectionById'
  ]
});

module.exports = jwtAuth;
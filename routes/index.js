var express = require('express');
var router = express.Router();
var loginRouter = require('./login');
var usersRouter = require('./users');

router.use('/login', loginRouter);
router.use('/currentUser', usersRouter);

module.exports = router;

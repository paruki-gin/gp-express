const express = require('express');
const router = express.Router();
const loginRouter = require('./login');
const usersRouter = require('./users');
const crawlerRouter = require('./crawler');
const wxRouter = require('./wx');

router.use('/login', loginRouter);
router.use('/currentUser', usersRouter);
router.use('/crawler', crawlerRouter);
router.use('/wx', wxRouter);
router.get('/auth_routes', function(req, res, next) {
  res.send({'/form/advanced-form': { authority: ['admin', 'user'] }});
});

module.exports = router;

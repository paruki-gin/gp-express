const express = require('express');
const router = express.Router();

router.post('/account', function(req, res, next) {
  const { password, userName, type } = req.body;
  if (password === 'ant.design' && userName === 'admin') {
    res.send({
      status: 'ok',
      type,
      currentAuthority: 'admin',
    });
    return;
  }
  if (password === 'ant.design' && userName === 'user') {
    res.send({
      status: 'ok',
      type,
      currentAuthority: 'user',
    });
    return;
  }
  res.send({
    status: 'error',
    type,
    currentAuthority: 'guest',
  });
});

module.exports = router;

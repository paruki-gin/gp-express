const express = require('express');
const router = express.Router();

router.post('/account', function(req, res, next) {
  const { password, userName, type } = req.body;
  if (password === 'admin' && userName === 'admin') {
    res.send({
      status: 'ok',
      type,
      currentAuthority: 'admin',
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

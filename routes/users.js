const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();

router.get('/', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  if (authorization && authorization.length) {
    const decoded = jwt.decode(authorization.split(' ')[1]);
    const name = decoded['name'];
    const userName = decoded['userName'];
    res.send({
      name,
      userName
    });
  } else {
    res.send({});
  }

});

module.exports = router;

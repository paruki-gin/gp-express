const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();
const myDb = require('../utils/db');

router.get('/', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  if (authorization && authorization.length) {
    const decoded = jwt.decode(authorization.split(' ')[1]);
    const name = decoded['name'];
    const userName = decoded['userName'];
    myDb.connect().then(dbObj => {
      dbObj.collection("admin")
        .findOne({'userName': userName}, function(err, result) {
          if (err) {
            console.error(err);
          }
          if (result) {
            res.send({
              name: result.nickName,
              userName: result.userName,
              type: result.type,
              status: result.status
            });
          }
        });
    })
  } else {
    res.send({});
  }

});

module.exports = router;

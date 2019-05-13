const express = require('express');
const utility=require("utility");
const WXBizDataCrypt = require('../utils/WXBizDataCrypt');
const jwt = require("jsonwebtoken");
const { MD5_SUFFIX, md5, secretKey } = require('../utils/constant');
const myDb = require('../utils/db');
const ObjectId = require('mongodb').ObjectId;
const router = express.Router();

router.post('/account', function(req, res, next) {
  const { password, userName, type } = req.body;
  const md5Value = utility.md5(password);
  myDb.connect().then(dbObj => {
    dbObj.collection("admin")
      .findOne({'userName': userName}, function(err, result) {
        if (err) {
          console.error(err);
        }
        if (result.password === md5Value) {
          dbObj.collection("admin").update(
            {
              "_id":ObjectId(result._id)
            },
            {"$set":
              {
              "latesetTime":(new Date()).valueOf()+''
              }
            }, function(error, ress) {
              if (error) {
                console.error(error);
              } else {
                console.log(result)
                let token = jwt.sign({
                  userName: result.userName,
                  name: result.nickName
                }, secretKey, {
                  expiresIn: '1d'
                })
                res.send({
                  status: 'ok',
                  type,
                  currentAuthority: 'admin',
                  token: token
                });
              }
          })
        } else {
          res.send({
            status: 'error',
            type,
            currentAuthority: 'guest',
          });
        }
      });
  })
});

module.exports = router;

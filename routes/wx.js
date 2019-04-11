const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const moment = require('moment');
const superagent = require('superagent');
const fs = require('fs');
const events = require("events");
const dbAddress = require("../config/index");
const WXBizDataCrypt = require('../utils/WXBizDataCrypt');

router.get('/getUserInfo', function(req, res, next) {
  console.log("Cookie", req['headers']['Cookie'])
  console.log('sessionID', req.session.id)
  if (req.sessionID === req['headers']['Cookie']) {
    res.json({
      success: true,
      data: req.sessionID
    })
  } else {
    res.json({
      success: false,
      msg: '用户未登录'
    })
  }
})

router.post('/login', function(req, res, next) {
  const {code, encryptedData, iv} = req.body;
  superagent
    .get('https://api.weixin.qq.com/sns/jscode2session')
    .query({
      grant_type: 'authorization_code',
      appid: 'wx749c671ee1602908',
      secret: 'df6ae6217dcd85029f66d2e375f89250',
      js_code: code
    })
    .then((response, err) => {
      if (response.statusCode === 200) {
        const data = JSON.parse(response.text);
        if (data.openid) {
          let openid = data.openid;
          let session_key = data.session_key;

          let pc = new WXBizDataCrypt('wx749c671ee1602908', session_key)
          let userInfo = pc.decryptData(encryptedData , iv)
          req.session.user = {
            openid,
            session_key,
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          }

          MongoClient.connect(dbAddress, function(err, db) {
            if (err) {
              console.error(err)
              db.close();
            };
            let dbObj = db.db("gpbase");
            dbObj.collection("user")
              .findOne({'openid':openid}, function(err, result) {
                if (err) {
                  console.error(err);
                  db.close();
                }
                if (!result) {
                  dbObj.collection("user").insert(userInfo, function(err, res) {
                    if (err) throw err;
                  })
                } else {}
              });
          })
          res.json({
            success: true,
            data: {
              sessionId: req.sessionID,
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl
            }
          })
        } else {
          res.json({
            success: false,
            msg: response.text
          })
        }
      } else {
        console.log("[error]", err)
        res.json({
          success: false,
          msg: err
        })
      }
    })
});

router.post('/pageList', function(req, res, next) {
  let city = req.body.city || "";
  let keyword = req.body.keyword || "";
  let workYear = req.body.keyword || "";
  let education = req.body.education || "";
  let pageNo = req.body.pageNo || 1;
  let query = {};
  console.log('session', req.session);
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) {
      console.error(err)
      db.close();
    };
    let dbObj = db.db("gpbase");
    dbObj.collection("job")
        .find({})
        .skip((pageNo-1)*15)
        .limit(15)
        .sort({'createTime': -1})
        .toArray(function(err, result) {
          if (err) {
            throw err;
          }
          res.json({
            success: true,
            result: {
              pageNo: pageNo,
              data: result
            }
          })
        });
  })
});

router.get('/getJobDetail', function(req, res, next) {
  let id = req.query.id;
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) {
      console.error(err)
      db.close();
      res.json({
        success: false,
        msg: '查询失败'
      })
    };
    let dbObj = db.db("gpbase");
    dbObj.collection("job")
        .findOne({'_id': ObjectId(id)}, function(err, result) {
          if (err) {
            console.error(err);
            db.close();
            res.json({
              success: false,
              msg: '查询失败'
            })
          }
          res.json({
            success: true,
            result: result
          })
        });
  })
});

module.exports = router;

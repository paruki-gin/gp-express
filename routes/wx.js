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
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) {
      console.error(err)
      db.close();
    };
    let dbObj = db.db("gpbase");
    dbObj.collection("job", function (err, collection) {
      if (err) {
        dbObj.close();
        throw err;
      }
      collection.count(query, function (err, total) {
        collection.find(query, {
          skip: (pageNo-1)*15,
          limit: 15
        })
        .sort({'formatTime': -1})
        .toArray(function(err, result) {
          if (err) {
            throw err;
          }
          res.json({
            success: true,
            result: {
              pageNo: pageNo,
              data: result,
              total: total
            }
          })
        });
      })
    })
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
    // dbObj.collection("job").updateOne({positionId: '5228283'}, {
    //   $set: {
    //     jobDetail: `        <p>岗位职责：</p>`
    //   }
    // }).then((res) => {
    //   console.log('ok');
    // })
    dbObj.collection("job")
        .findOne({'_id': ObjectId(id)})
        .then((result) => {
          if (err) {
            console.error(err);
            db.close();
            res.json({
              success: false,
              msg: '查询失败'
            })
          }
          if (result.isComplete) {
            res.json({
              success: true,
              result: result
            })
          } else {
            let crawler = new Crawler();
            crawler.queue([
              {
                uri: result.detailLink,
                headers:{
                  'Set-Cookie':'index_location_city='+encodeURI('杭州'),
                  'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
                  'JSESSIONID':'ABAAABAAAGFABEFC5E29AF672C4DAF0B10AEE494D83FD62',
                  'login':true
                },
                jQuery: {
                  name: 'cheerio',
                  options: {
                    // normalizeWhitespace: true,
                    // xmlMode: true,
                    decodeEntities: false
                  }
                },
                callback: function (error, ress, done) {
                  try {
                    if (error) {
                      throw error
                    } else {
                      let $ = ress.$;
                      let jobDetail = $('.job-detail').html();
                      let workAddrText = $('.work_addr').text().replace(/\s+/g,"");
                      let workAddr = '';
                      if (workAddrText.indexOf('查看地图') > -1) {
                        workAddr = workAddrText.substring(0, workAddrText.indexOf('查看地图'));
                      } else {
                        workAddr = workAddrText;
                      }
                      console.log('id', id);
                      dbObj.collection("job").updateOne({_id: ObjectId(id)}, {
                        $set: {
                          jobDetail: jobDetail,
                          workAddr: workAddr,
                          isComplete: 1
                        }
                      }).then(() => {
                        dbObj.collection("job")
                          .findOne({'_id': ObjectId(id)})
                          .then((result) => {
                            if (err) {
                              console.error(err);
                              db.close();
                              res.json({
                                success: false,
                                msg: '查询失败'
                              })
                            } else {
                              res.json({
                                success: true,
                                result: result
                              })
                            }
                          })
                      })
                    }
                    done();
                  } catch (e) {
                    console.error(e);
                    done();
                    db.close();
                  }
                }
            }])
          }
        });
  })
});

module.exports = router;

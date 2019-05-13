const express = require('express');
const router = express.Router();
const Crawler = require("crawler");
const ObjectId = require('mongodb').ObjectId;
const superagent = require('superagent');
const WXBizDataCrypt = require('../utils/WXBizDataCrypt');
const jwt = require("jsonwebtoken");
const { MD5_SUFFIX, md5, secretKey } = require('../utils/constant');
const myDb = require('../utils/db');
// const cheerio = require('cheerio');
// const MongoClient = require('mongodb').MongoClient;
// const moment = require('moment');
// const fs = require('fs');
// const events = require("events");
// const dbAddress = require("../config/index");

router.get('/changeData', function(req, res, next) {
  // var str="10k-20K";
	// var n=str.replace(/[kK]/g,'');
  // var res = n.split('-');
  myDb.connect().then(dbObj => {
    let result = dbObj.collection("job").find({}, {'_id': 1, 'salary': 1});
    let list=[];
    result.each(function(error,doc){
      if (error) {
        console.log(error);
      } else {
        if (doc!=null) {  //如果循环遍历出数据
            list.push(doc);
        } else {  //doc==null表示数据循环完成
          /*获取数据以后*/
          for(var i=0;i<list.length;i++){
            let salaryStr = list[i].salary;
            let str = salaryStr.replace(/[kK]/g,'');
            let ss = str.split('-');
            let salaryMin = ss[0];
            let salaryMax = ss[1];
            let salaryStage = [];
            //判断区间是否交叉
            //start2 <= end1 && end2 >= start1
            if (0 <= salaryMax && 2 >= salaryMin) {
              salaryStage.push('0');
            }
            if (2 <= salaryMax && 5 >= salaryMin) {
              salaryStage.push('1');
            }
            if (5 <= salaryMax && 10 >= salaryMin) {
              salaryStage.push('2');
            }
            if (10 <= salaryMax && 15 >= salaryMin) {
              salaryStage.push('3');
            }
            if (15 <= salaryMax && 25 >= salaryMin) {
              salaryStage.push('4');
            }
            if (25 <= salaryMax && 50 >= salaryMin) {
              salaryStage.push('5');
            }
            if (50 <= salaryMax && 100 >= salaryMin) {
              salaryStage.push('6');
            }
            dbObj.collection("job").update({_id: ObjectId(list[i]._id)}, {
              $set: {
                salaryMin,
                salaryMax,
                salaryStage
              }
            }, function(err, res) {
              if (err) throw err;
            })
            // dbObj.collection("job").updateOne({_id: ObjectId(id)}, {
            //   $set: {
            //     jobDetail: jobDetail,
            //     workAddr: workAddr,
            //     isComplete: 1
            //   }
            // })
            // console.log(list[i]._id, salaryMin, salaryMax, salaryStage);
          }
        }
      }
    });
    res.json({
      success: true,
      data: {}
    })
  })
});

router.get('/getUserInfo', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("user")
        .findOne({'openId':openid}, function(err, result) {
          if (err) {
            console.error(err);
          }
          if (!result) {
            res.json({
              success: true,
              data: {}
            })
          } else {
            let {nickName, avatarUrl, _id} = result;
            res.json({
              success: true,
              data: {
                nickName,
                avatarUrl
              }
            })
          }
        });
    })
  } else {
    res.json({
      success: false,
      msg: '未登录'
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
          // req.session.user = {
          //   openid,
          //   session_key,
          //   nickName: userInfo.nickName,
          //   avatarUrl: userInfo.avatarUrl
          // }
          let tokenObj = {
            openid,
            session_key
          };
          myDb.connect().then(dbObj => {
            dbObj.collection("user")
              .findOne({'openId':openid}, function(err, result) {
                if (err) {
                  console.error(err);
                }
                if (!result) {
                  dbObj.collection("user").insert(userInfo, function(err, res) {
                    if (err) throw err;
                  })
                } else {
                }
              });
            let token = jwt.sign(tokenObj, secretKey, {
              expiresIn: '7d'
            })
            res.json({
              success: true,
              data: {
                token: token,
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl
              }
            })
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

router.get('/logout', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  console.log(authorization);
  if (!authorization.length) {
    res.json({
      success: true
    })
  }
})

router.post('/pageList', function(req, res, next) {
  let query = {};
  let currRegion = req.body.currRegion || "";
  if (currRegion) {
    currRegion = currRegion.substr(0, currRegion.length - 1);
    query['$or'] = [{city: currRegion}, {area:currRegion}];
  }
  let currInput = req.body.currInput || "";
  if (currInput) {
    query['name'] = new RegExp(currInput, 'i');
  }
  let currSalary = req.body.currSalary || "";
  if (currSalary && currSalary !== '-1') {
    query['salaryStage'] = currSalary;
  }
  let currWorkYear = req.body.currWorkYear || "";
  if (currWorkYear && currWorkYear !== '-1') {
    query['workYear'] = currWorkYear;
  }
  let currCompanySize = req.body.currCompanySize || "";
  if (currCompanySize && currCompanySize !== '-1') {
    query['companySize'] = currCompanySize;
  }
  let currFinanceStage = req.body.currFinanceStage || "";
  if (currFinanceStage && currFinanceStage !== '-1') {
    query['financeStage'] = currFinanceStage;
  }
  let pageNo = req.body.pageNo || 1;
  myDb.connect().then(dbObj => {
    dbObj.collection("job", function (err, collection) {
      if (err) {
        // db.close();
        throw err;
      }
      collection.count(query, function (err, total) {
        collection.find(query, {
          skip: (pageNo-1)*15,
          limit: 15
        })
        .sort({'createTime': -1})
        .toArray(function(err, result) {
          if (err) {
            // db.close();
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

  // MongoClient.connect(dbAddress, function(err, db) {
  //   console.timeEnd('connect');
  //   if (err) {
  //     console.error(err)
  //     db.close();
  //   };
  //   console.time('find');
  //   let dbObj = db.db("gpbase");
  //   dbObj.collection("job", function (err, collection) {
  //     if (err) {
  //       db.close();
  //       throw err;
  //     }
  //     collection.count(query, function (err, total) {
  //       collection.find(query, {
  //         skip: (pageNo-1)*15,
  //         limit: 15
  //       })
  //       .sort({'createTime': -1})
  //       .toArray(function(err, result) {
  //         if (err) {
  //           db.close();
  //           throw err;
  //         }
  //         console.timeEnd('find');
  //         res.json({
  //           success: true,
  //           result: {
  //             pageNo: pageNo,
  //             data: result,
  //             total: total
  //           }
  //         })
  //         db.close();
  //       });
  //     })
  //   })
  // })
});

router.post('/pageCollectionList', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("user")
        .findOne({'openId':openid}, function(err, result) {
          if (err) {
            console.error(err);
          }
          if (!result) {
            res.json({
              success: true,
              data: {}
            })
          } else {
            let pageNo = req.body.pageNo || 1;
            //查询收藏
            let colleArr = result.collection;
            let query = {};
            dbObj.collection("job", function (err, collection) {
              if (err) {
                throw err;
              }
              let colleIds = colleArr.map(curr => {
                return ObjectId(curr);
              });
              console.log('colleArr', colleIds);
              collection.count({ _id : { $in : colleIds }}, function (err, total) {
                collection.find({ _id : { $in : colleIds }}, {
                  skip: (pageNo-1)*15,
                  limit: 15
                })
                .sort({'createTime': -1})
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
          }
        });
    })
  }
})

router.get('/getJobDetail', function(req, res, next) {
  let id = req.query.id;
  myDb.connect().then(dbObj => {
    dbObj.collection("job")
        .findOne({'_id': ObjectId(id)})
        .then((result) => {
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
                      console.log('jobDetail', jobDetail);
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
                            res.json({
                              success: true,
                              result: result
                            })
                          })
                      })
                    }
                    done();
                  } catch (e) {
                    console.error(e);
                    done();
                  }
                }
            }])
          }
        });
  })
});

router.get('/getUserCollectionById', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let jobId = req.query.id;
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("user")
        .findOne({'openId':openid}, function(err, result) {
          if (err) {
            console.error(err);
          }
          if (!result) {
            res.json({
              success: false,
              data: {}
            })
          } else {
            let jobs = result.collection;
            if (jobs.includes(jobId)) {
              res.json({
                success: true,
                data: {
                  isColled: true
                }
              })
            } else {
              res.json({
                success: true,
                data: {
                  isColled: false
                }
              })
            }
          }
        });
    })
  } else {
    res.json({
      success: false,
      msg: '未登录'
    })
  }
});

router.get('/setUserCollection', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let jobId = req.query.id;
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("user").update({"openId":openid},{"$addToSet":{"collection":jobId}}, function(err, result) {
        if (err) {
          console.error(err);
        } else {
          res.json({
            success: true,
            msg: '收藏成功'
          })
        }
      })
      /* dbObj.collection("user")
        .findOne({'openId':openid}, function(err, result) {
          if (err) {
            console.error(err);
            db.close();
          }
          if (!result) {
            res.json({
              success: false,
              error: '失败'
            })
          } else {

          }
        }); */
    })
  }
})

router.get('/delUserCollection', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let jobId = req.query.id;
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("user").update({"openId":openid},{"$pull":{"collection":jobId}}, function(err, result) {
        if (err) {
          console.error(err);
        } else {
          res.json({
            success: true,
            msg: '取消收藏成功'
          })
        }
      })
    })
  }
})

module.exports = router;

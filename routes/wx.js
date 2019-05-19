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

//接口访问记录
function insertRequestLog(dbObj, request, openId) {
  dbObj.collection("requestLog").insert({
    request: request,
    openId: openId,
    timestamp: new Date().getTime()+''
  }, function(err, res) {
    if (err) throw err;
  })
}

router.get('/test', function(req, res, next) {
  // let authorization = req['headers']['authorization'];
  // let jobId = req.query.id;
  let jobId = '5cb05388df725b34c42044b3';
  // if (authorization.length) {
    // let decoded = jwt.decode(authorization.split(' ')[1]);
    // let openid = decoded['openid'];
    let openid = 'oHDOQ4sgsMCGflHi8riu29l_gn30';
    myDb.connect().then(dbObj => {
      dbObj.collection("userCollection").insert(
        {
          openId: openid,
          jobId: ObjectId(jobId),
          status: 1,
          timestamp: (new Date()).valueOf()+''
        }, function(err, result) {
        if (err) {
          console.error(err);
        } else {
          res.json({
            success: true,
            msg: '收藏成功'
          })
        }
      })
      // dbObj.collection("userCollection")
      // .findOne({'openId': openid})
      // .then((result) => {
      //   if (result) {
      //     dbObj.collection("userCollection").update(
      //       {"openId": openid},
      //       {
      //         "$set":{
      //           jobId: ObjectId(jobId),
      //           status: 1,
      //           timestamp: (new Date()).valueOf()+''
      //         }
      //       }, function(err, result) {
      //       if (err) {
      //         console.error(err);
      //       } else {
      //         res.json({
      //           success: true,
      //           msg: '收藏成功'
      //         })
      //       }
      //     })
      //   } else {

      //   }
      // })
    })
  // }
})

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
                  dbObj.collection("user").insert({
                    userInfo,
                    latesetTime: (new Date()).valueOf()+''
                  }, function(err, res) {
                    if (err) throw err;
                  })
                } else {
                  dbObj.collection("user").update(
                    {
                      "openId":openid
                    },
                    {"$set":
                      {
                      "latesetTime":(new Date()).valueOf()+''
                      }
                    }, function(error, ress) {
                      if (error) {
                        console.error(error);
                      } else {
                        console.log(ress)
                      }
                  })
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
  let authorization = req['headers']['authorization'];
  let openid = '';
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    openid = decoded['openid'];
  }
  myDb.connect().then(dbObj => {
    insertRequestLog(dbObj, '/wx/pageList', openid);
  });
  let query = {
    status: 1
  };
  let currRegion = req.body.currRegion || "";
  if (currRegion) {
    currRegion = currRegion.substr(0, currRegion.length - 1);
    query['$or'] = [{city: currRegion}, {area:currRegion}];
  }
  let currInput = req.body.currInput || "";
  if (currInput) {
    name = name.replace(/([\^\$\(\)\*\+\?\.\\\|\[\]\{\}])/g, "\\$1");
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
});

router.post('/pageListByCompany', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let openid = '';
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    openid = decoded['openid'];
  }
  let companyId = req.body.companyId;
  let pageNo = req.body.pageNo || 1;
  let query = {
    status: 1,
    companyId: companyId
  };
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
});

router.get('/getJobDetail', function(req, res, next) {
  let id = req.query.id;
  let authorization = req['headers']['authorization'];
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("userHistory").insert({
        userId: openid,
        jobId: ObjectId(id),
        status: 1,
        timestamp: (new Date()).valueOf()+''
      });
    })
  }
  myDb.connect().then(dbObj => {
    dbObj.collection("job")
      .findOne({'_id': ObjectId(id)})
      .then((result) => {
        if (result.isComplete) {
          res.json({
            success: true,
            result: result,
            update: 0
          })
        } else {
          let crawler = new Crawler();
          crawler.queue([
            {
              uri: result.detailLink,
              headers:{
                'Cookie':'index_location_city='+encodeURI('杭州')+';user_trace_token=20181127172617-5d56fc60-618b-'+(Math.floor(Math.random()*9000)+1000)+'-'+(Math.floor(Math.random()*9000)+1000)+'-21efad3c49df; JSESSIONID=ABAAABAAAFCAAEG70DFEA8B139FF80287ABDF2F4C137946; showExpriedIndex=1; showExpriedCompanyHome=1; showExpriedMyPublish=1; _ga=GA1.2.405959562.1543310779; _gid=GA1.2.577762828.1543310779; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1543310402,1543310779; LGSID=20181127172618-7ef404ed-f226-11e8-80e4-525400f775ce; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2F; LGUID=20181127172618-7ef406c2-f226-11e8-80e4-525400f775ce; _gat=1; TG-TRACK-CODE=index_navigation; SEARCH_ID=88db5c7fa2464090a6dd7041f35074ba; X_HTTP_TOKEN=492369107a1a20441020ab9b771f2f6d; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%221675489482d244-0f3ef5ad6aef94-4313362-2073600-1675489482e36f%22%2C%22%24device_id%22%3A%221675489482d244-0f3ef5ad6aef94-4313362-2073600-1675489482e36f%22%7D; sajssdk_2015_cross_new_user=1; ab_test_random_num=0; _putrc=69D503B669D896FC123F89F2B170EADC; login=true; hasDeliver=0; gate_login_token=33f3414d87f12e09e089b3b6daf10134f0a5ebf49fad63dfd9b8bc4e3a4f162b; unick=hello; LGRID=20181127174101-8d501f2b-f228-11e8-8c21-5254005c3644; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1543311662',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Host': 'www.lagou.com',
                'Origin': 'https://www.lagou.com',
                'Referer': 'https://www.lagou.com/jobs/list_web?city='+encodeURI('杭州')+'&cl=false&fromSearch=true&labelWords=&suginput=',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.80 Safari/537.36',
                'Cache-Control': 'max-age=0',
                'X-Anit-Forge-Code': '0',
                'X-Anit-Forge-Token': 'None',
                'X-Requested-With': 'XMLHttpRequest',
                'Set-Cookie':'index_location_city='+encodeURI('杭州'),
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
                    let outline_tag = $('.outline_tag').text();
                    let name = $('.name').text();
                    let jobDetail = $('.job-detail').html();
                    let workAddrText = $('.work_addr').text().replace(/\s+/g,"");
                    let workAddr = '';
                    if (workAddrText.indexOf('查看地图') > -1) {
                      workAddr = workAddrText.substring(0, workAddrText.indexOf('查看地图'));
                    } else {
                      workAddr = workAddrText;
                    }
                    console.log('id', id);
                    console.log('name', name);
                    console.log('jobDetail', jobDetail);
                    console.log('outline_tag', outline_tag);
                    dbObj.collection("job").updateOne({_id: ObjectId(id)}, {
                      $set: {
                        jobDetail: jobDetail || '',
                        workAddr: workAddr || '',
                        isComplete: jobDetail ? 1 : 0,
                        updateTime: (new Date()).valueOf()+'',
                        status: outline_tag ? -1 : 1
                      }
                    }).then(() => {
                      dbObj.collection("job")
                        .findOne({'_id': ObjectId(id)})
                        .then((result) => {
                          res.json({
                            success: true,
                            result: result,
                            update: jobDetail ? 1 : -1,
                            outline: outline_tag ? true : false
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
      }).catch((err) => {
        console.error(err);
        throw err;
      });
  });
});

router.get('/getUserCollectionById', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let jobId = req.query.id;
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("userCollection")
        .findOne(
          {
            'userId': openid,
            'jobId': ObjectId(jobId)
          }, function(err, result) {
            if (err) {
              console.error(err);
            }
            if (!result) {
              res.json({
                success: true,
                data: {
                  isColled: false
                }
              })
            } else {
              if (result.status === 1) {
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

router.post('/pageCollectionList', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let pageNo = req.body.pageNo || 1;
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("userCollection").aggregate([
        {
          $match: {
            userId: openid,
            status: 1
          }
        },
        {
          $lookup:{
            from: "job",
            localField: "jobId",
            foreignField: "_id",
            as: "jobs"
          }
        },
        {$project:{"jobId":0,"userId":0}},
        {$unwind:"$jobs"},
        {$sort:{"updateTime":-1}},
        {$skip: (pageNo-1)*15},
        {$limit: 15}
      ]).toArray((err, result) => {
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
      })
    })
    // myDb.connect().then(dbObj => {
    //   dbObj.collection("user")
    //     .findOne({'openId':openid}, function(err, result) {
    //       if (err) {
    //         console.error(err);
    //       }
    //       if (!result) {
    //         res.json({
    //           success: true,
    //           data: {}
    //         })
    //       } else {
    //         let pageNo = req.body.pageNo || 1;
    //         //查询收藏
    //         let colleArr = result.collection;
    //         let query = {};
    //         dbObj.collection("job", function (err, collection) {
    //           if (err) {
    //             throw err;
    //           }
    //           let colleIds = colleArr.map(curr => {
    //               return ObjectId(curr);
    //           });
    //           collection.count({ _id : { $in : colleIds }}, function (err, total) {
    //             collection.find(
    //               {
    //                 _id: {
    //                   $in : colleIds
    //                 },
    //                 status: 1
    //               },
    //               {
    //                 skip: (pageNo-1)*15,
    //                 limit: 15
    //               }
    //             )
    //             .sort({'createTime': -1})
    //             .toArray(function(err, result) {
    //               if (err) {
    //                 throw err;
    //               }
    //               res.json({
    //                 success: true,
    //                 result: {
    //                   pageNo: pageNo,
    //                   data: result,
    //                   total: total
    //                 }
    //               })
    //             });
    //           })
    //         })
    //       }
    //     });
    // })
  }
})

router.get('/setUserCollection', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let jobId = req.query.id;
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("userCollection").insert(
        {
          userId: openid,
          jobId: ObjectId(jobId),
          status: 1,
          createTime: (new Date()).valueOf()+'',
          updateTime: (new Date()).valueOf()+''
        }, function(err, result) {
        if (err) {
          console.error(err);
        } else {
          res.json({
            success: true,
            msg: '收藏成功'
          })
        }
      })
    })
    // myDb.connect().then(dbObj => {
    //   dbObj.collection("user").update({"openId":openid},{"$addToSet":{"collection":jobId}}, function(err, result) {
    //     if (err) {
    //       console.error(err);
    //     } else {
    //       res.json({
    //         success: true,
    //         msg: '收藏成功'
    //       })
    //     }
    //   })
    // })
  }
})

router.get('/delUserCollection', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let jobId = req.query.id;
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    let openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("userCollection").update(
        {
          "userId": openid,
          "jobId": ObjectId(jobId)
        },
        {
          "$set":{
            status: 0,
            updateTime: (new Date()).valueOf()+''
          }
        }, function(err, result) {
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
    // myDb.connect().then(dbObj => {
    //   dbObj.collection("user").update({"openId":openid},{"$pull":{"collection":jobId}}, function(err, result) {
    //     if (err) {
    //       console.error(err);
    //     } else {
    //       res.json({
    //         success: true,
    //         msg: '取消收藏成功'
    //       })
    //     }
    //   })
    // })
  }
})

router.post('/pageUserHistoryList', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let openid = '';
  let pageNo = req.body.pageNo || 1;
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    openid = decoded['openid'];
  }
  myDb.connect().then(dbObj => {
    dbObj.collection("userHistory").aggregate([
      {
        $match: {
          userId: openid,
          status: 1
        }
      },
      {
        $lookup:{
          from: "job",
          localField: "jobId",
          foreignField: "_id",
          as: "jobs"
        }
      },
      {$project:{"jobId":0,"userId":0}},
      {$unwind:"$jobs"},
      {$sort:{"timestamp":-1}},
      {$skip: (pageNo-1)*15},
      {$limit: 15}
    ]).toArray((err, result) => {
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
    })
  })
})

router.get('/clearUserHistory', function(req, res, next) {
  let authorization = req['headers']['authorization'];
  let openid = '';
  if (authorization.length) {
    let decoded = jwt.decode(authorization.split(' ')[1]);
    openid = decoded['openid'];
    myDb.connect().then(dbObj => {
      dbObj.collection("userHistory").updateMany(
        {userId: openid},
        {$set: { "status" : 0 }}
      ).then((err, result) => {
        res.json({
          success: true,
          data: {}
        })
      })
    })
  }
});

/* router.get('/changeData', function(req, res, next) {
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
          //获取数据以后
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
}); */


module.exports = router;

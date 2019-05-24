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
const myDb = require('../utils/db');
const utility = require("utility");
const { MD5_SUFFIX, md5, secretKey } = require('../utils/constant');

router.get('/getJobAndUserNum', function(req, res, next) {
  let query = {};
  let startTime = new Date(new Date(new Date().toLocaleDateString()).getTime()).valueOf(); // 当天0点
  let endTime = new Date(new Date(new Date().toLocaleDateString()).getTime() +24 * 60 * 60 * 1000 -1).valueOf();// 当天23:59
  myDb.connect().then(dbObj => {
    dbObj.collection("job").count(function (err, totalJob) {
      if (err) {
        throw err;
      }
      dbObj.collection("user").count(function (err, totalUser) {
        if (err) {
          throw err;
        }
        dbObj.collection("requestLog").count(function (err, totalRequset) {
          if (err) {
            throw err;
          }
          dbObj.collection("requestLog").find({
            "timestamp": {
              $gte: startTime+'',
              $lte: endTime+''
            }
          }).count(function (err, currDayRequset) {
            if (err) {
              throw err;
            }
            res.json({
              success: true,
              result: {
                totalJob,
                totalUser,
                totalRequset,
                currDayRequset
              }
            })
          })
        })
      })
    })

  })
});

router.get('/getCategoryGroup', function(req, res, next) {
  let query = {};
  myDb.connect().then(dbObj => {
    dbObj.collection("job").aggregate(
      [
        {
          $group : {
            _id : "$category",
            value: {
              $sum : 1
            }
          }
        },
        {
          $match: {
            value: {
              $gt: 5
            }
          }
        },
        {
          $sort: {
            value: -1
          }
        }
    ]).toArray((err, result) => {
      if (err) {
        throw err;
      }
      res.json({
        success: true,
        result: result
      })
    });
  })
});

router.get('/getTagCloud', function(req, res, next) {
  let query = {};
  myDb.connect().then(dbObj => {
    dbObj.collection("job").aggregate(
      [
        {
          $unwind:"$industryLables"
        },
        {
          $group : {
            _id : "$industryLables",
            value: {
              $sum : 1
            }
          }
        },
        {
          $match: {
            value: {
              $gt: 5
            }
          }
        }
      ]).toArray((err, result) => {
      if (err) {
        throw err;
      }
      result.forEach(element => {
        element['name'] = element['_id']
      });
      res.json({
        success: true,
        result: result
      })
    });
  })
});

router.get('/getCrawlerStatus', function(req, res, next) {
  myDb.connect().then(dbObj => {
    dbObj.collection("crawlerLog")
      .find()
      .sort({'time': -1})
      .limit(1)
      .toArray((err, result) => {
      if (err) {
        throw err;
      }
      res.json({
        success: true,
        result: result
      })
    });
  })
});

router.get('/getRequestNumByName', function(req, res, next) {
  let name = req.query['name'] || '/wx/pageList';
  let query = {
    request: name
  };
  myDb.connect().then(dbObj => {
    dbObj.collection("requestLog", function (err, collection) {
      if (err) {
        throw err;
      }
      collection.count(query, function (err, total) {
        collection.find(query, {
          // limit: 20
        })
        .sort({'timestamp': -1})
        .toArray(function(err, result) {
          if (err) {
            throw err;
          }
          res.json({
            success: true,
            result: {
              // data: result,
              total: total
            }
          })
        });
      })
    })
  })
});

router.get('/pageLog', function(req, res, next) {
  let query = {};
  myDb.connect().then(dbObj => {
    dbObj.collection("crawlerLog", function (err, collection) {
      if (err) {
        throw err;
      }
      collection.count(query, function (err, total) {
        collection.find(query, {
          limit: 20
        })
        .sort({'time': -1})
        .toArray(function(err, result) {
          if (err) {
            throw err;
          }
          res.json({
            success: true,
            result: {
              data: result,
              total: total
            }
          })
        });
      })
    })
  })
});

router.post('/pageJobList', function(req, res, next) {
  let query = {};
  let keyword = req.body.query.keyword || "";
  if (keyword) {
    keyword = keyword.replace(/([\^\$\(\)\*\+\?\.\\\|\[\]\{\}])/g, "\\$1");
    query['name'] = new RegExp(keyword, 'i');
  }
  let city = req.body.query.city || "";
  if (city) {
    query['city'] = city;
  }
  let workYear = req.body.query.workYear || "";
  if (workYear && workYear !== '-1') {
    query['workYear'] = workYear;
  }
  let company = req.body.query.company || "";
  if (company) {
    company = company.replace(/([\^\$\(\)\*\+\?\.\\\|\[\]\{\}])/g, "\\$1");
    query['companyName'] = new RegExp(company, 'i');
  }
  let stage = req.body.query.stage || "";
  if (stage && stage !== '-1') {
    query['financeStage'] = stage;
  }
  let size = req.body.query.size || "";
  if (size && size !== '-1') {
    query['companySize'] = size;
  }
  let education = req.body.query.education || "";
  if (education && education !== '-1') {
    let str = '';
    if (education === '0') {
      str = '大专'
    } else if (education === '1') {
      str = '本科'
    } else if (education === '2') {
      str = '硕士'
    }
    query['education'] = new RegExp(str, 'i');
  }
  let salary = req.body.query.salary || "";
  if (salary && salary !== '-1') {
    query['salaryStage'] = salary;
  }
  let isComplete = req.body.query.isComplete || "";
  if (isComplete && isComplete !== '-1') {
    query['isComplete'] = +isComplete;
  }
  let pageNo = req.body.pageNo || 1;
  let pageSize = req.body.pageSize || 10;
  myDb.connect().then(dbObj => {
    dbObj.collection("job", function (err, collection) {
      if (err) {
        throw err;
      }
      collection.count(query, function (err, total) {
        collection.find(query, {
          skip: (pageNo-1)*pageSize,
          limit: pageSize
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
  })
});

router.get('/getJobDetail', function(req, res, next) {
  let id = req.query.id;
  myDb.connect().then(dbObj => {
    dbObj.collection("job")
      .findOne({'_id': ObjectId(id)})
      .then((result) => {
        if (result) {
          res.json({
            success: true,
            result: result,
            update: 0
          })
        } else {
          res.json({
            success: false,
            result: {}
          })
        }
      }).catch((err) => {
        console.error(err);
        throw err;
      });
  });
});

router.post('/changeJobStatus', function(req, res, next) {
  const {id, status} = req.body;
  let newStatus = status === 1 ? 0 : 1;
  myDb.connect().then(dbObj => {
    dbObj.collection("job").update(
      {
        _id: ObjectId(id)
      },
      {"$set":
        {
          "status": newStatus,
          "updateTime": (new Date()).valueOf()+''
        }
      }, function(error, ress) {
        if (error) {
          console.error(error);
          res.json({
            success: false
          })
        } else {
          // console.log(ress)
          res.json({
            success: true,
            data: {}
          })
        }
    })
  })
})

router.get('/updateJobDetail', function(req, res, next) {
  let id = req.query.id;
  myDb.connect().then(dbObj => {
    dbObj.collection("job")
        .findOne({'_id': ObjectId(id)})
        .then((result) => {
          if (result) {
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
        });
  })
});

router.post('/pageUserList', function(req, res, next) {
  let query = {};
  let openId = req.body.query.openId || "";
  if (openId) {
    query['openId'] = openId;
  }
  let name = req.body.query.name || "";
  if (name) {
    name = name.replace(/([\^\$\(\)\*\+\?\.\\\|\[\]\{\}])/g, "\\$1");
    query['nickName'] = new RegExp(name, 'i');
  }
  let province = req.body.query.province || "";
  if (province) {
    query['province'] = province;
  }
  let pageNo = req.body.pageNo || 1;
  let pageSize = req.body.pageSize || 10;
  myDb.connect().then(dbObj => {
    dbObj.collection("user", function (err, collection) {
      if (err) {
        throw err;
      }
      collection.count(query, function (err, total) {
        collection.find(query, {
          skip: (pageNo-1)*pageSize,
          limit: pageSize
        })
        .sort({'lastestTime': -1})
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

router.get('/getUserCollectionList', function(req, res, next) {
  let openId = req.query.openId || "";
  myDb.connect().then(dbObj => {
    dbObj.collection("user")
      .findOne({'openId':openId}, function(err, result) {
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
            collection.count({ _id : { $in : colleIds }}, function (err, total) {
              collection.find({ _id : { $in : colleIds }}
                // ,
                // {
                //   skip: (pageNo-1)*15,
                //   limit: 15
                // }
              )
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
})

router.post('/pageUserCollectionListById', function(req, res, next) {
  let openId = req.body.openId || "";
  let pageNo = req.body.pageNo || 1;
  let pageSize = req.body.pageSize || 10;
  console.log(req.body)
  myDb.connect().then(dbObj => {
    dbObj.collection("userCollection").aggregate([
      {
        $match: {
          userId: openId
        }
      },
      {
        $lookup: {
          from: "job",
          localField: "jobId",
          foreignField: "_id",
          as: "jobs"
        }
      },
      {$project:{"jobId":0,"userId":0}},
      {$unwind:"$jobs"},
      {$group: { _id: null, total: { $sum: 1 }}},
    ]).toArray((err, result) => {
      if (err) {
        throw err;
      }
      if (result.length) {
        const total = result[0].total;
        dbObj.collection("userCollection").aggregate([
          {
            $match: {
              userId: openId
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
          {$skip: (pageNo-1)*pageSize},
          {$limit: pageSize}
        ]).toArray((err, result) => {
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
      }
    })
  })
})

router.post('/pageUserHistoryListById', function(req, res, next) {
  let openId = req.body.openId || "";
  let pageNo = req.body.pageNo || 1;
  let pageSize = req.body.pageSize || 10;
  myDb.connect().then(dbObj => {
    dbObj.collection("userHistory").aggregate([
      {
        $match: {
          userId: openId
        }
      },
      {
        $lookup: {
          from: "job",
          localField: "jobId",
          foreignField: "_id",
          as: "jobs"
        }
      },
      {$project:{"jobId":0,"userId":0}},
      {$unwind:"$jobs"},
      {$group: { _id: null, total: { $sum: 1 }}},
    ]).toArray((err, result) => {
      if (err) {
        throw err;
      }
      if (result.length) {
        const total = result[0].total;
        dbObj.collection("userHistory").aggregate([
          {
            $match: {
              userId: openId
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
          {$skip: (pageNo-1)*pageSize},
          {$limit: pageSize}
        ]).toArray((err, result) => {
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
      }
    })
  })
})

router.post('/pageAdminList', function(req, res, next) {
  let query = {};
  let openId = req.body.query.openId || "";
  let pageNo = req.body.pageNo || 1;
  let pageSize = req.body.pageSize || 10;
  myDb.connect().then(dbObj => {
    dbObj.collection("admin", function (err, collection) {
      if (err) {
        throw err;
      }
      collection.count(query, function (err, total) {
        collection.find(query, {
          skip: (pageNo-1)*pageSize,
          limit: pageSize
        })
        .sort({'lastestTime': -1})
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

router.post('/addNewAdmin', function(req, res, next) {
  const { userName, nickName, password, confirm, type } = req.body;
  myDb.connect().then(dbObj => {
    dbObj.collection("admin")
      .findOne({
        $or: [
          {'userName': userName},
          {'nickName': nickName}
        ]
      }, function(err, result) {
        if (err) {
          console.error(err);
        }
        if (result) {
          res.json({
            success: false,
            code: 1,
            msg: '用户名或昵称已存在',
          });
        } else {
          dbObj.collection("admin").insert(
            {
              userName: userName,
              nickName: nickName,
              password: utility.md5(password),
              type: +type,
              status: 1,
              latesetTime: (new Date()).valueOf()+''
            }, function(error, ress) {
              if (error) {
                console.error(error);
              } else {
                res.json({
                  success: true,
                  code: 0,
                  msg: '成功',
                });
              }
          })
        }
      });
  })
})

router.post('/changeAdminStatus', function(req, res, next) {
  const {id, status} = req.body;
  let newStatus = status === 1 ? 0 : 1;
  myDb.connect().then(dbObj => {
    dbObj.collection("admin").update(
      {
        _id: ObjectId(id)
      },
      {"$set":
        {
          "status": newStatus,
        }
      }, function(error, ress) {
        if (error) {
          console.error(error);
          res.json({
            success: false
          })
        } else {
          // console.log(ress)
          res.json({
            success: true,
            data: {}
          })
        }
    })
  })
})

router.post('/changeAdminPsw', function(req, res, next) {
  const { currId, old, password} = req.body;
  const md5Value = utility.md5(old);
  myDb.connect().then(dbObj => {
    dbObj.collection("admin")
      .findOne({
        '_id': ObjectId(currId)
      }, function(err, result) {
        if (err) {
          console.error(err);
        }
        if (result.password !== md5Value) {
          res.json({
            success: false,
            code: 1,
            msg: '旧密码错误',
          });
        } else {
          dbObj.collection("admin").update(
            {
              "_id":ObjectId(result._id)
            },
            {
              "$set":
                {
                "password":utility.md5(password)
                }
            }, function(error, ress) {
              if (error) {
                console.error(error);
              } else {
                res.json({
                  success: true,
                  code: 0,
                  msg: '成功',
                });
              }
          })
        }
      });
  })
})

// router.get('/getJobDetail', function(req, res, next) {
//   let id = req.query.id;
//   MongoClient.connect(dbAddress, function(err, db) {
//     if (err) {
//       console.error(err)
//       db.close();
//       res.json({
//         success: false,
//         msg: '查询失败'
//       })
//     };
//     let dbObj = db.db("gpbase");
//     dbObj.collection("job")
//         .findOne({'_id': ObjectId(id)}, function(err, result) {
//           if (err) {
//             console.error(err);
//             db.close();
//             res.json({
//               success: false,
//               msg: '查询失败'
//             })
//           }
//           res.json({
//             success: true,
//             result: result
//           })
//         });
//   })
// });

module.exports = router;

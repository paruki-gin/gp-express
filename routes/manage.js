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

router.get('/getJobAndUserNum', function(req, res, next) {
  let query = {};
  myDb.connect().then(dbObj => {
    dbObj.collection("job").count(function (err, totalJob) {
      if (err) {
        throw err;
      }
      dbObj.collection("user").count(function (err, totalUser) {
        if (err) {
          throw err;
        }
        res.json({
          success: true,
          result: {
            totalJob,
            totalUser
          }
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
                          isComplete: 1,
                          updateTime: (new Date()).valueOf()+''
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

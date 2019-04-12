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

router.get('/pageLog', function(req, res, next) {
  let query = {};
  MongoClient.connect(dbAddress, function(err, db) {
    if (err) {
      console.error(err)
      db.close();
    };
    let dbObj = db.db("gpbase");
    dbObj.collection("crawlerLog", function (err, collection) {
      if (err) {
        dbObj.close();
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
  let city = req.body.city || "";
  let keyword = req.body.keyword || "";
  let workYear = req.body.keyword || "";
  let education = req.body.education || "";
  let pageNo = req.body.pageNo || 1;
  let pageSize = req.body.pageSize || 10;
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

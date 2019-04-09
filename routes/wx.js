const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
const moment = require('moment');
const superagent = require('superagent');
const fs = require('fs');
const events = require("events");

router.post('/pageList', function(req, res, next) {
  let dbAddress = "mongodb://localhost:27017/gpbase";
  let city = req.body.city || "";
  let keyword = req.body.keyword || "";
  let workYear = req.body.keyword || "";
  let education = req.body.education || "";
  let pageNo = req.body.pageNo || 1;
  console.log('req', req.body.pageNo)
  let query = {};
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
          console.log(result[0].positionId);
          res.json({
            success: true,
            result: {
              pageNo: pageNo,
              data: result
            }
          })
        });
  })
  // let data = [
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'},
  //   {name: 'x'}
  // ];
  // res.json(data);
});


module.exports = router;

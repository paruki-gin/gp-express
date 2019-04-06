const express = require('express');
const router = express.Router();
const crawlerTest = require('../models/crawler/index');
const request = require('superagent');
const cheerio = require('cheerio');
const Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
const moment = require('moment');

router.get('/getCookie', function(req, res, next) {
  let data = crawlerTest.getCookie();
  res.send(data);
});

router.post('/test', function(req, res, next) {
  const { city, keyword } = req.body;
  console.log('start');
  let data = crawlerTest.requestController(city, keyword);
  res.send(data);
});

router.get('/crawlData', function(req, res, next) {
  let url = "mongodb://localhost:27017/gpbase";
  let menuList = [];
  let urlList = []
  let location = '杭州';

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    let dbo = db.db("gpbase");
    let c = new Crawler({
      preRequest: function(options, done) {
        console.log(options.uri);
        done();
      },
      jQuery: true,
      rateLimit: 25000,
      maxConnections: 1,
      headers:{
        'Cookie':'index_location_city='+encodeURI(location)+';user_trace_token=20181127172617-5d56fc60-618b-4486-9762-21efad3c49df; JSESSIONID=ABAAABAAAFCAAEG70DFEA8B139FF80287ABDF2F4C137946; showExpriedIndex=1; showExpriedCompanyHome=1; showExpriedMyPublish=1; _ga=GA1.2.405959562.1543310779; _gid=GA1.2.577762828.1543310779; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1543310402,1543310779; LGSID=20181127172618-7ef404ed-f226-11e8-80e4-525400f775ce; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2F; LGUID=20181127172618-7ef406c2-f226-11e8-80e4-525400f775ce; _gat=1; TG-TRACK-CODE=index_navigation; SEARCH_ID=88db5c7fa2464090a6dd7041f35074ba; X_HTTP_TOKEN=492369107a1a20441020ab9b771f2f6d; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%221675489482d244-0f3ef5ad6aef94-4313362-2073600-1675489482e36f%22%2C%22%24device_id%22%3A%221675489482d244-0f3ef5ad6aef94-4313362-2073600-1675489482e36f%22%7D; sajssdk_2015_cross_new_user=1; ab_test_random_num=0; _putrc=69D503B669D896FC123F89F2B170EADC; login=true; hasDeliver=0; gate_login_token=33f3414d87f12e09e089b3b6daf10134f0a5ebf49fad63dfd9b8bc4e3a4f162b; unick=hello; LGRID=20181127174101-8d501f2b-f228-11e8-8c21-5254005c3644; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1543311662',
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
      },
      callback : function (error, res, done) {
        if(error){
          console.log(error);
          done();
        }else{
          var $ = res.$;
          var jobArr = []
          console.log($('title').text())
          $('.con_list_item').each(function (idx, item) {
            var $item = $(item);
            let experienceText = $item.find('.p_bot .li_b_l').not('.money').text().replace(/\s+/g,"");
            let industry = $item.find('.industry').text().replace(/\s+/g,"");
            jobArr.push({
              name: $item.find('.position_link').find('h3').text(),
              city: location,
              district: $item.find('.add').find('em').text(),  //地区
              workYear: experienceText.split('/')[0], //经验
              education: experienceText.split('/')[1],  //学历
              companyId: $item.attr('data-companyid'),
              companyName: $item.find('.company_name').find('a').text(),
              companyUrl: $item.find('.company_name').find('a').attr('href'),
              industryField: industry.split('/')[0].split(','), //行业领域
              financeStage: industry.split('/')[1],  //融资
              companySize: industry.split('/')[2],  //规模
              positionId: $item.attr('data-positionid'),
              hrId: $item.attr('data-hrid'),
              detailLink: $item.find('a').attr('href'), //详情链接
              companyLogo: $item.find('.com_logo').find('img').attr('src'),
              salary: $item.find('.money').text(),  //薪资
              industryLables:$item.find('.list_item_bot').find('span').text(), //公司标签
              positionAdvantage:$item.find('.li_b_r').text(), //公司简介
              formatTime: $item.find('.format-time').text(),
              createTime: moment().format("YYYY-MM-DD HH:mm:ss")
            });
          });
          try {
            console.log('c.queueSize',c.queueSize);
            console.log('jobArr',jobArr.length)
            if(jobArr.length > 0 ){
              //保存到数据库中
              dbo.collection("job").insertMany(jobArr, function(err, res) {
                if (err) throw err;
                console.log('job 数据导入成功!');
                // db.close();
              })
            }
            done();
          }catch(e){
            console.log(e);
            done();
          }
        }
      }
    });

    //爬取首页的menu的数据
    c.queue([
      {
        uri: 'https://www.lagou.com/',
        headers:{
          'Set-Cookie':'index_location_city='+encodeURI(location),
          'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
          'JSESSIONID':'ABAAABAAAGFABEFC5E29AF672C4DAF0B10AEE494D83FD62',
          'login':true
        },
        // The global callback won't be called
        callback: function (error, res, done) {
          if (error) {
            console.log(error);
          } else {
            var $ = res.$;
            $('.menu_sub a').each(function (idx, element) {
              var $element = $(element);
              menuList.push({
                name: $element.text(),
                tjId: $element.attr('data-lg-tj-id'),
                // tjIdName:changeName($element.attr('data-lg-tj-id')),
                tjNo:$element.attr('data-lg-tj-no'),
                tjCid:$element.attr('data-lg-tj-cid'),
                link:$element.attr('href'),
              });
              //组装menu前30页的url
              for(var i = 1 ;i<=30 ;i++){
                  urlList.push($element.attr('href')+i+'/');
              }
            });
            //把首页爬取的menu URL数据加入到需要爬取的队列中
            c.queue(urlList);
            console.log(urlList,urlList.length)
            console.log('menuList 共',menuList.length ,'条数据');
            dbo.collection("menu").insertMany(menuList, function(err, res) {
              if (err) throw err;
              console.log('数据导入成功!');
              // db.close();
            })
          }
          done();
        }
    }])
    res.send('ok');
  });
});

module.exports = router;

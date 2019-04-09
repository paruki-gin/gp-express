const express = require('express');
const router = express.Router();
const crawlerTest = require('../models/crawler/index');
const request = require('superagent');
const cheerio = require('cheerio');
const Crawler = require("crawler");
const MongoClient = require('mongodb').MongoClient;
const moment = require('moment');
const superagent = require('superagent');
const fs = require('fs');
const events = require("events");
let  emitter = new events.EventEmitter();

router.get('/getCookie', function(req, res, next) {
  let data = crawlerTest.getCookie();
  res.send(data);
});

router.get('/getList', function(req, res, next) {
  let data = [
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'},
    {name: 'x'}
  ];
  res.json(data);
});


router.get('/stop', function(req, res, next) {
  emitter.emit("stop_crawler");
  res.json({
    'success': 'true',
    'msg': '终止爬虫'
  });
});

router.post('/test', function(req, res, next) {
  const { city, keyword } = req.body;
  console.log('start');
  let data = crawlerTest.requestController(city, keyword);
  res.send(data);
});

router.get('/crawlData', function(req, res, next) {
  let dbAddress = "mongodb://localhost:27017/gpbase";
  let menuList = [];
  let urlList = []
  let location = '杭州';
  let stop = false;
  let maxPage = 30;
  emitter.addListener("stop_crawler",function(){
    stop = true;
  });

  MongoClient.connect(dbAddress, function(err, db) {
    if (err) {
      console.error(err)
      db.close();
    };
    let dbObj = db.db("gpbase");
    let crawler = new Crawler({
      preRequest: function(options, done) {
        options['headers']['Cookie'] = 'index_location_city='+encodeURI(location);
        console.log(options['uri']);
        let page = +options['uri'].split('/')[5];
        if (page > maxPage) {
          console.log('到达页面上限，停止爬取');
          db.close();
          return;
        }
        if (stop) {
          db.close();
          return;
        } else {
          done();
        }
      },
      jQuery: true,
      rateLimit: 24340 + Math.floor(Math.random()*9000)+1000,
      maxConnections: 1,
      headers:{
        'Cookie':'index_location_city='+encodeURI(location)+';user_trace_token=20181127172617-5d56fc60-618b-'+(Math.floor(Math.random()*9000)+1000)+'-'+(Math.floor(Math.random()*9000)+1000)+'-21efad3c49df; JSESSIONID=ABAAABAAAFCAAEG70DFEA8B139FF80287ABDF2F4C137946; showExpriedIndex=1; showExpriedCompanyHome=1; showExpriedMyPublish=1; _ga=GA1.2.405959562.1543310779; _gid=GA1.2.577762828.1543310779; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1543310402,1543310779; LGSID=20181127172618-7ef404ed-f226-11e8-80e4-525400f775ce; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2F; LGUID=20181127172618-7ef406c2-f226-11e8-80e4-525400f775ce; _gat=1; TG-TRACK-CODE=index_navigation; SEARCH_ID=88db5c7fa2464090a6dd7041f35074ba; X_HTTP_TOKEN=492369107a1a20441020ab9b771f2f6d; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%221675489482d244-0f3ef5ad6aef94-4313362-2073600-1675489482e36f%22%2C%22%24device_id%22%3A%221675489482d244-0f3ef5ad6aef94-4313362-2073600-1675489482e36f%22%7D; sajssdk_2015_cross_new_user=1; ab_test_random_num=0; _putrc=69D503B669D896FC123F89F2B170EADC; login=true; hasDeliver=0; gate_login_token=33f3414d87f12e09e089b3b6daf10134f0a5ebf49fad63dfd9b8bc4e3a4f162b; unick=hello; LGRID=20181127174101-8d501f2b-f228-11e8-8c21-5254005c3644; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1543311662',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': '',
        'Host': 'www.lagou.com',
        'Origin': 'https://www.lagou.com',
        'Referer': 'https://www.lagou.com/jobs/list_web?city='+encodeURI(location)+'&cl=false&fromSearch=true&labelWords=&suginput=',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.80 Safari/537.36',
        'Cache-Control': 'max-age=0',
        'X-Anit-Forge-Code': '0',
        'X-Anit-Forge-Token': 'None',
        'X-Requested-With': 'XMLHttpRequest',
      },
      callback : function (error, res, done) {
        if (stop) {
          db.close();
          return;
        }
        try {
          if (error) {
            throw error
          } else {
            let $ = res.$;
            let jobArr = [];
            maxPage = +$('.page-number').find('.totalNum').text();
            $('.con_list_item').each(function (idx, item) {
              let $item = $(item);
              let experience = $item.find('.p_bot').find('.li_b_l').text().replace(/\s+/g,"");
              let experienceText = '';
              if (experience.indexOf('k') > -1) {
                experienceText = experience.split('k')[2];
              } else if (experience.indexOf('K') > -1) {
                experienceText = experience.split('K')[2];
              }
              let industry = $item.find('.industry').text().replace(/\s+/g,"");
              let district = $item.find('.add').find('em').text();
              let city = '', area = '';
              if (district.indexOf('·') > -1) {
                city = district.split('·')[0];
                area = district.split('·')[1];
              } else {
                city = location;
                area = district;
              }
              let industryLables = [];
              $item.find('.list_item_bot').find('.li_b_l').find('span').each(function(){industryLables.push($(this).text())});
              jobArr.push({
                name: $item.find('.position_link').find('h3').text(),
                // city: location,
                // district: $item.find('.add').find('em').text(),  //地区
                city: city,
                area: area,
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
                companyLogo: 'https:'+$item.find('.com_logo').find('img').attr('src'),
                salary: $item.find('.money').text(),  //薪资
                industryLables: industryLables, //公司标签
                positionAdvantage:$item.find('.li_b_r').text().replace(/^\“|\”$/g,''), //公司简介
                formatTime: $item.find('.format-time').text(),
                createTime: Date.parse(new Date())+'',
                status: 1,  //状态 初始1-生效
                isComplete: 0 //信息是否完整 初始0-不完整
              });
            });
            console.log(`total page ${crawler.queueSize}`);
            console.log(`pageSize ${jobArr.length}`);
            if (jobArr.length === 0) {
              console.error('无数据, 停止爬取');
              return;
            }
            if(jobArr.length > 0 ){
              for (let i = 0; i < jobArr.length; i++) {
                new Promise((resolve, reject) => {
                  dbObj.collection("job").find({'positionId': jobArr[i]['positionId']}).count(function (err, result) {
                    if (err) {
                      reject();
                    }
                    resolve(result);
                  });
                }).then((result) => {
                  if (result == 0) {
                    dbObj.collection("job").insert(jobArr[i], function(err, res) {
                      if (err) throw err;
                    })
                  } else {
                    console.log(`update ${jobArr[i]['positionId']}`);
                    dbObj.collection("job").update(jobArr[i], jobArr[i], function(err, res) {
                      if (err) throw err;
                    })
                  }
                });
              }
              console.log('job表写入成功');
              //保存到数据库中
              // dbObj.collection("job").updateMany(jobArr, {'$set':jobArr},{upsert:true},function(err, res) {
              //   if (err) throw err;
              //   console.log('职位数据写入成功');
              // })
            }
            done();
          }
        } catch (e) {
          console.log(e);
          done();
          db.close();
        }
      }
    });

    //爬取首页的menu的数据
    crawler.queue([
      {
        uri: 'https://www.lagou.com/',
        headers:{
          'Set-Cookie':'index_location_city='+encodeURI(location),
          'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
          'JSESSIONID':'ABAAABAAAGFABEFC5E29AF672C4DAF0B10AEE494D83FD62',
          'login':true
        },
        callback: function (error, res, done) {
          if (stop) {
            db.close();
            return;
          }
          try {
            if (error) {
              throw error
            } else {
              let $ = res.$;
              $('.menu_sub a').each(function (idx, element) {
                let $element = $(element);
                menuList.push({
                  name: $element.text(),
                  tjId: $element.attr('data-lg-tj-id'),
                  tjNo:$element.attr('data-lg-tj-no'),
                  tjCid:$element.attr('data-lg-tj-cid'),
                  link:$element.attr('href'),
                });
                //组装menu前30页的url
                for(let i = 1; i <= 30 ;i++){
                  urlList.push($element.attr('href')+i+'/');
                }
              });
              //把首页爬取的menu URL数据加入到需要爬取的队列中
              crawler.queue(urlList);
              console.log(`菜单项总数 ${menuList.length}`);
              console.log(urlList);
              console.log(`URL总数 ${urlList.length}`);
              for (let i = 0; i < menuList.length; i++) {
                dbObj.collection("menu").update(menuList[i], menuList[i], {upsert:true}, function(err, res) {
                  if (err) throw err;
                  // db.close();
                })
              }
              console.log('menu表写入成功');
              // dbObj.collection("menu").updateMany(menuList, {'$set':menuList},{upsert:true}, function(err, res) {
              //   if (err) throw err;
              //   console.log('menu表写入成功');
              //   // db.close();
              // })
            }
            done();
          } catch (e) {
            console.error(e);
            done();
            db.close();
          }
        }
    }])
    res.json({
      'success': 'true',
      'msg': '爬虫执行中'
    });
  });
});

router.post('/bossZP', function(req, res, next) {
  let city = '杭州';
  let query = '前端';
  superagent
    .get("https://www.zhipin.com/job_detail/?city=100010000&source=10&query="+encodeURI(query))
    .end((error,response)=>{
        var content = response.text;
        var $ = cheerio.load(content);
        var result=[];
        //分析文档结构  先获取每个li 再遍历里面的内容(此时每个li里面就存放着我们想要获取的数据)
        $(".job-list li .job-primary").each((index,value)=>{
            //地址和类型为一行显示，需要用到字符串截取
            //地址
            let address=$(value).find(".info-primary").children().eq(1).html();
            //类型
            let type=$(value).find(".info-company p").html();
            //解码
            address=unescape(address.replace(/&#x/g,'%u').replace(/;/g,''));
            type=unescape(type.replace(/&#x/g,'%u').replace(/;/g,''))
            //字符串截取
            let addressArr=address.split('<em class="vline"></em>');
            let typeArr=type.split('<em class="vline"></em>');
            //将获取的数据以对象的形式添加到数组中
            result.push({
              title:$(value).find(".name .job-title").text(),
              money:$(value).find(".name .red").text(),
              address:addressArr,
              company:$(value).find(".info-company a").text(),
              type:typeArr,
              position:$(value).find(".info-publis .name").text(),
              txImg:$(value).find(".info-publis img").attr("src"),
              time:$(value).find(".info-publis p").text()
            });
            // console.log(typeof $(value).find(".info-primary").children().eq(1).html());
        });
        //将数组转换成字符串
        result=JSON.stringify(result);
        //将数组输出到json文件里  刷新目录 即可看到当前文件夹多出一个boss.json文件(打开boss.json文件，ctrl+A全选之后 ctrl+K，再Ctrl+F即可将json文件自动排版)
        fs.writeFile("boss.json",result,"utf-8",(error)=>{
            //监听错误，如正常输出，则打印null
            if(error==null){
                console.log("success");
            }
        });
    });
    res.json({'success': 'true'});
});

module.exports = router;

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
const dbAddress = require("../config/index");
const myDb = require('../utils/db');
let emitter = new events.EventEmitter();

function insertCrawlerLog(dbObj, msg, status) {
  dbObj.collection("crawlerLog").insert({
    msg: msg,
    time: new Date().getTime()+'',
    status: status
  }, function(err, res) {
    if (err) throw err;
  })
}

router.get('/stop', function(req, res, next) {
  emitter.emit("stop_crawler");
  myDb.connect().then(dbObj => {
    insertCrawlerLog(dbObj, `停止爬取操作`, 0);
  })
  res.json({
    'success': 'true',
    'msg': '终止爬虫'
  });
});

router.get('/getMenuList', function(req, res, next) {
  myDb.connect().then(dbObj => {
    dbObj.collection("menu").find({}, {name: 1}).toArray(function(err, result) {
      if (err) {
        res.json({
          success: false
        })
        throw err;
      }
      res.json({
        success: true,
        result
      })
    })
  })
});

router.post('/crawlJobData', function(req, res, next) {
  let location = '';
  let stop = false;
  let maxPage = 30;
  let menuNameArr = [];
  location = req['body']['city'];
  menuNameArr = req['body']['categoryList'];
  emitter.addListener("stop_crawler",function() {
    console.log('stop!');
    stop = true;
  });

  myDb.connect().then(dbObj => {
    let urlList = [];
    dbObj.collection("menu")
      .find({"name":{"$in":menuNameArr}})
      .toArray()
      .then((res)=>{
        res.forEach((curr, index, arr) => {
          for(let i = 1; i <= 30 ;i++){
            urlList.push(curr.link+i+'/');
          }
        })
        console.log('URLList',urlList)
        insertCrawlerLog(dbObj, `开始 URL总数 ${urlList.length}`, 1);
        console.log(`URL总数 ${urlList.length}`)
        // crawler.queue(urlList);
      })
      .then(() => {
        let currCategory = '';
        let crawler = new Crawler({
          preRequest: function(options, done) {
            options['headers']['Cookie'] = 'index_location_city='+encodeURI(location);
            if (!stop) {
              insertCrawlerLog(dbObj, `当前url ${options['uri']}`, 1);
            }
            let page = +options['uri'].split('/')[5];
            dbObj.collection("menu")
              .findOne({'link': {$regex: options['uri'].split('/')[4]}})
              .then((res) => {
                currCategory = res.name;
              });
            if (page > maxPage) {
              console.log('达到页面上限');
              insertCrawlerLog(dbObj, `达到页面上限 终止爬取`, 0);
              return;
            }
            if (stop) {
              insertCrawlerLog(dbObj, `终止爬取`, 0);
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
              return;
            }
            // if (error) {
            //   done();
            // }
            try {
              if (error) {
                // throw error
                return;
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
                  //城市 地区
                  let city = '', area = '';
                  if (district.indexOf('·') > -1) {
                    city = district.split('·')[0];
                    area = district.split('·')[1];
                  } else {
                    city = location;
                    area = district;
                  }
                  //公司标签
                  let industryLables = [];
                  $item.find('.list_item_bot').find('.li_b_l').find('span').each(function(){industryLables.push($(this).text())});
                  //发布时间
                  let formatTimeText = $item.find('.format-time').text();
                  let formatTime = '';
                  if (formatTimeText.indexOf('发布') > -1) {
                    if (formatTimeText.indexOf('前') > -1) {
                      let daysAgo = +formatTimeText.substr(0,1);
                      formatTime = new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000
                    } else {
                      let time = formatTimeText.substr(0,5);
                      formatTime = moment(`${moment().format('YYYY-MM-DD')} ${time}`).valueOf();
                    }
                  } else {
                    formatTime = moment(formatTimeText).valueOf();
                  }
                  //经验
                  let workYearStr = experienceText.split('/')[0];
                  let workYear = '';
                  if (workYearStr === '经验应届毕业生') {
                    workYear = '0';
                  } else if (workYearStr === '经验1年以下') {
                    workYear = '1';
                  } else if (workYearStr === '经验1-3年') {
                    workYear = '2';
                  } else if (workYearStr === '经验3-5年') {
                    workYear = '3';
                  } else if (workYearStr === '经验5-10年') {
                    workYear = '4';
                  } else if (workYearStr === '经验10年以上') {
                    workYear = '5';
                  } else if (workYearStr === '经验不限') {
                    workYear = '6';
                  }
                  //融资
                  let financeStageStr = industry.split('/')[1];
                  let financeStage = '';
                  if (financeStageStr === '未融资') {
                    financeStage = '0';
                  } else if (financeStageStr === '天使轮') {
                    financeStage = '1';
                  } else if (financeStageStr === 'A轮') {
                    financeStage = '2';
                  } else if (financeStageStr === 'B轮') {
                    financeStage = '3';
                  } else if (financeStageStr === 'C轮') {
                    financeStage = '4';
                  } else if (financeStageStr === 'D轮及以上') {
                    financeStage = '5';
                  } else if (financeStageStr === '上市公司') {
                    financeStage = '6';
                  } else if (financeStageStr === '不需要融资') {
                    financeStage = '7';
                  }
                  //规模
                  let companySizeStr = industry.split('/')[2];
                  let companySize = '';
                  if (companySizeStr === '少于15人') {
                    companySize = '0';
                  } else if (companySizeStr === '15-50人') {
                    companySize = '1';
                  } else if (companySizeStr === '50-150人') {
                    companySize = '2';
                  } else if (companySizeStr === '150-500人') {
                    companySize = '3';
                  } else if (companySizeStr === '500-2000人') {
                    companySize = '4';
                  } else if (companySizeStr === '2000人以上') {
                    companySize = '5';
                  }
                  //月薪
                  let salaryStr = $item.find('.money').text();
                  let salaryArr = salaryStr.replace(/[kK]/g,'').split('-');
                  let salaryMin = salaryArr[0];
                  let salaryMax = salaryArr[1];
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

                  jobArr.push({
                    name: $item.find('.position_link').find('h3').text(),
                    category: currCategory,
                    city: city,
                    area: area,
                    workYear: workYear, //经验
                    education: experienceText.split('/')[1],  //学历
                    companyId: $item.attr('data-companyid'),
                    companyName: $item.find('.company_name').find('a').text(),
                    companyUrl: $item.find('.company_name').find('a').attr('href'),
                    industryField: industry.split('/')[0].split(/\s|,/), //行业领域
                    financeStage: financeStage,  //融资
                    companySize: companySize,  //规模
                    positionId: $item.attr('data-positionid'),
                    hrId: $item.attr('data-hrid'),
                    detailLink: $item.find('a').attr('href'), //详情链接
                    companyLogo: 'https:'+$item.find('.com_logo').find('img').attr('src'),
                    salary: $item.find('.money').text(),  //薪资
                    salaryMin: salaryMin,
                    salaryMax: salaryMax,
                    salaryStage: salaryStage,
                    industryLables: industryLables, //公司标签
                    positionAdvantage:$item.find('.li_b_r').text().replace(/^\“|\”$/g,''), //公司简介
                    formatTime: formatTime+'',
                    // createTime: (new Date()).valueOf()+'',
                    // updateTime: (new Date()).valueOf()+'',
                    status: 1,  //状态 初始1-生效
                    isComplete: 0 //信息是否完整 初始0-不完整
                  });
                });
                console.log(`total page ${crawler.queueSize}`);
                console.log(`pageSize ${jobArr.length}`);
                insertCrawlerLog(dbObj, `total page ${crawler.queueSize}`, 1);
                insertCrawlerLog(dbObj, `pageSize ${jobArr.length}`, 1);
                if (jobArr.length === 0) {
                  console.log('无数据, 停止爬取');
                  insertCrawlerLog(dbObj, '无数据, 停止爬取', 0)
                  return;
                }
                if (crawler.queueSize === 0) {
                  console.log('爬取结束');
                  insertCrawlerLog(dbObj, 'Url清空 爬取结束', 0)
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
                        dbObj.collection("job").insert({
                          ...jobArr[i],
                          createTime: (new Date()).valueOf()+'',
                          updateTime: (new Date()).valueOf()+''
                        }, function(err, res) {
                          if (err) throw err;
                          insertCrawlerLog(dbObj, `insert ${jobArr[i]['positionId']}`, 1)
                        })
                      } else {
                        // dbObj.collection("job").update(jobArr[i], jobArr[i], function(err, res) {
                        //   if (err) throw err;
                        //   insertCrawlerLog(dbObj, `update ${jobArr[i]['positionId']}`)
                        // })
                        dbObj.collection("job").update({positionId: jobArr[i]['positionId']}, {
                          $set: {
                            ...jobArr[i],
                            updateTime: (new Date()).valueOf()+''
                          }
                        }, function(err, res) {
                          if (err) throw err;
                          insertCrawlerLog(dbObj, `update ${jobArr[i]['positionId']}`, 1)
                        })
                      }
                    });
                  }
                  console.log('job表写入成功')
                  insertCrawlerLog(dbObj, 'job表写入成功', 1)
                }
                done();
              }
            } catch (e) {
              console.log(e);
              done();
            }
          }
        });
        crawler.queue(urlList);
      })
      .catch((e) =>{
        console.error(e)
        insertCrawlerLog(dbObj, `错误 ${e}`, 0);
      })
    res.json({
      'success': 'true',
      'msg': '爬取职位信息中...'
    });
  });
});

router.get('/crawlMenuData', function(req, res, next) {
  let menuList = [];
  let urlList = []
  let location = '杭州';
  let stop = false;
  // let maxPage = 30;
  emitter.addListener("stop_crawler",function(){
    stop = true;
  });

  myDb.connect().then(dbObj => {
    let crawler = new Crawler();
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
              // crawler.queue(urlList);
              // insertCrawlerLog(dbObj, `菜单项总数 ${menuList.length}`);
              // insertCrawlerLog(dbObj, `URLList ${urlList}`);
              // insertCrawlerLog(dbObj, `URL总数 ${urlList.length}`);
              for (let i = 0; i < menuList.length; i++) {
                dbObj.collection("menu").update(menuList[i], menuList[i], {upsert:true}, function(err, res) {
                  if (err) throw err;
                })
              }
              // insertCrawlerLog(dbObj, 'menu表写入成功');
            }
            done();
          } catch (e) {
            console.error(e);
            // insertCrawlerLog(dbObj, `${e}`);
            done();
          }
        }
    }])
    res.json({
      'success': 'true',
      'msg': '爬取菜单分类信息中...'
    });
  });
});


router.post('/bossZP', function(req, res, next) {
  let query = 'JAVA';
  superagent
    .get("https://www.zhipin.com/job_detail/?city=101020100&industry=&position=&query="+encodeURI(query))
    .end((error,response)=>{
        var content = response.text;
        var $ = cheerio.load(content);
        var result=[];
        $(".job-list li .job-primary").each((index,value)=>{
            let address=$(value).find(".info-primary").children().eq(1).html();
            let type=$(value).find(".info-company p").html();
            address=unescape(address.replace(/&#x/g,'%u').replace(/;/g,''));
            type=unescape(type.replace(/&#x/g,'%u').replace(/;/g,''))
            let addressArr=address.split('<em class="vline"></em>');
            let typeArr=type.split('<em class="vline"></em>');
            let education = addressArr[2];
            //领域
            let industryField = [typeArr[0]];
            let industryLables = [typeArr[0]];
            //经验
            let workYearStr = addressArr[1];
            let workYear = '';
            if (workYearStr == '应届生') {
              workYear = '0';
            } else if (workYearStr == '1年以内') {
              workYear = '1';
            } else if (workYearStr == '1-3年') {
              workYear = '2';
            } else if (workYearStr == '3-5年') {
              workYear = '3';
            } else if (workYearStr == '5-10年') {
              workYear = '4';
            } else if (workYearStr == '10年以上') {
              workYear = '5';
            } else if (workYearStr == '经验不限') {
              workYear = '6';
            }
            //融资
            let financeStageStr = typeArr[1];
            let financeStage = '';
            if (financeStageStr == '未融资') {
              financeStage = '0';
            } else if (financeStageStr == '天使轮') {
              financeStage = '1';
            } else if (financeStageStr == 'A轮') {
              financeStage = '2';
            } else if (financeStageStr == 'B轮') {
              financeStage = '3';
            } else if (financeStageStr == 'C轮') {
              financeStage = '4';
            } else if (financeStageStr == 'D轮及以上') {
              financeStage = '5';
            } else if (financeStageStr == '已上市') {
              financeStage = '6';
            } else if (financeStageStr == '不需要融资') {
              financeStage = '7';
            }
            //规模
            let companySizeStr = typeArr[2];
            let companySize = '';
            if (companySizeStr == '0-20人') {
              companySize = '6';
            } else if (companySizeStr == '20-99人') {
              companySize = '7';
            } else if (companySizeStr == '100-499人') {
              companySize = '8';
            } else if (companySizeStr == '500-999人') {
              companySize = '9';
            } else if (companySizeStr == '1000-9999人') {
              companySize = '10';
            } else if (companySizeStr == '10000人以上') {
              companySize = '11';
            }
            result.push({
              name:$(value).find(".name .job-title").text(),
              salary:$(value).find(".name .red").text(),
              workAddr:addressArr[0],
              companyName:$(value).find(".info-company a").text(),
              positionId: new Date().valueOf()+((Math.random()*100)+1)+'',
              // type:typeArr,
              // hr:$(value).find(".info-publis .name").text(),
              companyLogo:$(value).find(".info-publis img").attr("src"),
              createTime:new Date().valueOf()+'',
              update:new Date().valueOf()+'',
              formatTime:new Date().valueOf()+'',
              status: 1,
              isComplete: 0,
              workYear: workYear,
              city: addressArr[0].split(' ')[0],
              area: addressArr[0].split(' ')[1] || addressArr[0].split(' ')[0],
              companySize: companySize,
              // companySizeStr: companySizeStr,
              financeStage: financeStage,
              education: education,
              industryField: industryField,
              industryLables: industryLables
            });
            myDb.connect().then(dbObj => {
            if(result.length > 0 ){
              dbObj.collection("job").insertMany(result).then((rr) => {
                console.log(rr);
              })
            }
          })
        });
        // let data = result.toString.replace(/\\/g, '')
        // let resData =JSON.stringify(data);
        res.json({
          'success': 'true',
          'result': result
        });
    });
    
});

module.exports = router;

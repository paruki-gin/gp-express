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
let  emitter = new events.EventEmitter();

function insertCrawlerLog(dbObj, msg) {
  dbObj.collection("crawlerLog").insert({
    msg: msg,
    time: new Date().getTime()+''
  }, function(err, res) {
    if (err) throw err;
  })
}

// router.get('/getCookie', function(req, res, next) {
//   let data = crawlerTest.getCookie();
//   res.send(data);
// });

router.get('/stop', function(req, res, next) {
  emitter.emit("stop_crawler");
  MongoClient.connect(dbAddress, function(err, db) {
    let dbObj = db.db("gpbase");
    insertCrawlerLog(dbObj, `停止爬取操作`);
  })
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

router.get('/ttt', function(req, res, next) {
  MongoClient.connect(dbAddress, function(err, db) {
    let dbObj = db.db("gpbase");
    // let test = dbObj.collection("menu").findOne({'link': 'https://www.lagou.com/zhaopin/caiwuzongjianjingli/'});
    // test.then((res) => {
    //   console.log('res', res.name);
    // })
    dbObj.collection("job").updateOne({positionId: '5228283'}, {
      $set: {
        jobDetail: `        <p>岗位职责：</p>
        <p>1.协助财务总监管理财务中心内部各项事务，协调处理内部及外部的关系，对财务总监负责，领导下属依法开展财会工作。</p>
        <p>2.组织公司下属部门公司的财务管理、应收账款方面工作，合理筹划收入与应收款项、预收账款的管理，监督资金收入的合法及完整性，提高资金利用率。</p>
        <p>3.组织配合绩效管理体系，制定财务内部相关指标，负责下属的绩效考核，并组织下属按要求完成各项任务指标。</p>
        <p>4.对票据、凭证的真伪予以鉴别，对不合理票据、虚假票据、凭证进行监督和控制。</p>
        <p>5.组织制定本部门年度及季度财务预算。</p>
        <p>6.根据发展需要，协助财务总监对财务管理工作进行研究、布置、检查、总结，并不断改进和完善。</p>
        <p>7.参与经营决策，组织开展各项经济分析活动，为公司领导提供经济预测和经营决策依据。</p>
        <p>8.参与制订公司年度总预算和季度预算调整，协助财务总监汇总、审核下级部门上报的月度预算，负责审核签署公司预算、财务收入计划、成本费用计划、会计决算报表。</p>
        <p>9.负责重要内审活动的组织与实施。</p>
        <p>10.组织审查或参与拟定经济合同、协议等经济文件，按财务管理要求做好各项合同的收款管理。</p>
        <p><br></p>
        <p>岗位要求：</p>
        <p>1.拥有5年以上财务或3年以上财务主管工作经验；</p>
        <p>2.性别不限，财务管理或会计专业本科以上学历；</p>
        <p>3.拥有中级职称或具有上市公司财务工作经验者优先；</p>
        <p>4.为人正直、责任心强、作风严谨、工作仔细认真，有较强的沟通协调及团队管理能力。</p>`
      }
    }).then((res) => {
      console.log('ok');
    })
  })
})

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

  MongoClient.connect(dbAddress, function(err, db) {
    if (err) {
      console.error(err)
      db.close();
    };
    let dbObj = db.db("gpbase");
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
        insertCrawlerLog(dbObj, `URL总数 ${urlList.length}`);
        console.log(`URL总数 ${urlList.length}`)
        // crawler.queue(urlList);
      })
      .then(() => {
        let currCategory = '';
        let crawler = new Crawler({
          preRequest: function(options, done) {
            options['headers']['Cookie'] = 'index_location_city='+encodeURI(location);
            insertCrawlerLog(dbObj, `当前url ${options['uri']}`);
            let page = +options['uri'].split('/')[5];
            dbObj.collection("menu")
              .findOne({'link': {$regex: options['uri'].split('/')[4]}})
              .then((res) => {
                currCategory = res.name;
              });
            if (page > maxPage) {
              console.log('达到页面上限');
              insertCrawlerLog(dbObj, '达到页面上限');
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

                  jobArr.push({
                    name: $item.find('.position_link').find('h3').text(),
                    category: currCategory,
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
                    formatTime: formatTime+'',
                    createTime: Date.parse(new Date())+'',
                    status: 1,  //状态 初始1-生效
                    isComplete: 0 //信息是否完整 初始0-不完整
                  });
                });
                console.log(`total page ${crawler.queueSize}`);
                console.log(`pageSize ${jobArr.length}`);
                insertCrawlerLog(dbObj, `total page ${crawler.queueSize}`);
                insertCrawlerLog(dbObj, `pageSize ${jobArr.length}`);
                if (jobArr.length === 0) {
                  console.log('无数据, 停止爬取');
                  insertCrawlerLog(dbObj, '无数据, 停止爬取')
                  return;
                }
                if (crawler.queueSize === 0) {
                  console.log('爬取结束');
                  insertCrawlerLog(dbObj, '爬取结束')
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
                          insertCrawlerLog(dbObj, `insert ${jobArr[i]['positionId']}`)
                        })
                      } else {
                        // dbObj.collection("job").update(jobArr[i], jobArr[i], function(err, res) {
                        //   if (err) throw err;
                        //   insertCrawlerLog(dbObj, `update ${jobArr[i]['positionId']}`)
                        // })
                        dbObj.collection("job").update({positionId: jobArr[i]['positionId']}, {
                          $set: jobArr[i]
                        }, function(err, res) {
                          if (err) throw err;
                          insertCrawlerLog(dbObj, `update ${jobArr[i]['positionId']}`)
                        })
                      }
                    });
                  }
                  console.log('job表写入成功')
                  insertCrawlerLog(dbObj, 'job表写入成功')
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
        crawler.queue(urlList);
      })
      .catch((e) =>{
        console.error(e)
        insertCrawlerLog(dbObj, `${e}`);
        db.close();
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

  MongoClient.connect(dbAddress, function(err, db) {
    if (err) {
      console.error(err)
      db.close();
    };
    let dbObj = db.db("gpbase");
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
              // crawler.queue(urlList);
              insertCrawlerLog(dbObj, `菜单项总数 ${menuList.length}`);
              // insertCrawlerLog(dbObj, `URLList ${urlList}`);
              // insertCrawlerLog(dbObj, `URL总数 ${urlList.length}`);
              for (let i = 0; i < menuList.length; i++) {
                dbObj.collection("menu").update(menuList[i], menuList[i], {upsert:true}, function(err, res) {
                  if (err) throw err;
                })
              }
              insertCrawlerLog(dbObj, 'menu表写入成功');
            }
            done();
          } catch (e) {
            console.error(e);
            insertCrawlerLog(dbObj, `${e}`);
            done();
            db.close();
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

// router.get('/crawlJobData', function(req, res, next) {
//   let menuList = [];
//   let urlList = []
//   let location = '杭州';
//   let stop = false;
//   let maxPage = 30;
//   emitter.addListener("stop_crawler",function(){
//     stop = true;
//   });

//   MongoClient.connect(dbAddress, function(err, db) {
//     if (err) {
//       console.error(err)
//       db.close();
//     };
//     let dbObj = db.db("gpbase");
//     let crawler = new Crawler({
//       preRequest: function(options, done) {
//         options['headers']['Cookie'] = 'index_location_city='+encodeURI(location);
//         console.log(options['uri']);
//         let page = +options['uri'].split('/')[5];
//         if (page > maxPage) {
//           insertCrawlerLog(dbObj, '达到页面上限，停止爬取')
//           db.close();
//           return;
//         }
//         if (stop) {
//           db.close();
//           return;
//         } else {
//           done();
//         }
//       },
//       jQuery: true,
//       rateLimit: 24340 + Math.floor(Math.random()*9000)+1000,
//       maxConnections: 1,
//       headers:{
//         'Cookie':'index_location_city='+encodeURI(location)+';user_trace_token=20181127172617-5d56fc60-618b-'+(Math.floor(Math.random()*9000)+1000)+'-'+(Math.floor(Math.random()*9000)+1000)+'-21efad3c49df; JSESSIONID=ABAAABAAAFCAAEG70DFEA8B139FF80287ABDF2F4C137946; showExpriedIndex=1; showExpriedCompanyHome=1; showExpriedMyPublish=1; _ga=GA1.2.405959562.1543310779; _gid=GA1.2.577762828.1543310779; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1543310402,1543310779; LGSID=20181127172618-7ef404ed-f226-11e8-80e4-525400f775ce; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2F; LGUID=20181127172618-7ef406c2-f226-11e8-80e4-525400f775ce; _gat=1; TG-TRACK-CODE=index_navigation; SEARCH_ID=88db5c7fa2464090a6dd7041f35074ba; X_HTTP_TOKEN=492369107a1a20441020ab9b771f2f6d; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%221675489482d244-0f3ef5ad6aef94-4313362-2073600-1675489482e36f%22%2C%22%24device_id%22%3A%221675489482d244-0f3ef5ad6aef94-4313362-2073600-1675489482e36f%22%7D; sajssdk_2015_cross_new_user=1; ab_test_random_num=0; _putrc=69D503B669D896FC123F89F2B170EADC; login=true; hasDeliver=0; gate_login_token=33f3414d87f12e09e089b3b6daf10134f0a5ebf49fad63dfd9b8bc4e3a4f162b; unick=hello; LGRID=20181127174101-8d501f2b-f228-11e8-8c21-5254005c3644; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1543311662',
//         'Accept': 'application/json, text/javascript, */*; q=0.01',
//         'Accept-Encoding': 'gzip, deflate, br',
//         'Accept-Language': 'zh-CN,zh;q=0.9',
//         'Connection': 'keep-alive',
//         'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
//         'Cookie': '',
//         'Host': 'www.lagou.com',
//         'Origin': 'https://www.lagou.com',
//         'Referer': 'https://www.lagou.com/jobs/list_web?city='+encodeURI(location)+'&cl=false&fromSearch=true&labelWords=&suginput=',
//         'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.80 Safari/537.36',
//         'Cache-Control': 'max-age=0',
//         'X-Anit-Forge-Code': '0',
//         'X-Anit-Forge-Token': 'None',
//         'X-Requested-With': 'XMLHttpRequest',
//       },
//       callback : function (error, res, done) {
//         if (stop) {
//           db.close();
//           return;
//         }
//         try {
//           if (error) {
//             throw error
//           } else {
//             let $ = res.$;
//             let jobArr = [];
//             maxPage = +$('.page-number').find('.totalNum').text();
//             $('.con_list_item').each(function (idx, item) {
//               let $item = $(item);
//               let experience = $item.find('.p_bot').find('.li_b_l').text().replace(/\s+/g,"");
//               let experienceText = '';
//               if (experience.indexOf('k') > -1) {
//                 experienceText = experience.split('k')[2];
//               } else if (experience.indexOf('K') > -1) {
//                 experienceText = experience.split('K')[2];
//               }
//               let industry = $item.find('.industry').text().replace(/\s+/g,"");
//               let district = $item.find('.add').find('em').text();
//               //城市 地区
//               let city = '', area = '';
//               if (district.indexOf('·') > -1) {
//                 city = district.split('·')[0];
//                 area = district.split('·')[1];
//               } else {
//                 city = location;
//                 area = district;
//               }
//               //公司标签
//               let industryLables = [];
//               $item.find('.list_item_bot').find('.li_b_l').find('span').each(function(){industryLables.push($(this).text())});
//               //发布时间
//               let formatTimeText = $item.find('.format-time').text();
//               let formatTime = '';
//               if (formatTimeText.indexOf('发布') > -1) {
//                 if (formatTimeText.indexOf('前') > -1) {
//                   let daysAgo = +formatTimeText.substr(0,1);
//                   formatTime = new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000
//                 } else {
//                   let time = formatTimeText.substr(0,5);
//                   formatTime = moment(`${moment().format('YYYY-MM-DD')} ${time}`).valueOf();
//                 }
//               } else {
//                 formatTime = moment(formatTimeText).valueOf();
//               }

//               jobArr.push({
//                 name: $item.find('.position_link').find('h3').text(),
//                 city: city,
//                 area: area,
//                 workYear: experienceText.split('/')[0], //经验
//                 education: experienceText.split('/')[1],  //学历
//                 companyId: $item.attr('data-companyid'),
//                 companyName: $item.find('.company_name').find('a').text(),
//                 companyUrl: $item.find('.company_name').find('a').attr('href'),
//                 industryField: industry.split('/')[0].split(','), //行业领域
//                 financeStage: industry.split('/')[1],  //融资
//                 companySize: industry.split('/')[2],  //规模
//                 positionId: $item.attr('data-positionid'),
//                 hrId: $item.attr('data-hrid'),
//                 detailLink: $item.find('a').attr('href'), //详情链接
//                 companyLogo: 'https:'+$item.find('.com_logo').find('img').attr('src'),
//                 salary: $item.find('.money').text(),  //薪资
//                 industryLables: industryLables, //公司标签
//                 positionAdvantage:$item.find('.li_b_r').text().replace(/^\“|\”$/g,''), //公司简介
//                 formatTime: formatTime,
//                 createTime: Date.parse(new Date())+'',
//                 status: 1,  //状态 初始1-生效
//                 isComplete: 0 //信息是否完整 初始0-不完整
//               });
//             });
//             insertCrawlerLog(dbObj, `total page ${crawler.queueSize}`);
//             insertCrawlerLog(dbObj, `pageSize ${jobArr.length}`);
//             if (jobArr.length === 0) {
//               insertCrawlerLog(dbObj, '无数据, 停止爬取')
//               return;
//             }
//             if(jobArr.length > 0 ){
//               for (let i = 0; i < jobArr.length; i++) {
//                 new Promise((resolve, reject) => {
//                   dbObj.collection("job").find({'positionId': jobArr[i]['positionId']}).count(function (err, result) {
//                     if (err) {
//                       reject();
//                     }
//                     resolve(result);
//                   });
//                 }).then((result) => {
//                   if (result == 0) {
//                     dbObj.collection("job").insert(jobArr[i], function(err, res) {
//                       if (err) throw err;
//                       insertCrawlerLog(dbObj, `insert ${jobArr[i]['positionId']}`)
//                     })
//                   } else {
//                     // dbObj.collection("job").update(jobArr[i], jobArr[i], function(err, res) {
//                     //   if (err) throw err;
//                     //   insertCrawlerLog(dbObj, `update ${jobArr[i]['positionId']}`)
//                     // })
//                     dbObj.collection("job").update({positionId: jobArr[i]['positionId']}, {
//                       $set: jobArr[i]
//                     }, function(err, res) {
//                       if (err) throw err;
//                       insertCrawlerLog(dbObj, `update ${jobArr[i]['positionId']}`)
//                     })
//                   }
//                 });
//               }
//               insertCrawlerLog(dbObj, 'job表写入成功')
//             }
//             done();
//           }
//         } catch (e) {
//           console.log(e);
//           done();
//           db.close();
//         }
//       }
//     });

//     //爬取首页的menu的数据
//     crawler.queue([
//       {
//         uri: 'https://www.lagou.com/',
//         headers:{
//           'Set-Cookie':'index_location_city='+encodeURI(location),
//           'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
//           'JSESSIONID':'ABAAABAAAGFABEFC5E29AF672C4DAF0B10AEE494D83FD62',
//           'login':true
//         },
//         callback: function (error, res, done) {
//           if (stop) {
//             db.close();
//             return;
//           }
//           try {
//             if (error) {
//               throw error
//             } else {
//               let $ = res.$;
//               $('.menu_sub a').each(function (idx, element) {
//                 let $element = $(element);
//                 menuList.push({
//                   name: $element.text(),
//                   tjId: $element.attr('data-lg-tj-id'),
//                   tjNo:$element.attr('data-lg-tj-no'),
//                   tjCid:$element.attr('data-lg-tj-cid'),
//                   link:$element.attr('href'),
//                 });
//                 //组装menu前30页的url
//                 for(let i = 1; i <= 30 ;i++){
//                   urlList.push($element.attr('href')+i+'/');
//                 }
//               });
//               //把首页爬取的menu URL数据加入到需要爬取的队列中
//               crawler.queue(urlList);
//               insertCrawlerLog(dbObj, `菜单项总数 ${menuList.length}`);
//               insertCrawlerLog(dbObj, `URLList ${urlList}`);
//               insertCrawlerLog(dbObj, `URL总数 ${urlList.length}`);
//               for (let i = 0; i < menuList.length; i++) {
//                 dbObj.collection("menu").update(menuList[i], menuList[i], {upsert:true}, function(err, res) {
//                   if (err) throw err;
//                   // db.close();
//                 })
//               }
//               insertCrawlerLog(dbObj, 'menu表写入成功');
//               // dbObj.collection("menu").updateMany(menuList, {'$set':menuList},{upsert:true}, function(err, res) {
//               //   if (err) throw err;
//               //   console.log('menu表写入成功');
//               //   // db.close();
//               // })
//             }
//             done();
//           } catch (e) {
//             console.error(e);
//             done();
//             db.close();
//           }
//         }
//     }])
//     res.json({
//       'success': 'true',
//       'msg': '爬取职位信息中...'
//     });
//   });
// });

module.exports = router;

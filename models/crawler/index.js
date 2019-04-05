var async = require('async');
var superagent = require('superagent');
var fs = require('fs');
var getQueryString = require('/utils/getQuery');
var testSearchQuery = require('/config/testSearchQuery');

//并发数量
var num = 0;

var options = {
  'Host': 'www.lagou.com',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': 1,
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate,sdch, br',
  'Accept-Language': 'zh-CN,zh;q=0.8',
  // 'Cookie': 'user_trace_token=20170603162959-264ab0a065f644f790dd1748786fcf27; LGUID=20170603162959-d4c059b6-4836-11e7-9737-5254005c3644; JSESSIONID=ABAAABAACDBABJB3E7AC7AB5E78E15B61593E7824A580AF; PRE_UTM=; PRE_HOST=www.google.com; PRE_SITE=https%3A%2F%2Fwww.google.com%2F; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2F; ab_test_random_num=0; _gat=1; _putrc=537084309D9B2D17; login=true; unick=%E5%BC%A0%E4%B8%96%E5%BC%BA; showExpriedIndex=1; showExpriedCompanyHome=1; showExpriedMyPublish=1; hasDeliver=16; TG-TRACK-CODE=index_navigation; LGSID=20170604121804-cde500a7-48dc-11e7-9798-5254005c3644; LGRID=20170604122351-9d14df1f-48dd-11e7-9798-5254005c3644; _ga=GA1.2.1556911984.1496478599; _gid=GA1.2.1805336829.1496478599; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1496549884,1496549975,1496550053,1496550198; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1496550232; SEARCH_ID=c4c755ab1d4446479ba4bad9672560a8; index_location_city=%E5%85%A8%E5%9B%BD'
};

function getData(url, cb) {
  var page = getQueryString(url, 'pn');
  var keyword = getQueryString(url, 'kd');
  var city = getQueryString(url, 'city');
  num++;
  superagent
    .post(url)
    .send({
      'pn':page,
      'kn': keyword,
      'first': true
    })
    .set(options)
    .end((err, res) => {
      if (err) {
        throw err;
      }
      console.log('第'+page+'页，当前并发：'+ num);
      if (!fs.existsSync('/data')) {
        fs.mkdirSync('/data');
      }
      fs.writeFile('/data'+city+'_'+keyword+'_'+page+'.json', res.text, (err) => {
        if (err) {
          throw err;
        }
        setTimeout(() => {
          num--;
          console.log('第'+page+'页写入成功');
          cb(null, 'success');
        }, 2000);
      })
    })
}

function requestController(city, keyword, mainCallback) {
  var allowed = false;
  var page = 1;
  var urls = [];

  //获取总页码数
  function getPageNums(cb) {
    superagent
      .post('https://www.lagou.com/jobs/positionAjax.json?needAddtionalResult=false&city='+city+'&kd='+keyword+'&pn=1')
      .send({
        'pn': page,
        'kd': keyword,
        'first': true
      })
      .set(options)
      .end((err, res) => {
        if (err) {
          throw err;
        }
        var data = JSON.parse(res.text);
        if (data.success) {
          total = data['content']['positionResult']['totalCount'];
          cb(null, total);
        } else {
          console.log('error' + res.text);
        }
      })
  }

  //获取url数组
  function getUrls(cb) {
    for (var i = 1; i <= Math.ceil(total/15); i++) {
      urls.push('https://www.lagou.com/jobs/positionAjax.json?needAddtionalResult=false&city='+city+'&kd='+keyword+'&pn='+i);
    }
    console.log(city+' '+keyword+'共'+total+'条数据，'+urls.length+'页');
    cb(null, urls);
  }

  //控制请求并发数，最高3
  function changeConcurrencyNum(cb) {
    async.mapLimit(urls, 3, (url, callback) => {
      getData(url, callback);
    }, (err, res) => {
      if (err) {
        throw err;
      }
      if (arguments[2]) {
        allowed = false;
      }
      cb(null, allowed)
    })
  }

  function finishReq() {
    if (allowed) {
      setTimeout(function() {
        console.log(city+' '+keyword+' finished');
        mainCallback(null);
      }, 5000);
    } else {
      console.log(city+' '+keyword+' finished');
    }
  }

  async.series([
    getPageNums(cb),
    getUrls(cb),
    changeConcurrencyNum(cb),
    finishReq()
  ], (err, result) => {
    if (err) {
      throw err;
    }
  });
}
const async = require('async');
const superagent = require('superagent');
const fs = require('fs');
const getQueryString = require('../../utils/getQuery');
const testSearchQuery = require('../../config/testSearchQuery');

//并发数量
let num = 0;

// let cookie = '_ga=GA1.2.919446475.1540015790; LGUID=20181020140951-c1737eee-d42e-11e8-8bb9-525400f775ce; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2216690181fcc175-047e862b32f8c8-8383268-2073600-16690181fcd547%22%2C%22%24device_id%22%3A%2216690181fcc175-047e862b32f8c8-8383268-2073600-16690181fcd547%22%2C%22props%22%3A%7B%22%24latest_utm_source%22%3A%22m_cf_cpt_baidu_pc%22%7D%7D; index_location_city=%E6%9D%AD%E5%B7%9E; LG_LOGIN_USER_ID=0bab2c2dbea51c058b2cbccad2b6dcbca9aea5f7213a72aca9c816bed54c6f99; showExpriedIndex=1; showExpriedCompanyHome=1; showExpriedMyPublish=1; gate_login_token=5d85461d33e61fc409012982076d3d8bd6b8858570aaf93ab041e4c394cf30c0; _gid=GA1.2.491228834.1554030605; _putrc=EB4A342D430E283C123F89F2B170EADC; login=true; unick=%E9%87%91%E6%99%93; hasDeliver=27; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1554393871,1554438762,1554526354,1554546053; LGSID=20190406200631-6a6e89ce-5864-11e9-9697-525400f775ce; PRE_UTM=; PRE_HOST=; PRE_SITE=https%3A%2F%2Fwww.lagou.com%2Fjobs%2Flist_%25E5%2589%258D%25E7%25AB%25AF%3FlabelWords%3D%26fromSearch%3Dtrue%26suginput%3D; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2Fjobs%2Flist_web%3Fcity%3D%25E6%259D%25AD%25E5%25B7%259E%26cl%3Dfalse%26fromSearch%3Dtrue%26labelWords%3D%26suginput%3D; TG-TRACK-CODE=search_code; _gat=1; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1554553603; LGRID=20190406202646-3e879dbb-5867-11e9-bda7-5254005c3644';

let cookie = '_ga=GA1.2.919446475.1540015790; LGUID=20181020140951-c1737eee-d42e-11e8-8bb9-525400f775ce; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2216690181fcc175-047e862b32f8c8-8383268-2073600-16690181fcd547%22%2C%22%24device_id%22%3A%2216690181fcc175-047e862b32f8c8-8383268-2073600-16690181fcd547%22%2C%22props%22%3A%7B%22%24latest_utm_source%22%3A%22m_cf_cpt_baidu_pc%22%7D%7D; index_location_city=%E6%9D%AD%E5%B7%9E; showExpriedIndex=1; showExpriedCompanyHome=1; showExpriedMyPublish=1; _gid=GA1.2.491228834.1554030605; hasDeliver=27; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1554393871,1554438762,1554526354,1554546053; _gat=1; LGSID=20190406222828-3e9415ed-5878-11e9-a567-525400f775ce; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2Fjobs%2Flist_java%3FlabelWords%3D%26fromSearch%3Dtrue%26suginput%3D%3FlabelWords%3Dhot; login=false; unick=""; _putrc=""; LG_LOGIN_USER_ID=""; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1554560911; LGRID=20190406222834-42714e18-5878-11e9-8048-5254005c3644; TG-TRACK-CODE=index_search';

let cookieQuery = {};

let options = {
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Connection': 'keep-alive',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Cookie': '',
  'Host': 'www.lagou.com',
  'Origin': 'https://www.lagou.com',
  'Referer': 'https://www.lagou.com/jobs/list_web?city=%E6%9D%AD%E5%B7%9E&cl=false&fromSearch=true&labelWords=&suginput=',
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.80 Safari/537.36',
  'Cache-Control': 'max-age=0',
  'X-Anit-Forge-Code': '0',
  'X-Anit-Forge-Token': 'None',
  'X-Requested-With': 'XMLHttpRequest',
};

function getCookieByKey(arr, key) {
  let res = '';
  arr.forEach((v, i, a) => {
    if (v.indexOf(key) > -1) {
      res = v.split(';')[0]+';';
    }
  });
  return res;
}

// function getCookie() {
//   superagent
//     .get('https://www.lagou.com/jobs/list_java?labelWords=&fromSearch=true&suginput=?labelWords=hot')
//     .end((err, res) => {
//       if (err) {
//         throw err;
//       }
//       let cookieArr = res['header']['set-cookie'];
//       let JSESSIONID = getCookieByKey(cookieArr, 'JSESSIONID');
//       let SEARCH_ID = getCookieByKey(cookieArr, 'SEARCH_ID');
//       let user_trace_token = getCookieByKey(cookieArr, 'user_trace_token');
//       let X_HTTP_TOKEN = getCookieByKey(cookieArr, 'X_HTTP_TOKEN');
//       if (JSESSIONID) cookieQuery['JSESSIONID'] = JSESSIONID;
//       if (SEARCH_ID) cookieQuery['SEARCH_ID'] = SEARCH_ID;
//       if (user_trace_token) cookieQuery['user_trace_token'] = user_trace_token;
//       if (X_HTTP_TOKEN) cookieQuery['X_HTTP_TOKEN'] = X_HTTP_TOKEN;
//       let newCookie = `${cookie};${JSESSIONID}${SEARCH_ID}${user_trace_token}${X_HTTP_TOKEN}`;
//       console.log(newCookie);
//     });
// }

function getData(url, cb) {
  let page = getQueryString(url, 'pn');
  let keyword = getQueryString(url, 'kd');
  let city = getQueryString(url, 'city');
  num++;
  superagent
    .get('https://www.lagou.com/jobs/list_java?labelWords=&fromSearch=true&suginput=?labelWords=hot')
    .end((err, res) => {
      if (err) {
        throw err;
      }
      let cookieArr = res['header']['set-cookie'];
      let JSESSIONID = getCookieByKey(cookieArr, 'JSESSIONID');
      let SEARCH_ID = getCookieByKey(cookieArr, 'SEARCH_ID');
      let user_trace_token = getCookieByKey(cookieArr, 'user_trace_token');
      let X_HTTP_TOKEN = getCookieByKey(cookieArr, 'X_HTTP_TOKEN');
      if (JSESSIONID) cookieQuery['JSESSIONID'] = JSESSIONID;
      if (SEARCH_ID) cookieQuery['SEARCH_ID'] = SEARCH_ID;
      if (user_trace_token) cookieQuery['user_trace_token'] = user_trace_token;
      if (X_HTTP_TOKEN) cookieQuery['X_HTTP_TOKEN'] = X_HTTP_TOKEN;
      let newCookie = `${cookie};${JSESSIONID}${SEARCH_ID}${user_trace_token}${X_HTTP_TOKEN}`;
      options['Cookie'] = newCookie;
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
          let data = JSON.parse(res.text);
          if (!data.success) {
            console.log(data);
            return null;
          }
          console.log(`当前第${page}页，并发${num}`);
          if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data');
          }
          fs.writeFile(`./data/${city}_${keyword}_${page}.json`, res.text, (err) => {
            if (err) {
              throw err;
            }
            setTimeout(() => {
              num--;
              console.log(`第${page}页写入成功`);
              cb(null, 'success');
            }, 2000);
          })
          return res.text;
        })
    });
}

function requestController(city, keyword, mainCallback) {
  let allowed = false;
  let page = 1;
  let urls = [];

  async.series([
    (cb) => {
      //获取总页码数
      console.log('1')
      let url = encodeURI(`https://www.lagou.com/jobs/positionAjax.json?needAddtionalResult=false&city=${city}&pn=1`);
      superagent
        .get('https://www.lagou.com/jobs/list_java?labelWords=&fromSearch=true&suginput=?labelWords=hot')
        .end((err, res) => {
          if (err) {
            throw err;
          }
          let cookieArr = res['header']['set-cookie'];
          let JSESSIONID = getCookieByKey(cookieArr, 'JSESSIONID');
          let SEARCH_ID = getCookieByKey(cookieArr, 'SEARCH_ID');
          let user_trace_token = getCookieByKey(cookieArr, 'user_trace_token');
          let X_HTTP_TOKEN = getCookieByKey(cookieArr, 'X_HTTP_TOKEN');
          if (JSESSIONID) cookieQuery['JSESSIONID'] = JSESSIONID;
          if (SEARCH_ID) cookieQuery['SEARCH_ID'] = SEARCH_ID;
          if (user_trace_token) cookieQuery['user_trace_token'] = user_trace_token;
          if (X_HTTP_TOKEN) cookieQuery['X_HTTP_TOKEN'] = X_HTTP_TOKEN;
          let newCookie = `${cookie};${JSESSIONID}${SEARCH_ID}${user_trace_token}${X_HTTP_TOKEN}`;
          options['Cookie'] = newCookie;
          superagent
            .post(url)
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
                page = data['content']['positionResult']['totalCount'];
                console.log('totalCount', data['content']['positionResult']['totalCount'])
                cb(null, page);
              } else {
                console.log('error' + res.text);
                // cb(err, null);
              }
            })
      })
    },
    (cb) => {
      //获取url数组
      console.log('2')
      for (let i = 1; i <= Math.ceil(page/15); i++) {
        let url = encodeURI(`https://www.lagou.com/jobs/positionAjax.json?needAddtionalResult=false&city=${city}&kd=${keyword}&pn=${i}`);
        urls.push(url);
      }
      console.log(`${city} ${keyword} 共${page}条数据，${urls.length}页`);
      cb(null, urls);
    },
    (cb) => {
      //控制请求并发数，最高1
      async.mapLimit(urls, 1, (url, callback) => {
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
    },
    () => {
      if (allowed) {
        setTimeout(function() {
          console.log(city+' '+keyword+' finished');
          mainCallback(null);
        }, 5000);
      } else {
        console.log(city+' '+keyword+' finished');
      }
    }
  ], (err, result) => {
    if (err) {
      throw err;
    }
  });
}

module.exports.requestController = requestController;
// module.exports.getCookie = getCookie;
function getQueryString(url, name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
  if (url == null) {
    return null;
  }
  var search = url.split('?')[1];
  var r = search.match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

module.exports = getQueryString;

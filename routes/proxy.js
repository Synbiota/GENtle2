var _ = require('underscore'),
    request = require('koa-request');

var ALLOWED_HOSTS = [
  /^http:\/\/eutils\.ncbi\.nlm\.nih\.gov\//
];

exports.proxy = function *()  {
  var url = this.params.url,
      allowedUrl = _.some(ALLOWED_HOSTS, function(host) {
        return host.test(url);
      });

  if(allowedUrl) {
    var response = yield request({
      url: url,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

    if(response.statusCode >= 200 && response.statusCode < 300) {
      this.body = response.body;
    } else {
      this.status = response.statusCode;
    }
  } else {
    this.status = 500;
  }
};
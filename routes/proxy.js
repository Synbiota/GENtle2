var _ = require('underscore');
var request = require('request');

var ALLOWED_HOSTS = [
  /^http:\/\/eutils\.ncbi\.nlm\.nih\.gov\//
];

exports.proxy = function (req, res)  {
  var url = req.params.url,
      allowedUrl = _.some(ALLOWED_HOSTS, function(host) {
        return host.test(url);
      });

  if(allowedUrl) {
    request({
      url: url,
      headers: { 'Access-Control-Allow-Origin': '*' }
    }, function(err, response, body) {
      if(err || !(response.statusCode >= 200 && response.statusCode < 300)) {
        res.status(500);
        console.log('here is an error', err, body);
      } else {
        res.send(body);
      }
    });
  } else {
    res.status(500);
  }
};
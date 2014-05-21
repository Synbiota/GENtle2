define(function(require) {
  var $ = require('jquery'),
      Q = require('q'),
      Proxy;

  Proxy = {};

  Proxy.get = function(url) {
    return Q(
      $.ajax({
        url: '/p/'+encodeURIComponent(url),
        method: 'POST'
      })
    );
  };

  return Proxy;

});
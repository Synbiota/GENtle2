import q from 'q';
var DOMParser = require('xmldom').DOMParser;
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var jsdom = require('jsdom');
var env = jsdom.env;


var environmentReady = q.defer();

env('<html></html>', function (errors, window) {
  if(errors) {
    console.error(errors);
    environmentReady.reject(errors);
  }
  GLOBAL.window = window;  // Set up window object for jquery
  GLOBAL.window.RUNNING_IN_BROWSER = false;
  GLOBAL.DOMParser = DOMParser;

  // TODO extract and refactor this from app.js
  var $ = require('jquery');
  $.ajaxSettings.xhr = function() { return new XMLHttpRequest();};
  $.support.cors = true;
  GLOBAL.jQuery = $;
  GLOBAL.$ = $;

  var _ = require('./../../common/lib/underscore.mixed');

  var Backbone = require('backbone');
  GLOBAL.Backbone = Backbone;
  require('./../../common/lib/backbone.mixed');

  environmentReady.resolve();
});

export default environmentReady.promise;

import $ from 'jquery.mixed';
import Q from 'q';

export default {
  get: function(url) {
    return Q(
      $.ajax({
        url: '/p/'+encodeURIComponent(url),
        method: 'POST'
      })
    );
  },

  yqlExtractHtml: function(url, data, selector) {
    return this.yqlQuery(
      'SELECT * FROM data.html.cssselect ' + 
      'WHERE url=\'{{url}}\' AND css=\''+selector+'\'',
      url, 
      data
    ).then(function(data) { 
      return _.isObject(data.query.results) ? 
        data.query.results.results : 
        {};
    });
  },

  yqlExtractHtmlPost: function(url, data, xpathSelector) {
    return this.yqlQuery(
      'SELECT * FROM htmlpost WHERE url=\'{{url}}\' '+
      'AND postdata=\'' + this.serializeParams(data) + '\' '+
      'AND xpath=\'' + xpathSelector.replace(/'/g, '"') + '\'',
      url, {}
    ).then(function(data) {
      return _.isObject(data.query.results) ? 
        data.query.results.postresult : 
        {};
    });
  },

  yqlGetXml: function(url, data) {
    return this.yqlQuery('SELECT * FROM xml WHERE url=\'{{url}}\'', url, data)
      .then(function(data) {
        return data.query.results;
      });
  },

  serializeParams: function(data) {
    return _.map(data || {}, (value, key) => key + '=' + value).join('&');
  },

  yqlQuery: function(query, url, data, method) {
    method = method || 'POST';
    url = url + '?' + this.serializeParams(data);
    query = query.replace('{{url}}', url);
    if(method !== 'POST') query = encodeURIComponent(query);

    return Q($.ajax({
      url:  'https://query.yahooapis.com/v1/public/yql',
      type: method,
      dataType: 'json',
      data: {
        q: query,
        env: 'http://datatables.org/alltables.env',
        format: 'json'
      }
    }));
  }
};
import $ from 'jquery';
import Q from 'q';

export default {
  get: function(url, data, method) {
    method = method || 'GET';
    data = data || {};

    return Q(
      $.ajax({
        url: '/p/'+encodeURIComponent(url),
        method: 'POST',
        data: data
      })
    );
  },

  yqlExtractHtml: function(url, data, xpathSelector) {
    var query = "SELECT * FROM html WHERE compat='html5' " +
      "AND xpath='" + xpathSelector.replace(/'/g, '"') + "'";

    return this.yqlQuery(query, url, data).then(function(data) { 
      return typeof data.query.results == 'object' ? 
        data.query.results : 
        {};
    });
  },

  yqlExtractHtmlPost: function(url, data, xpathSelector) {
    xpathSelector = xpathSelector || '//body';

    var query = 'SELECT * FROM htmlpost WHERE' +
      'postdata=\'' + this.serializeParams(data) + '\' ' +
      'AND xpath=\'' + xpathSelector.replace(/'/g, '"') + '\'';

    return this.yqlQuery(query, url, {}, 'POST', 'xml');
  },

  yqlGetXml: function(url, data) {
    return this.yqlQuery('SELECT * FROM xml', url, data)
      .then(function(data) {
        return data.query.results;
      });
  },

  serializeParams: function(data) {
    data = data || {};
    return Object.keys(data).map((key) => key + '=' + data[key]).join('&');
  },

  yqlQuery: function(query, url, data, method, format) {
    method = method || 'POST';
    url = url + '?' + this.serializeParams(data);
    format = format || 'json';

    var whereRegexp = /where/i;
    var whereClause = "WHERE url='"+url+"'";

    query = whereRegexp.test(query) ? 
      query.replace(whereRegexp, () => whereClause + ' AND ') : 
      query + ' ' + whereClause;

    if(method !== 'POST') query = encodeURIComponent(query);

    return Q($.ajax({
      url:  'https://query.yahooapis.com/v1/public/yql',
      type: method,
      dataType: format,
      data: {
        q: query,
        env: 'http://datatables.org/alltables.env',
        format: format
      }
    }));
  }
};
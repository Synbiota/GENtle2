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
    var queryObject = {
      url:  'https://query.yahooapis.com/v1/public/yql',
      type: method,
      dataType: format,
      data: {
        q: query,
        env: 'http://datatables.org/alltables.env',
        format: format
    }};

    // Retry code
    var deferredYqlQuery = Q.defer();
    this._retryableYqlQuery(queryObject, deferredYqlQuery, this.MAX_RETRIES);

    return deferredYqlQuery.promise;
  },

  MAX_RETRIES: 3,

  _retryableYqlQuery: function(queryObject, deferredYqlQuery, triesLeft) {
    console.log(`yqlQuery (${triesLeft}):`, queryObject.data.q.replace("SELECT * FROM xml WHERE url='http://www.idtdna.com/AnalyzerService/AnalyzerService.asmx/Analyze?Sequence", ''));

    var ajaxQuery = $.ajax(queryObject);

    Q(ajaxQuery).then((response)  => {
      if(triesLeft < this.MAX_RETRIES) {
        console.log('We had to retry but...');
      }
      console.log('we have an answer', response, queryObject.data.q.replace("SELECT * FROM xml WHERE url='http://www.idtdna.com/AnalyzerService/AnalyzerService.asmx/Analyze?Sequence", ''));
      deferredYqlQuery.resolve(response);
    }).catch((e) => {
      triesLeft -= 1;
      var msg = `YQL query encounted ${e.status} error: ${e.statusText}.  RetriesLeft: ${triesLeft}.`;
      if(triesLeft) {
        // Retry
        var seconds = 2 * Math.pow(this.MAX_RETRIES - triesLeft, 2);
        console.warn(msg + `  Retrying in ${seconds} seconds.`);
        setTimeout(() => {
          this._retryableYqlQuery(queryObject, deferredYqlQuery, triesLeft);
        }, seconds * 1000);
      } else {
        // Fail
        console.error(msg + `  Full response: ${e.responseText}`);
        deferredYqlQuery.reject(e);
      }
    });
  }
};
import Proxy from '../../../common/lib/proxy';
import _ from 'underscore';
import Q from 'q';
import Filetypes from '../../../common/lib/filetypes/filetypes';
import $ from 'jquery';

var NCBIUrls = {
  loadId: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db={{dbName}}&id={{id}}&rettype=gb&retmode=text',
  search: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db={{dbName}}&term={{searchTerm}}',
  loadIds: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db={{dbName}}&id={{ids}}'
};

var NCBIIdRegexp = /^\s*[A-Z]{1,3}\B\d{1,10}(\.\d{1,5})?\s*$/i;

var currentDbName;

var NCBIRequest = {

  isId: function(str) {
    return NCBIIdRegexp.test(str.toUpperCase());
  },

  search: function(searchTerm, dbName) {
    var url = NCBIUrls.search
      .replace('{{dbName}}', dbName)
      .replace('{{searchTerm}}', escape(searchTerm));

    currentDbName = dbName;

    return Proxy.yqlGetXml(url).then(NCBIRequest._parseNCBISearchResponseAndGetIds, function() {
      alert('There was an issue search the NCBI database');
    });
  },

  loadFromId: function(id, dbName) {
    var url = NCBIUrls.loadId
          .replace('{{dbName}}', dbName)
          .replace('{{id}}', id);

    currentDbName = dbName;

    return Q($.get(url)).then(Filetypes.guessTypeAndParseFromText, function() {
      alert('There was an issue accessing the NCBI database.');
    });
  },

  _parseNCBISearchResponseAndGetIds: function(response) {
    if(response.eSearchResult.Count === '0') {
      return Q([]);
    }

    var ids = response.eSearchResult.IdList.Id;

    var url = NCBIUrls.loadIds
      .replace('{{dbName}}', currentDbName)
      .replace('{{ids}}', ids.join(','));

    return Proxy.yqlGetXml(url).then(NCBIRequest._parseNCBIIdsResponse, function() {
      alert('There was an issue searching the NCBI database');
    });
  },

  _parseNCBIIdsResponse: function(response) {
    var attributes = ['Caption', 'Title', 'Length'];

    return Q(_.map(response.eSummaryResult.DocSum, function(doc) {
      var output = {};

      _.each(attributes, function(attribute) {
        var item = _.find(doc.Item, {Name: attribute});
        if(item) output[attribute.toLowerCase()] = item.content;
      });

      return output;
    }));
  }
};

export default NCBIRequest;
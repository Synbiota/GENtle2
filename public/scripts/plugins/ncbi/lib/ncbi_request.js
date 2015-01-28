import Proxy from '../../../common/lib/proxy';
import $ from 'jquery.mixed';
import _ from 'underscore.mixed';
import Q from 'q';
import Filetypes from '../../../common/lib/filetypes/filetypes';

var NCBIUrls = {
  loadId: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db={{dbName}}&id={{id}}&rettype=gb&retmode=text',
  search: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db={{dbName}}&term={{searchTerm}}',
  loadIds: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db={{dbName}}&id={{ids}}'
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

    return Proxy.get(url).then(NCBIRequest._parseNCBISearchResponseAndGetIds, function() {
      alert('There was an issue search the NCBI database');
    });
  },

  loadFromId: function(id, dbName) {
    var url = NCBIUrls.loadId
          .replace('{{dbName}}', dbName)
          .replace('{{id}}', id);

    currentDbName = dbName;

    return Proxy.get(url).then(Filetypes.guessTypeAndParseFromText, function() {
      alert('There was an issue accessing the NCBI database.');
    });
  },

  _parseNCBISearchResponseAndGetIds: function(response) {
    var $response = $($.parseXML(response));

    var ids = _.map($response.find('eSearchResult > IdList > Id'), function(id) {
      return $(id).text();
    });

    var url = NCBIUrls.loadIds
      .replace('{{dbName}}', currentDbName)
      .replace('{{ids}}', ids.join(','));

    return Proxy.get(url).then(NCBIRequest._parseNCBIIdsResponse, function() {
      alert('There was an issue searching the NCBI database');
    });
  },

  _parseNCBIIdsResponse: function(response) {
    var $response = $($.parseXML(response));

    return Q(_.map($response.find('DocSum'), function(result) {
      var output = {},
          attributes = ['Caption', 'Title', 'Length'];

      _.each(attributes, function(attribute) {
        output[attribute.toLowerCase()] = $(result).find('[Name="'+attribute+'"]').text();
      });

      return output;
    }));
  },
};

export default NCBIRequest;
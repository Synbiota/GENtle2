define(function(require) {
  var Backbone    = require('backbone.mixed'),
      template    = require('hbars!../templates/ncbi_view'),
      Filetypes   = require('common/lib/filetypes/filetypes'),
      Gentle      = require('gentle')(),
      Proxy       = require('common/lib/proxy'),
      ResultsView = require('./results_view'),
      NCBIUrls,
      NCBIView;

  NCBIUrls = {
    loadId: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db={{dbName}}&id={{id}}&rettype=gb&retmode=text',
    search: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db={{dbName}}&term={{searchTerm}}',
    loadIds: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db={{dbName}}&id={{ids}}'
  };

  NCBIView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'home-ncbi',

    events: {
      'submit form': 'triggerSearch',
      'change form input[type="radio"]': 'changeDb'
    },

    initialize: function() {
      this.resultsView = new ResultsView();
      this.resultsView.parentView = this;
      this.dbName = 'nuccore';

      _.bindAll(this, 'parseNCBISearchResponseAndGetIds',
                      'parseNCBIIdsResponse');
    },

    changeDb: function(event) {
      this.dbName = $(event.currentTarget).attr('value');
    },

    triggerSearch: function(event) {
      var $form = this.$('form'),
          searchTerm = $form.find('input[name="search"]').val(),
          NCBIIdRegexp = /[A-Z]{1,3}\d{1,10}(\.\d{1,5})?/i;

      event.preventDefault();
      this.searchTerm = searchTerm;
      this.results = [];

      if(NCBIIdRegexp.test(searchTerm.toUpperCase())) {
        this.openFromId(searchTerm);
      } else {
        this.searchNCBI(searchTerm);
      }
      
    },

    openFromId: function(id) {
      var url = NCBIUrls.loadId
        .replace('{{dbName}}', this.dbName)
        .replace('{{id}}', id);

      this.$('.loading-from-id').show();
      this.$('.ncbi-search-results-outlet').html('');

      Proxy.get(url)
        .then(Filetypes.guessTypeAndParseFromText, function() {
          alert('There was an issue accessing the NCBI database.');
        })
        .then(Gentle.addSequencesAndNavigate, function() {
          alert('The sequence could not be parsed.');
        });
        
    },

    searchNCBI: function(searchTerm) {
      var url = NCBIUrls.search
        .replace('{{dbName}}', this.dbName)
        .replace('{{searchTerm}}', escape(searchTerm));

      this.$('.searching-ncbi').show();
      this.$('.ncbi-search-results-outlet').html('');

      Proxy.get(url).then(this.parseNCBISearchResponseAndGetIds, function() {
        alert('There was an issue search the NCBI database');
      });
    },

    parseNCBISearchResponseAndGetIds: function(response) {
      var ids, $response, url;

      $response = $($.parseXML(response));
      ids = _.map($response.find('eSearchResult > IdList > Id'), function(id) {
        return $(id).text();
      });

      url = NCBIUrls.loadIds
        .replace('{{dbName}}', this.dbName)
        .replace('{{ids}}', ids.join(','));

      Proxy.get(url).then(this.parseNCBIIdsResponse, function() {
        alert('There was an issue searching the NCBI database');
      });

    },

    parseNCBIIdsResponse: function(response) {
      var $response;

      $response = $($.parseXML(response));
      console.log(response)
      this.results = _.map($response.find('DocSum'), function(result) {
        var output = {},
            attributes = ['Caption', 'Title', 'Length'];

        _.each(attributes, function(attribute) {
          output[attribute.toLowerCase()] = $(result).find('[Name="'+attribute+'"]').text();
        });

        return output;
      });

      this.$('.searching-ncbi').hide();
      this.resultsView.render();
    },

    serialize: function() {
      return {
        searchTerm: this.searchTerm
      };
    },

    afterRender: function() {
      this.setView('.ncbi-search-results-outlet', this.resultsView);
      this.$('form input[type="radio"][value="'+this.dbName+'"]').click();
    }

  });

  return NCBIView;
});
/**
@module Sequence
@submodule Views
@class FeaturesView
**/
define(function(require) {
  var template = require('hbars!plugins/search/templates/search_view'),
    Gentle = require('gentle')(),
    SynbioData = require('common/lib/synbio_data'),
    Backbone = require('backbone.mixed'),
    BSConfirmation = require('bootstrap-confirmation'),
    FeaturesView;

  SearchView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click #start-search': 'readSearchTerm',
      'keyup #search-term' : 'textCapitalize',
      'click .sequence-search-link' : 'scrollToBase'
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.requiredTerm = false;
      this.searchResult = false;
      this.listenTo(this.model.getHistory(), 'change add remove', _.debounce(this.refresh, 100), this);
    },

    textCapitalize: function(event){
      event.preventDefault();
      var capitalize = this.$('#search-term').val().toUpperCase();
        if(capitalize.length > 0)
          this.$('#search-term').val(capitalize);
    },

    scrollToBase: function(event) {
      var $element = $(event.currentTarget),
         rangeFrom = $element.data('rangeId');
         event.preventDefault();
         this.sequenceCanvas.scrollToBase(rangeFrom);
    },

    readSearchTerm: function(event){
       var allowedInputChars = ['A', 'T', 'C', 'G'];
       var regexp = new RegExp('[' +allowedInputChars.join('') + ']', 'g');
       var regexTest = this.$('#search-term').val().toUpperCase().match(regexp);
       var termLen = this.$('#search-term').val().length, searchTerm;

       if(termLen >= 3 && regexTest !== null)
       {
        searchTerm = this.$('#search-term').val().toUpperCase();
        this.searchResult = true;
        this.requiredTerm = false;
        this.startSearch(searchTerm);
       }
       else
       {
        this.requiredTerm = true;
        this.searchResult = false;
        this.refresh();
       }
    },

    startSearch: function(searchTerm){
      var sequence = this.model.get('sequence'),
          query = searchTerm, i = 0, from, to,
          regexp =  new RegExp(query, 'g'), pos;   
          this.ranges = [],
          this.requiredTerm = false;

          while(pos = regexp.exec(sequence)){
            this.ranges.push({from: pos.index, to: pos.index+query.length});
          }

          this.refresh();
    },

    refresh: function() {
      this.render();
    },

    serialize: function() {
     return { requiredTerm : this.requiredTerm,
              searchResult : this.searchResult,
              ranges : this.ranges
     };
    },

    afterRender: function() {
      this.sequenceCanvas = Gentle.layout.getView('#content').actualPrimaryView.sequenceCanvas;
  }
});

  return SearchView;
});
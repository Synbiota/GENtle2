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
      'click .sequence-search-link' : 'scrollToBase',
      'click #add-InfoCard' : 'startEditing',
      'click .sequence-search-results': 'listSearchResults', 
      'click .features-search-results': 'listSearchResults',
      'click #infoCard-delete-button' : 'editInfoCard',
      'click #infoCard-cancel-button' : 'editInfoCard',
      'click #infoCard-edit-save-button' : 'editInfoCard'
    },

    editInfoCard: function(event){
      event.preventDefault();
      //create and update infocard
      this.refresh();
    },
   
    listSearchResults: function(event){
      event.preventDefault();
      if(event.currentTarget.id === "#sequence-results-button")
        this.listResults = {features: false, sequence: true};
      if(event.currentTarget.id === "#features-results-button")
        this.listResults = {features: true, sequence:false};

      this.refresh();
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.requiredTerm = false;
      this.searchResult = {features: false, sequence: false};
      this.listenTo(this.model.getHistory(), 'change add remove', _.debounce(this.refresh, 100), this);
    },

    textCapitalize: function(event){
      event.preventDefault();
      var capitalize = this.$('#search-term').val().toUpperCase();
        if(capitalize.length > 0)
          this.$('#search-term').val(capitalize);
    },

    drawHighlight: function(from, to){
      var  ls              = this.sequenceCanvas.layoutSettings,
           lh              = this.sequenceCanvas.layoutHelpers,
           sequence        = this.sequenceCanvas.sequence,
           nBases          = Math.abs(to - from),
           artist          = this.sequenceCanvas.artist,
           y               = this.sequenceCanvas.getYPosFromBase(from),
           height          = this.sequenceCanvas.layoutSettings.lines.dna.height,
           x               = this.sequenceCanvas.getXPosFromBase(from),
           yOffset         = this.sequenceCanvas.layoutHelpers.yOffset,
           k, subSequence, character, currentBase,
           baseLine        = ls.lines.dna.baseLine,
           sequence        = this.sequenceCanvas.sequence,
           baseRange       = this.sequenceCanvas.getBaseRangeFromYPos(y),
           totalHeight     = this.calculateHeight(y);
           this.highlightColor = "#FFFF00";
           this.textColor = "#000000";

           subSequence = sequence.getSubSeq(from, to); 

        if(subSequence) {
          for(k = 0; k < nBases  ; k++){
            if(!subSequence[k]) break;
               currentBase = this.sequenceCanvas.getBaseFromXYPos(x,y);
               if(currentBase > baseRange[1])
               {
                x = this.sequenceCanvas.getXPosFromBase(currentBase);
                y = this.sequenceCanvas.getYPosFromBase(currentBase);
                totalHeight = this.calculateHeight(y);
               }

              character = subSequence[k];

              artist.rect(x,totalHeight + 3, ls.basePairDims.width, height - 2, {
                fillStyle: this.highlightColor
              });

              artist.text(_.isObject(character) ? character.sequence[character.position] : character, x, totalHeight + height, {backgroundFillStyle: this.textColor,
                                                                                                                                font: "15px Monospace" });
              x += ls.basePairDims.width;
              if ((Math.abs(baseRange[0]-this.sequenceCanvas.getBaseFromXYPos(x,y))) % ls.basesPerBlock === 0) x += ls.gutterWidth;
          }
        }
    },

    scrollToBase: function(event) {
      var $element = $(event.currentTarget),
          rangeFrom = $element.data('rangeFrom'),
          rangeTo = $element.data('rangeTo'),
          _this = this;
          event.preventDefault();
          this.sequenceCanvas.scrollToBase(rangeFrom);
          this.sequenceCanvas.refresh();
          //draw highlight
          setTimeout(function(){
          _this.drawHighlight(rangeFrom, rangeTo);}, 500);
    },

    readSearchTerm: function(event){
       var allowedInputChars = ['A', 'T', 'C', 'G'];
       var regexp = new RegExp('[' +allowedInputChars.join('') + ']', 'g');
       var regexTest = this.$('#search-term').val().toUpperCase().match(regexp);
       var termLen = this.$('#search-term').val().length, searchTerm;

       if(termLen >= 3 && regexTest !== null)
       {
        searchTerm = this.$('#search-term').val().toUpperCase();
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
          this.rangesInFeatures = [],
          this.termInFeature = false,
          this.requiredTerm = false,
          this.setDetails = false,
          features = this.model.get('features'),
          _this = this, featureName='';

          while(pos = regexp.exec(sequence)){
            this.ranges.push({from: pos.index, to: pos.index+query.length});
          }

          if(this.ranges.length > 0)
          {
             this.searchResult = true;
             _.each(this.ranges, function(range, index){
                _.each(features, function(feature){
                        if(range.from>=feature.ranges[0].from && range.to<=feature.ranges[0].to)
                        {  
                          if(feature.name.length > 9)
                            featureName = feature.name.substring(0,25);
                          else
                            featureName = feature.name;
                            range.featureName = featureName;
                            range.termInFeature = true;
                            _this.rangesInFeatures.push({from: range.from, to: range.to, name: featureName});
                            _this.ranges.splice(index,1);
                        }
                });
             });
          }
         
          if(this.ranges.length>0 && this.rangesInFeatures.length>0){
            this.searchResult = {sequence: true, features:true };
          }
          else if(this.ranges.length>0 && this.rangesInFeatures.length===0){
            this.searchResult = {sequence: true, features:false };
          }
          else if(this.ranges.length===0 && this.rangesInFeatures.length>0){
            this.searchResult = {sequence: false, features:true };
          }

          this.listResults = {features: false, sequence: false};

          this.refresh();
    },

    calculateHeight : function(y){
    var height = this.sequenceCanvas.layoutSettings.lines.dna.height,
       lh     = this.sequenceCanvas.layoutHelpers,
       ls     = this.sequenceCanvas.layoutSettings,
       totalHeight = y + height - 10 - lh.yOffset;

        if(ls.lines.position.visible())
           totalHeight = totalHeight + ls.lines.position.height;
        if(ls.lines.aa.visible())
           totalHeight = totalHeight + ls.lines.aa.height;
        if(!ls.lines.topSeparator.visible() && !ls.lines.bottomSeparator.visible())
           totalHeight = totalHeight - 3;
        if(ls.lines.restrictionEnzymesLabels.height > 0)
           totalHeight = totalHeight + ls.lines.restrictionEnzymesLabels.height; 
        if(!ls.lines.topSeparator.visible() && !ls.lines.bottomSeparator.visible()) 
           totalHeight = totalHeight - 2;  

    return totalHeight;
    },

    refresh: function() {
      this.render();
    },
   
   startEditing: function(event){
    this.setDetails = true;
    this.refresh();
    },
   
    serialize: function() {
     return { requiredTerm : this.requiredTerm,
              searchResult : this.searchResult,
              ranges : this.ranges,
              setDetails : this.setDetails,
              listResults: this.listResults,
              rangesInFeatures: this.rangesInFeatures
     };
    },

    afterRender: function() {
      this.sequenceCanvas = Gentle.layout.getView('#content').actualPrimaryView.sequenceCanvas;
  }
});

  return SearchView;
});
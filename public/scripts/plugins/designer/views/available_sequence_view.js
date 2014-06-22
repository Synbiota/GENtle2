define(function(require) {
  var Backbone = require('backbone.mixed'),
      template = require('hbars!../templates/available_sequence_view'),
      SynbioData = require('common/lib/synbio_data'),
      Gentle = require('gentle')(),
      AvailableSequenceView;

  AvailableSequenceView = Backbone.View.extend({
    template: template,
    manage: true,
    className: 'designer-available-sequence',
    minFeatureWidth: 4,

    initialize: function(){
      this.listenTo(Gentle.currentSequence, 'change', this.render, this);
      this.model = Gentle.currentSequence;
      this.featureWidth =[];
      this.featureLeftOffset =[];
      this.features = [];
      this.availableSequences = Gentle.sequences.without(this.model);
    },

    processFeatures: function() {
      var id = -1,
          _this = this;
      _.each(_.reject(this.model.get('features'), function(feature) {
        var featureTypeData = SynbioData.featureTypes[feature._type];
        return false;
        return !featureTypeData || !featureTypeData.is_main_type;
      }), function(feature) {
        _.each(feature.ranges, function(range) {
          _this.features.push({
            name: feature.name,
            id: ++id,
            from: range.from,
            to: range.to,
            type: feature._type.toLowerCase(),
            feature: feature,
            sequence: _this.model.get('id')

          });
        });
      });

      this.features = _.sortBy(this.features, function(feature) {
        return feature.from;
      });

    },

    positionFeatures: function() {
      var maxBase = this.maxBaseForCalc || this.model.length(),
          viewWidth = this.$el.width(),
          $featureElement, feature, featureWidth,
          overlapStack = [], overlapIndex,
          maxOverlapStackIndex = 0, featureLeftOffset,
          $featuresElem, outletSelector;

      for(var i = 0; i < this.features.length; i++) {
        feature = this.features[i];
        if(this.sidebarOpen === true)    
        featureWidth = this.featureWidth[i]*this.$('div.designer-available-sequence-features').width();
        else
        featureWidth = Math.max(
          Math.floor((feature.to - feature.from + 1) / maxBase * viewWidth), 
          this.minFeatureWidth
        );
        if(this.sidebarOpen === false || this.sidebarOpen === undefined){
        this.featureWidth[i]= featureWidth/this.$('div.designer-available-sequence-features').width();
        this.featureLeftOffset[i]=Math.floor(feature.from / maxBase * viewWidth)/this.$('div.designer-available-sequence-features').width();
        featureLeftOffset = Math.floor(feature.from / maxBase * viewWidth);
        }
        else if(this.sidebarOpen === true)
        featureLeftOffset = this.featureLeftOffset[i]*this.$('div.designer-available-sequence-features').width();
        outletSelector = 
              '.designer-available-sequence-outlet[data-sequence-id="' + 
              this.model.id +
              '"]';
        if(this.sidebarOpen === true)
        this.setView(outletSelector, this, true);
        $featureElement = this.$('[data-feature-id="'+feature.id+'-'+this.model.id+'"]');

        $featureElement.css({
          width: featureWidth,
          left: featureLeftOffset,
        });
        overlapIndex = overlapStack.length;
        for(var j = overlapStack.length - 1; j >= 0; j--) {
          if(overlapStack[j] === undefined || overlapStack[j][1] <= feature.from) {
            overlapStack[j] = undefined;
            overlapIndex = j;
          }
        }

        $featureElement.addClass('designer-available-sequence-feature-stacked-'+overlapIndex);
        overlapStack[overlapIndex] = [feature.from, feature.to];
        maxOverlapStackIndex = Math.max(maxOverlapStackIndex, overlapStack.length);
      }
              console.log($featureElement);
              console.log(this);

      $featuresElem = this.$('.designer-available-sequence-features');
      $featuresElem.addClass('designer-available-sequence-features-max-overlap-' + maxOverlapStackIndex);
    },

    serialize: function() {
      this.sidebarOpen = false;
      this.processFeatures();
      return {
        sequence: this.model.serialize(),
        features: this.features
      };
    },

    afterRender: function() {
      _this = this;
            var id = -1;
      this.sidebarOpen = false;
      this.positionFeatures();
      var outletSelector;

      $('html').unbind("click").click(function(){ 
        _.each(_this.availableSequences, function(sequence){  

        _this.sidebarOpen = true;    

        _this.model = sequence;

        _this.features = [];

        _this.processFeatures();

        _this.positionFeatures();

        _this.sidebarOpen = false;

        });
      
  });

      this.$('.designer-available-sequence-feature').draggable({
        revert: 'invalid',
        helper: 'clone',
        cursorAt: {
          top: 5,
          left: 5
        }
      });
    },

  });

  return AvailableSequenceView;
});
import Backbone from 'backbone';
import _ from 'underscore';
import template from '../templates/available_sequences_view.hbs';
import draggableCleanup from '../lib/draggable_cleanup';
import xScrollingUi from '../lib/x_scrolling_ui';
import tooltip from 'gentle-utils/tooltip';
import Gentle from 'gentle';
import cleanSearchableText from '../lib/clean_searchable_text';

var AvailableSequenceView = Backbone.View.extend({
  template: template,
  manage: true,
  className: 'designer-available-sequences',
  // minFeatureWidth: 4,

  initialize: function(){
    // this.listenTo(Gentle.currentSequence, 'change', this.render, this);
    // this.features = [];
    this.listenTo(Gentle, 'designer:availableSequences:filter', this.filterAvailableSequences, this);
  },

  // processFeatures: function() {
  //   var id = 0,
  //       _this = this;

  //   this.features = [];
  //   this.sequence =[];

  //   _.each(_.reject(this.model.get('features'), function(feature) {
  //     var featureTypeData = SynbioData.featureTypes[feature._type];
  //     return false;
  //     return !featureTypeData || !featureTypeData.is_main_type;
  //   }), function(feature) {
  //     var _type = feature._type || '';
  //     _.each(feature.ranges, function(range) {
  //       _this.features.push({
  //         name: feature.name,
  //         id: ++id,
  //         from: range.from,
  //         to: range.to,
  //         reverseComplement: range.reverseComplement,
  //         _type: _type.toLowerCase(),
  //         feature: feature
  //       });
  //     });
  //   });

  //   this.features = _.sortBy(this.features, function(feature) {
  //     return feature.from;
  //   });

  //   var sequenceId = this.model.get('id');
  //   this.sequenceInfo = {
  //     name: this.model.get('name'),
  //     id: sequenceId,
  //     from: 0,
  //     to: this.model.length()-1,
  //     length: this.model.length(),
  //     type: 'Sequence',
  //     features: this.model.get('features'),
  //     // hidden: this.model.maxOverlappingFeatures()>1,
  //     usable: this.parentView().isInsertable(this.model),
  //   };
  // },

  // positionFeatures: function() {
  //   var maxBase = this.maxBaseForCalc || this.model.length(),
  //       viewWidth = this.$el.width(),
  //       $featureElement, feature, featureWidth,sequence,
  //       overlapStack = [], overlapIndex,
  //       maxOverlapStackIndex = 0, length,
  //       $featuresElem;

  //   for(var i = 0; i < this.features.length; i++) {
  //     feature = this.features[i];
  //     var frm = feature.from;
  //     var to = feature.to;
  //     if(frm>to){
  //       to = frm;
  //       frm = feature.to;
  //     }
  //     featureWidth = Math.max(
  //       Math.floor((to - frm + 1) / maxBase * viewWidth),
  //       this.minFeatureWidth
  //     );
  //     $featureElement = this.$('[data-feature_id="'+feature.id+'"]');

  //     $featureElement.css({
  //       left: Math.floor(frm / maxBase * viewWidth),
  //       width: featureWidth
  //     });

  //     overlapIndex = overlapStack.length;

  //     for(var j = overlapStack.length - 1; j >= 0; j--) {
  //       if(overlapStack[j] === undefined || overlapStack[j][1] <= frm) {
  //         overlapStack[j] = undefined;
  //         overlapIndex = j;
  //       }
  //     }

  //     $featureElement.addClass('designer-available-sequence-feature-stacked-'+overlapIndex);
  //     overlapStack[overlapIndex] = [frm, to];
  //     maxOverlapStackIndex = Math.max(maxOverlapStackIndex, overlapStack.length);
  //   }

  //   $featuresElem = this.$('.designer-available-sequence-features');
  //   $featuresElem.addClass('designer-available-sequence-features-max-overlap-' + maxOverlapStackIndex);
  // },

  // showAnnotations: function() {
  //   return Gentle.currentUser.get('displaySettings.designerView.showAnnotations') || false;
  // },

  serialize: function() {
    // var showAnnotations = this.showAnnotations();
    // this.processFeatures();

    // var sequences = _.map(this.getSequences(), (sequence) => {
    //   return {
    //     name: sequence.get('shortName') || sequence.get('name'),
    //     id: sequence.get('id'),
    //     partType: sequence.get('partType') || '__default'
    //   };
    // });

var sequences = this.getSequences();
    

    return {sequences, name: this.name};
  },

  afterRender: function() {
    _.each(this.$('.designer-draggable'), (el) => {
      var $el = $(el);
      var sequenceId = $el.data('sequence_id');
      var sequence = _.find(
        this.parentView().model.allSequences, 
        s => s.get('id') === sequenceId
      );
      if(!sequence) return;

      var searchable = cleanSearchableText(
        sequence.get('name')+
        (sequence.get('shortName') || '') +
        (sequence.get('desc') || '')
      );

      $el.data('searchable', searchable);
    });

    xScrollingUi('.designer-available-sequences .designer-draggable', 'draggable', {
      // refreshPositions: true,
      appendTo: 'body',
      revert: 'invalid',
      helper: 'clone',
      connectToSortable: '.designer-designed-sequence-chunks',
      scrollingElement: '.designer-designed-sequence',
      start: function(event, ui) {
        ui.helper.data('available', true);
      },
      cursorAt: {
        top: 5,
        left: 5
      }
    }).hover(
    (event) => {
      this.parentView().hoveredOverSequence($(event.target).data('sequence_id'));
    },
    (event) => {
      this.parentView().unhoveredOverSequence($(event.target).data('sequence_id'));
    });

    this.$('.designer-draggable').hover(
      (event) => {
        var description = $(event.currentTarget).data('description');
        if(description) tooltip.show(description);
      },
      () => tooltip.hide()
    );
  },

  cleanUpDraggable: function() {
    draggableCleanup(
      this,
      '.designer-available-sequence-draggable'
    );
  },

  beforeRender: function() {
    this.cleanUpDraggable();
  },

  cleanup: function() {
    this.cleanUpDraggable();
  },

  filterAvailableSequences: function({query}) {
    this.$('.designer-draggable-hidden').removeClass('designer-draggable-hidden');
    this.$el.parent().scrollTop(0);
    if(!query || query.length === 0) return;
    _.each(this.$('.designer-draggable'), (el) => {
      var $el = $(el);
      if(!~$el.data('searchable').indexOf(query)) {
        $el.addClass('designer-draggable-hidden');
      } 
    });
  }

});

export default AvailableSequenceView;

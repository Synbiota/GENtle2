define(function(require) {
  var Backbone = require('backbone'),
      template = require('../templates/designer_view_template.hbs'),
      AvailableSequenceView = require('./available_sequence_view'),
      DesignedSequenceView = require('./designed_sequence_view'),
      Gentle = require('gentle'),
      DesignerView;

  DesignerView = Backbone.View.extend({
    template: template,
    manage: true,
    className: 'designer',

    events: {
      'click .toggle-annotations': 'toggleAnnotations',
    },

    initialize: function() {
      this.model = Gentle.currentSequence;
      this.availableSequences = Gentle.sequences.without(this.model)
        .filter((seq) => {
          var stickyEnds = seq.get('stickyEnds');
          return stickyEnds && stickyEnds.start && stickyEnds.end;
        });
    },

    serialize: function() {
      return {
        availableSequences: _.pluck(this.availableSequences, 'id'),
        showAnnotations: Gentle.currentUser.get('displaySettings.designerView.showAnnotations') || false,
      };
    },

    updateDroppabilityState: function() {
      // Dictionary of sequence ids and the positions they can drop too.
      this.droppabilityState = this.designedSequenceView.getDroppabilityState(this.availableSequences);
    },

    isUsable: function(sequenceId) {
      return this.droppabilityState[sequenceId].length > 0;
    },

    afterRender: function() {
      this.insertSequenceViews();
      this.stopListening();
      this.listenTo(this.parentView(), 'resize', this.render, this);
    },

    insertSequenceViews: function() {
      var _this = this,
          designedSequenceView;

      this.removeAllViews();

      _.each(this.availableSequences, function(sequence) {
        var outletSelector = 
              '.designer-available-sequence-outlet[data-sequence_id="' +
              sequence.id +
              '"]',
            availableSequenceView = new AvailableSequenceView();

        availableSequenceView.model = sequence;
        _this.setView(outletSelector, availableSequenceView);
        availableSequenceView.render();
      });

      designedSequenceView = new DesignedSequenceView({model: this.model});
      this.setView('.designer-designed-sequence-outlet', designedSequenceView);
      this.designedSequenceView = designedSequenceView;
      this.updateDroppabilityState();
      designedSequenceView.render();
    }, 

    getAvailableSequenceViewFromSequenceId: function(sequenceId) {
      return this.getView(
        '.designer-available-sequence-outlet[data-sequence_id="' +
        sequenceId +
        '"]');
    },

    hoveredOverSequence: function(sequenceId) {
      var indices = this.droppabilityState[sequenceId];
      this.designedSequenceView.highlightDropSites(indices);
    },

    unhoveredOverSequence: function(sequenceId) {
      this.designedSequenceView.unhighlightDropSites();
    },

    toggleAnnotations: function(event) {
      var showAnnotations = Gentle.currentUser.get('displaySettings.designerView.showAnnotations');
      showAnnotations = _.isUndefined(showAnnotations) ? true : !showAnnotations;
      Gentle.currentUser.set('displaySettings.designerView.showAnnotations', showAnnotations);
      this.render();
    },

    changeSecondaryView: function() {
      // Currently NoOp
    },

    cleanup: function() {
      this.removeAllViews();
    },

    removeAllViews: function() {
      if(this.views && !_.isEmpty(this.views)) {
        _.each(this.views, (view, selector) => {
          view.remove();
        });
      }
      if(this.designedSequenceView) {
        this.designedSequenceView.remove();
      }
    },

  });

  return DesignerView;
});
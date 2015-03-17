define(function(require) {
  var Backbone = require('backbone'),
      AssembleSequence = require('../lib/assemble_sequence'),
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
      this.model = new AssembleSequence(Gentle.currentSequence);
    },

    serialize: function() {
      return {
        insertableSequences: _.pluck(this.model.insertableSequences, 'id'),
        uninsertableSequences: this.model.incompatibleSequences.length + this.model.lackStickyEndSequences.length,
        incompatibleSequences: _.pluck(this.model.incompatibleSequences, 'id'),
        lackStickyEndSequences: _.pluck(this.model.lackStickyEndSequences, 'id'),
        showAnnotations: Gentle.currentUser.get('displaySettings.designerView.showAnnotations') || false,
      };
    },

    beforeRender: function() {
      this.removeAllViews();
      this.model.updateInsertabilityState();
    },

    afterRender: function() {
      this.insertSequenceViews();
      this.stopListening();
      this.listenTo(this.parentView(), 'resize', this.render, this);
    },

    insertSequenceViews: function() {
      var _this = this,
          designedSequenceView;

      _.each(this.model.allSequences, function(sequence) {
        var outletSelector = `.designer-available-sequence-outlet[data-sequence_id="${sequence.id}"]`;
        var sequenceView = new AvailableSequenceView({model: sequence});
        _this.setView(outletSelector, sequenceView);
        sequenceView.render();
      });

      designedSequenceView = new DesignedSequenceView({model: this.model});
      this.setView('.designer-designed-sequence-outlet', designedSequenceView);
      this.designedSequenceView = designedSequenceView;
      designedSequenceView.render();
    }, 

    getAvailableSequenceViewFromSequenceId: function(sequenceId) {
      return this.getView(`.designer-available-sequence-outlet[data-sequence_id="${sequenceId}"]`);
    },

    hoveredOverSequence: function(sequenceId) {
      var indices = this.model.insertabilityState[sequenceId];
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

    isInsertable: function(sequence) {
      return this.model.isInsertable(sequence);
    },

    changeSecondaryView: function() {
      // Currently NoOp
    },

    cleanup: function() {
      this.removeAllViews();
    },

    removeAllViews: function() {
      this.designedSequenceView = undefined;
      this.getViews().each((view) => {
        view.remove();
      });
    },

  });

  return DesignerView;
});
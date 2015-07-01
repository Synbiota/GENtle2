import Backbone from 'backbone';
import _ from 'underscore';
import AssembleSequence from '../lib/assemble_sequence';
import template from '../templates/designer_view_template.hbs';
import AvailableSequencesView from './available_sequences_view';
import DesignedSequenceView from './designed_sequence_view';
import Gentle from 'gentle';

var filterSequencesByStickyEnds = function(sequences, [stickyEndStartName, stickyEndEndName]) {
  var stickyEndName = `${stickyEndStartName}-${stickyEndEndName}`.toLowerCase();
  return function() {
    return _.filter(sequences, function(sequence) {
      var stickyEnds = sequence.getStickyEnds();
      return stickyEnds && 
        `${stickyEnds.start.name}-${stickyEnds.end.name}`.toLowerCase() === stickyEndName;
    });
  };
};

var DesignerView = Backbone.View.extend({
  template: template,
  manage: true,
  className: 'designer',

  events: {
    // 'click .toggle-annotations': 'toggleAnnotations',
    // 'click .toggle-uninsertable-sequences': 'toggleUninsertableSequences',
    'change #circularise-dna': 'updateCirculariseDna'
  },

  initialize: function() {
    this.model = new AssembleSequence(Gentle.currentSequence);

    // Default to `circular` true
    if(this.model.sequences.length === 0) {
      this.model.set({'isCircular': true}, {silent: true});
    }

    console.log(this.model.allSequences)

    this.setView(
      '.designer-available-sequences-outlet.outlet-1', 
      new AvailableSequencesView({
        name: 'x-z\' Parts',
        getSequences: filterSequencesByStickyEnds(this.model.allSequences, ['x', 'z\''])
      })
    );

    this.setView(
      '.designer-available-sequences-outlet.outlet-2', 
      new AvailableSequencesView({
        name: 'z-x\' Parts',
        getSequences: filterSequencesByStickyEnds(this.model.allSequences, ['z', 'x\''])
      })
    );

    var designedSequenceView = this.designedSequenceView = 
      new DesignedSequenceView({model: this.model});
    this.setView('.designer-designed-sequence-outlet', designedSequenceView);
  },

  serialize: function() {
    return {
      sequenceName: this.model.get('name'),
      submitDisabled: this.model.sequences.length === 0,
      circulariseDna: this.model.get('isCircular'),
      // insertableSequences: _.pluck(this.model.insertableSequences, 'id'),
      // uninsertableSequences: this.model.incompatibleSequences.length + this.model.lackStickyEndSequences.length,
      // incompatibleSequences: _.pluck(this.model.incompatibleSequences, 'id'),
      // lackStickyEndSequences: _.pluck(this.model.lackStickyEndSequences, 'id'),
      // showAnnotations: Gentle.currentUser.get('displaySettings.designerView.showAnnotations') || false,
      // showUninsertableSequences: Gentle.currentUser.get('displaySettings.designerView.showUninsertableSequences') || false,
    };
  },

  beforeRender: function() {
    // this.removeAllViews();
    // this.model.updateInsertabilityState();
  },

  afterRender: function() {
    // this.insertSequenceViews();
    // this.stopListening();
    // this.listenTo(this.parentView(), 'resize', this.render, this);
  },

  updateCirculariseDna: function(event) {
    event.preventDefault();
    this.model.set('isCircular', event.target.checked).throttledSave();
    this.render();
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

  // toggleAnnotations: function(event) {
  //   var showAnnotations = Gentle.currentUser.get('displaySettings.designerView.showAnnotations');
  //   showAnnotations = _.isUndefined(showAnnotations) ? true : !showAnnotations;
  //   Gentle.currentUser.set('displaySettings.designerView.showAnnotations', showAnnotations);
  //   this.render();
  // },

  // toggleUninsertableSequences: function(event) {
  //   var showUninsertableSequences = Gentle.currentUser.get('displaySettings.designerView.showUninsertableSequences');
  //   showUninsertableSequences = _.isUndefined(showUninsertableSequences) ? true : !showUninsertableSequences;
  //   Gentle.currentUser.set('displaySettings.designerView.showUninsertableSequences', showUninsertableSequences);
  //   this.render();
  // },

  isInsertable: function(sequence) {
    return this.model.isInsertable(sequence);
  },

  getDescriptiveAnnotationContent: function(sequence) {
    var features = sequence.get('features');
    if(features.length == 1) {
      var feature = features[0];
      var range = feature.ranges[0];
      if(range.from === 0 && range.to >= sequence.length()-1) {
        return feature.name;
      }
    }
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

  remove: function() {
    Gentle.sequences.off(null, null, this);
    Backbone.View.prototype.remove.apply(this, arguments);
  }

});

export default DesignerView;
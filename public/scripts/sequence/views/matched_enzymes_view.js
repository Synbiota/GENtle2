import Backbone from 'backbone';
import template from '../templates/matched_enzymes_view.hbs';
import _ from 'underscore';
import Gentle from 'gentle';
import RestrictionEnzymes from '../../sequence/lib/restriction_enzymes';

export default Backbone.View.extend({
  template: template,
  manage: true,
  className: 'sequence-matched-enzymes',

  events: {
    'click .next-enzyme': 'highlightNextEnzyme',
    'click .open-settings': 'openSettings'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    
    this.listenTo(
      this.model, 
      'change:sequence change:displaySettings.rows.res.*',
      this.render,
      this
    );

    this.listenTo(Gentle, 'resize', this.handleResize, this);
  },

  serialize: function() {
    var model = this.model;
    var displaySettings = model.get('displaySettings.rows.res') || {};
    var enzymes = RestrictionEnzymes.getAllInSeq(model.get('sequence'), {
      length: displaySettings.lengths || [],
      customList: displaySettings.custom || [],
      hideNonPalindromicStickyEndSites: displaySettings.hideNonPalindromicStickyEndSites || false
    });

    var enzymesCount = 0;

    this.enzymePositions = _.reduce(enzymes, function(memo, enzymesArray, position) {
      enzymesCount += enzymesArray.length;
      memo[position ^ 0] = _.max(_.map(enzymesArray, (enzyme) => enzyme.seq.length));
      return memo;
    }, {});

    return {
      enzymesCount
    };
  },

  getSequenceCanvas: function() {
    return this.parentView().actualPrimaryView.sequenceCanvas;
  },

  highlightNextEnzyme: function(event) {
    if(event) event.preventDefault();

    var step = 1;
    var sequenceCanvas = this.getSequenceCanvas();
    var positions = _.keys(this.enzymePositions);

    if(_.isUndefined(this.currentEnzymeIndex)) {
      this.currentEnzymeIndex = 0;
    } else {
      this.currentEnzymeIndex = (this.currentEnzymeIndex + step) % positions.length;
    }

    var currentEnzymePosition = positions[this.currentEnzymeIndex] ^ 0;
    var length = this.enzymePositions[currentEnzymePosition];

    sequenceCanvas.highlightBaseRange(
      currentEnzymePosition, 
      currentEnzymePosition + length
    );

    sequenceCanvas.afterNextRedraw(function() {
      sequenceCanvas.scrollBaseToVisibility(currentEnzymePosition);
    });
  },

  handleResize: function() {
    var leftPos = this.parentView().primaryViewLeftPos() + 1;
    $('.sequence-matched-enzymes-outlet').css('left', leftPos);
  },

  openSettings: function(event) {
    if(event) event.preventDefault();
    this.parentView().sequenceSettingsView.tabs.resSettings.view.openTab();
  }
});
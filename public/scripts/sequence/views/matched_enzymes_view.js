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
    'click .next-enzyme': 'highlightNextEnzyme'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
  },

  serialize: function() {
    var model = this.model;
    var displaySettings = model.get('displaySettings.rows.res') || {};
    var enzymes = RestrictionEnzymes.getAllInSeq(model.get('sequence'), {
      length: displaySettings.lengths || [],
      customList: displaySettings.custom || [],
      hideNonPalindromicStickyEndSites: displaySettings.hideNonPalindromicStickyEndSites || false
    });

    var enzymesCount = _.reduce(enzymes, function(memo, enzymesArray) {
      return memo + enzymesArray.length;
    }, 0);

    this.enzymePositions = _.keys(enzymes);

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

    if(_.isUndefined(this.currentEnzymeIndex)) {
      this.currentEnzymeIndex = 0;
    } else {
      this.currentEnzymeIndex = (this.currentEnzymeIndex + step) % this.enzymePositions.length;
    }

    var currentEnzymePosition = this.enzymePositions[this.currentEnzymeIndex];

    // sequenceCanvas.highlightBaseRange(currentEnzymePosition, currentEnzymePosition+1);

    // sequenceCanvas.afterNextRedraw(function() {
      sequenceCanvas.scrollBaseToVisibility(currentEnzymePosition);
    // });



  }
});
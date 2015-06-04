import Backbone from 'backbone';
import template from '../templates/matched_enzymes_view.hbs';
import _ from 'underscore';
import Gentle from 'gentle';
import RestrictionEnzymes from '../../sequence/lib/restriction_enzymes';
import RestrictionEnzymeReplacerView from '../views/restriction_enzyme_replacer_view';

export default Backbone.View.extend({
  template: template,
  manage: true,
  className: 'sequence-matched-enzymes',

  events: {
    'click .next-enzyme': 'highlightNextEnzyme',
    'click .open-settings': 'openSettings',
    'click .launch-modal': 'launchModal'
  },

  initialize: function() {
    this.model = Gentle.currentSequence;
    this.subCodonPosY = 0;
    this.subCodonPosX = 0;
    this.listenTo(
      this.model, 
      'change:sequence change:displaySettings.rows.res.*',
      this.render,
      this
    );

    var _this= this; 
    
    var restrictionEnzymeReplacerView = this.restrictionEnzymeReplacerView = new RestrictionEnzymeReplacerView({
      showModal: {},
      sequence: _this.model,
      nonCompliantMatches: RestrictionEnzymes.getAllInSeq(_this.model.get('sequence'), {customList: ['BsaI', "NotI"]})

    });
    this.setView('#condonSubModalContainer', restrictionEnzymeReplacerView);
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

    // store the count
    this.enzymesCount = enzymesCount;

    // Show button for BsaI && NotI
    var nonCompliantSites = RestrictionEnzymes.getAllInSeq(model.get('sequence'), {customList: ['BsaI', "NotI"]});  
    if(nonCompliantSites.length !== 0 && !_.isUndefined(nonCompliantSites)) {
      this.showLaunchButton=true;
    } else {
      this.showLaunchButton=false;
    }

    
   return {
      enzymesCount,
      disableButton: !this.showLaunchButton
    };

  },

  afterRender: function() {
    var displaySettings = this.model.get('displaySettings.rows.res') || {};
    this.$el.toggleClass('visible', displaySettings.display);

    if(this.enzymesCount == 0){
      $(".launch-modal").addClass('hidden');  
      $(".next-enzyme").addClass('hidden');  
    }
  },

  getSequenceCanvas: function() {
    return this.parentView(2).actualPrimaryView.sequenceCanvas;
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

    sequenceCanvas.select(
      currentEnzymePosition, (currentEnzymePosition + length - 1)
    );

    sequenceCanvas.highlightBaseRange(
      currentEnzymePosition, (currentEnzymePosition + length)      
    );

    sequenceCanvas.scrollBaseToVisibility(currentEnzymePosition); 
 

  },

  launchModal: function(event) {
    if(event) event.preventDefault();

    var sequenceCanvas = this.getSequenceCanvas();
    var restrictionEnzymeReplacerView = this.restrictionEnzymeReplacerView;

    sequenceCanvas.afterNextRedraw(function() {
        restrictionEnzymeReplacerView.showModal= true;
        restrictionEnzymeReplacerView.caretPosition = sequenceCanvas.caretPosition;
        restrictionEnzymeReplacerView.sequenceCanvas= sequenceCanvas;
        restrictionEnzymeReplacerView.render();
    });

    sequenceCanvas.redraw();
  },

  openSettings: function(event) {
    if(event) event.preventDefault();
    this.parentView(2).sequenceSettingsView.tabs.resSettings.view.openTab();
  }
});
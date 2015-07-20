import Backbone from 'backbone';
import template from '../templates/matched_enzymes_view.hbs';
import _ from 'underscore';
import Gentle from 'gentle';
import RestrictionEnzymes from 'gentle-restriction-enzymes';
import RestrictionEnzymeReplacerView from '../views/restriction_enzyme_replacer_view';
import Modal from '../../common/views/modal_view';

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
  },

  serialize: function() {
    var model = this.model;
    var displaySettings = model.get('displaySettings.rows.res') || {};
    var sequenceBases = model.getSequence(model.STICKY_ENDS_FULL);
    var enzymes = RestrictionEnzymes.getAllInSeq(sequenceBases, {
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
    var nonCompliantSites = RestrictionEnzymes.getAllInSeq(sequenceBases, {customList: ['BsaI', "NotI"]});
    if(!_.isEmpty(nonCompliantSites) && !_.isUndefined(nonCompliantSites)) {
      this.disableButton=false;
    } else {
      this.disableButton=true;
    }

    return {
      enzymesCount,
      disableButton: this.disableButton
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

    var replacerView = new RestrictionEnzymeReplacerView({
      sequence: this.model,
      nonCompliantMatches: RestrictionEnzymes.getAllInSeq(
        this.model.getSequence(), {
        customList: ['BsaI', 'NotI']
      })
    });

    Modal.show({
      bodyView: replacerView,
      title: 'Fix all BsaI/NotI sites',
      subTitle: 'The following codon(s) will be substituted to make this sequence into an RDP part.',
      confirmLabel: 'Replace'
    }).on('confirm', () => {
      replacerView.fixSequence();
    }).on('hide', () => {
      replacerView.cleanup();
      replacerView = null;
    });

  },

  openSettings: function(event) {
    if(event) event.preventDefault();
    this.parentView(2).sequenceSettingsView.tabs.resSettings.view.openTab();
  }
});
import Backbone from 'backbone';
import _ from 'underscore';
import template from '../templates/pcr_edits_view.hbs';
import Styles from '../../../styles.json';
import SequenceCanvas from 'gentle-sequence-canvas';
import Sequence from '../../../sequence/models/sequence';
import RdpEdit from 'gentle-rdp/rdp_edit';
var LineStyles = Styles.sequences.lines;


var makeSequenceContextCanvas = function($element, context) {
  var sequence = new Sequence({
    sequence: context.sequence,
  });

  var aaOffset = 0;

  var sequenceCanvasLines = {

    position: ['Position', {
      height: 15,
      baseLine: 15,
      textFont: LineStyles.position.text.font,
      textColour: LineStyles.position.text.color,
      basesPerStep: 10,
      transform: base => base + context.contextualFrom
    }],

    // Aminoacids
    aa: ['DNA', {
      height: 15,
      baseLine: 15,
      textFont: LineStyles.aa.text.font,
      transform: base => sequence.getAA('long', base, aaOffset),
      textColour: function(codon) {
        var colors = LineStyles.aa.text.color;
        return colors[codon.sequence] || colors._default;
      }
    }],

    // DNA Bases
    dna: ['DNA', {
      height: 15,
      baseLine: 15,
      drawSingleStickyEnds: true,
      textFont: LineStyles.dna.text.font,
      textColour: LineStyles.dna.text.color,
      selectionColour: LineStyles.dna.selection.fill,
      selectionTextColour: LineStyles.dna.selection.color
    }],

    // Complements
    complements: ['DNA', {
      height: 15,
      baseLine: 15,
      drawSingleStickyEnds: true,
      isComplement: true,
      textFont: LineStyles.complements.text.font,
      textColour: LineStyles.complements.text.color,
      getSubSeq: _.partial(sequence.getTransformedSubSeq, 'complements', {}),
    }]

  };


  var sequenceCanvas = new SequenceCanvas({
    sequence: sequence,
    container: $element,
    lines: sequenceCanvasLines,
    selectable: false,
    editable: false,
    layoutSettings: {
      basesPerBlock: 1
    }
  });

  return sequenceCanvas;
};


export default Backbone.View.extend({
  manage: true,
  template: template,

  initialize() {
    if(!this.transforms) {
      throw new Error('PcrEditView is missing a transforms attribute');
    }

    _.defaults(this, {
      isAfterTransform: false
    });

    var warningMessages = {
      EARLY_STOP_CODON: {
        title: 'Early stop codon'
      }
    };

    var transformMessages = {
      TERMINAL_STOP_CODON_REMOVED: {
        titleBefore: 'Remove stop codon',
        titleAfter: 'Removed stop codon',
      },
      LAST_BASE_IS_C: {
        titleBefore: 'Make last base a C',
        titleAfter: 'Made last base a C',
        postCaption: '(Conservative amino acid change)'
      },
      LAST_BASE_IS_C_NO_AA_CHANGE: {
        titleBefore: 'Make last base a C',
        titleAfter: 'Made last base a C',
      },
      LAST_BASE_IS_G: {
        titleBefore: 'Make last base a G',
        titleAfter: 'Made last base a G',
        postCaption: '(Conservative amino acid change)'
      },
      LAST_BASE_IS_G_NO_AA_CHANGE: {
        titleBefore: 'Make last base a G',
        titleAfter: 'Made last base a G',
      },
      METHIONINE_START_CODON_CONVERTED: {
        titleBefore: 'Make first codon ATG (Met)',
        titleAfter: 'Made first codon ATG (Met)',
      },
      METHIONINE_START_CODON_ADDED: {
        titleBefore: 'Add ATG (Met)',
        titleAfter: 'Added ATG (Met)',
      }
    };

    var processWarnings = (memo, rdpEdit) => {
      if(!this.isAfterTransform && rdpEdit.level === RdpEdit.levels.WARN) {
        var message = warningMessages[rdpEdit.type];
        // Provide a default if a specific message has not yet been provided
        if(!message) message = {title: rdpEdit.message};
        memo.push(_.extend({}, {
          title: message.title,
          contextBefore: rdpEdit.contextBefore,
          warningId: _.uniqueId(),
        }));
      }
      return memo;
    };

    var processTransforms = (memo, rdpEdit) => {
      if(rdpEdit.level === RdpEdit.levels.NORMAL) {
        var key = 'title' + (this.isAfterTransform ? 'After' : 'Before');
        var message = transformMessages[rdpEdit.type];
        // Provide a default if a specific message has not yet been provided
        if(!message) message = {titleBefore: 'RDP edit', titleAfter: 'RDP edit'};
        var rdpEditObject = _.extend({}, rdpEdit, {
          title: message[key],
          postCaption: message.postCaption,
        });
        memo.push(rdpEditObject);
      }
      return memo;
    };

    this.warningObjects = _.reduce(this.transforms, processWarnings, []);
    this.transformObjects = _.reduce(this.transforms, processTransforms, []);
  },

  serialize() {
    return {
      warnings: this.warningObjects,
      transforms: this.transformObjects,
      any: this.transformObjects.length > 0,
      post: this.post
    };
  },

  afterRender() {
    this.sequenceCanvases = [];

    _.each(this.$('.rdp-warnings'), (element) => {
      var $element = $(element);
      var warningId = $element.data('warning_id');
      var warning = _.findWhere(this.warningObjects, {warningId});
      if(warning.contextBefore) {
        var sequenceCanvas = makeSequenceContextCanvas($element, warning.contextBefore);
        this.sequenceCanvases.push(sequenceCanvas);
      }
    });

    _.each(this.$('.rdp-transforms'), (element) => {
      var $element = $(element);
      var editType = $element.data('edit_type');
      var editStep = _.ucFirst($element.data('edit_step'));
      var context = _.find(this.transformObjects, {type: editType})['context' + editStep];

      var sequenceCanvas = makeSequenceContextCanvas($element, context);

      this.sequenceCanvases.push(sequenceCanvas);
    });
  }

});

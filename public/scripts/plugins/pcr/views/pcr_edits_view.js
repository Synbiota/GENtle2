import Backbone from 'backbone';
import _ from 'underscore';
import template from '../templates/pcr_edits_view.hbs';
import Styles from '../../../styles.json';
import SequenceCanvas from 'gentle-sequence-canvas';
import Sequence from '../../../sequence/models/sequence';
var LineStyles = Styles.sequences.lines;


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

    var messages = {
      NO_TERMINAL_STOP_CODON: {
        titleBefore: 'Remove stop codon',
        titleAfter: 'Removed stop codon',
      },
      LAST_BASE_IS_C: {
        titleBefore: 'Make final codon C-terminal',
        titleAfter: 'Made final codon C-terminal',
        postCaption: '(Conservative amino acid change)'
      },
      LAST_BASE_IS_C_NO_AA_CHANGE: {
        titleBefore: 'Make final codon C-terminal',
        titleAfter: 'Made final codon C-terminal',
      },
      LAST_BASE_IS_G: {
        titleBefore: 'Make final codon G-terminal',
        titleAfter: 'Made final codon G-terminal',
        postCaption: '(Conservative amino acid change)'
      },
      LAST_BASE_IS_G_NO_AA_CHANGE: {
        titleBefore: 'Make final codon G-terminal',
        titleAfter: 'Made final codon G-terminal',
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

    var processTransforms = (memo, transform) => {
      var key = 'title' + (this.isAfterTransform ? 'After' : 'Before');
      var message = messages[transform.type];
      // Provide a default if a specific message has not yet been provided
      if(!message) message = {titleBefore: 'RDP edit', titleAfter: 'RDP edit'};
      var simpleTransform = _.extend({}, transform, {
        title: message[key],
        postCaption: message.postCaption
      });
      memo.push(simpleTransform);
      return memo;
    };

    this.transformObjects = _.reduce(this.transforms, processTransforms, []);
  },

  serialize() {
    return {
      transforms: this.transformObjects,
      any: this.transformObjects.length > 0,
      post: this.post
    };
  },

  afterRender() {
    this.sequenceCanvases = [];    

    _.each(this.$('.edit-canvas-outlet'), (element) => {
      /*
        contextAfter: RdpSequenceFeature
        _id: "1434569338080-1ac1d"
        _type: "METHIONINE_START_CODON"
        contextualFrom: 0
        contextualTo: 12
        desc: "Inserted ATG (Methionine) start codon"
        name: "Inserted ATG"
        ranges: Array[1]
        sequence: "ATGGGTCTCCGT"
        __proto__: RdpSequenceFeature
      */
      var $element = $(element);
      var editType = $element.data('edit_type');
      var editStep = _.ucFirst($element.data('edit_step'));
      var context = _.find(this.transformObjects, {type: editType})['context' + editStep];

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

      this.sequenceCanvases.push(sequenceCanvas);
    });
  }

});

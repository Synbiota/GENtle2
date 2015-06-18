import Backbone from 'backbone';
import _ from 'underscore';
import template from '../templates/pcr_edits_view.hbs';
import {transformSequenceForRdp} from 'gentle-rdp/sequence_transform';
import {types as RdpEditTypes} from 'gentle-rdp/rdp_edit';
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

    this.messages = {
      RDP_EDIT_NO_TERMINAL_STOP_CODON: {
        titleAfter: 'Removed stop codon',
        titleBefore: 'Remove stop codon' 
      },
      RDP_EDIT_TERMINAL_C_BASE: {
        titleAfter: 'Made final codon C-terminal',
        titleBefore: 'Make final codon C-terminal',
        postCaption: '(Conservative amino acid change)'
      },
      RDP_EDIT_METHIONINE_START_CODON: {
        titleAfter: 'Made first codon ATG (Met)',
        titleBefore: 'Make first codon ATG (Met)'
      }
    };

    var findTransform = (editType) => {
      var key = this.isAfterTransform ? 'After' : 'Before';
      var transform = _.find(this.transforms, {type: editType});
      if(transform) {
        return _.extend({}, transform, {
          title: this.messages[editType]['title' + key],
          postCaption: this.messages[editType].postCaption
        });
      } else {
        return;
      }
    };

    this.transforms = _.compact(_.map(_.keys(this.messages), findTransform));
  },

  serialize() {
    return {
      transforms: this.transforms,
      editTypes: _.keys(this.messages),
      any: this.transforms.length > 0,
      post: this.post
    };
  },

  afterRender() {
    this.sequenceCanvases = [];    

    _.each(this.$('.edit-canvas-outlet'), (element) => {
      /*
        contextAfter: RdpSequenceFeature
        _id: "1434569338080-1ac1d"
        _type: "RDP_EDIT_METHIONINE_START_CODON"
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
      var context = _.find(this.transforms, {type: editType})['context' + editStep];

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
          basesPerBlock: 10
        }
      });

      this.sequenceCanvases.push(sequenceCanvas);
    });
  }

});

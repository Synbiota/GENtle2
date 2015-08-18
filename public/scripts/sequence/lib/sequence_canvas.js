import _ from 'underscore';
import classMixin from 'gentledna-utils/dist/class_mixin';
import Core from 'gentle-sequence-canvas/core';
import EventHandlers from 'gentle-sequence-canvas/event_handlers';
import Utilities from 'gentle-sequence-canvas/utilities';
import Memoizable from 'gentledna-utils/dist/memoizable';
import {dnaTextColour} from './sequence_calculations';

import ContextMenu from './_sequence_canvas_context_menu';

var SequenceCanvasMixin = classMixin(ContextMenu, EventHandlers, Utilities, Core, Memoizable);

import Styles from '../../styles';
const LineStyles = Styles.sequences.lines;


var defaultLines = function(sequence) {

  return {
    // Blank line
    topSeparator: ['Blank', {
      height: 5,
      visible: function() {
        return sequence.get('displaySettings.rows.separators');
      }
    }],

    // Restriction Enzyme Sites
    restrictionEnzymesLabels: ['RestrictionEnzymesLabels', {
      unitHeight: 10,
      textFont: LineStyles.RES.text.font,
      textColour: LineStyles.RES.text.color,
      get displaySettings() {
        return sequence.get('displaySettings.rows.res') || {};
      },
      visible: function() {
        return sequence.get('displaySettings.rows.res.display');
      }
    }],

    // Position numbering
    position: ['Position', {
      height: 15,
      baseLine: 15,
      textFont: LineStyles.position.text.font,
      textColour: LineStyles.position.text.color,
      transform: _.formatThousands,
      visible: function() {
        return sequence.get('displaySettings.rows.numbering');
      }
    }],

    // Aminoacids
    aa: ['DNA', {
      height: 15,
      baseLine: 15,
      textFont: LineStyles.aa.text.font,
      transform: function(base) {
        return sequence.getAA(sequence.get('displaySettings.rows.aa'), base, parseInt(sequence.get('displaySettings.rows.aaOffset')));
      },
      visible: function() {
        return sequence.get('displaySettings.rows.aa') != 'none';
      },
      textColour: function(codon) {
        var colors = LineStyles.aa.text.color;
        return colors[codon.sequence] || colors._default;
      }
    }],

    // DNA Bases
    dna: ['DNA', {
      height: 15,
      baseLine: 15,
      textFont: LineStyles.dna.text.font,
      textColour: _.partial(dnaTextColour, sequence, false, LineStyles.dna.text.color),
      selectionColour: LineStyles.dna.selection.fill,
      selectionTextColour: LineStyles.dna.selection.color
    }],

    // Complements
    complements: ['DNA', {
      height: 15,
      baseLine: 15,
      textFont: LineStyles.complements.text.font,
      textColour: _.partial(dnaTextColour, sequence, true, LineStyles.complements.text.color),
      getSubSeq: _.partial(sequence.getTransformedSubSeq, 'complements', {}),
      visible: function() {
        return sequence.get('displaySettings.rows.complements');
      }
    }],

    // Annotations
    features: ['Feature', {
      unitHeight: 15,
      baseLine: 10,
      textFont: LineStyles.features.font,
      topMargin: 3,
      textColour: function(type) {
        var colors = LineStyles.features.color;
        type = 'type-'+type.toLowerCase();
        return (colors[type] && colors[type].color) || colors._default.color;
      },
      textPadding: 2,
      margin: 2,
      lineSize: 2,
      colour: function(type) {
        var colors = LineStyles.features.color;
        type = 'type-'+type.toLowerCase();
        return (colors[type] && colors[type].fill) || colors._default.fill;
      },
      visible: function() {
        return sequence.getFeatures().length && sequence.get('displaySettings.rows.features');
      }
    }],

    // Blank line
    bottomSeparator: ['Blank', {
      height: 10,
      visible: function() {
        return sequence.get('displaySettings.rows.separators');
      }
    }],

    // Restriction Enzyme Sites
    restrictionEnzymeSites: ['RestrictionEnzymesSites', {
      floating: true,
      get displaySettings() {
        return sequence.get('displaySettings.rows.res') || {};
      },
      visible: function() {
        return sequence.get('displaySettings.rows.res.display');
      }
    }]

  };
};

export default class SequenceCanvas extends SequenceCanvasMixin {
  constructor(options = {}) {
    var sequence = options.sequence;
    _.defaults(options, {
      lines: defaultLines(sequence),
      editable: !sequence.get('readOnly'),
      layoutSettings: {
        gutterWidth: sequence.get('displaySettings.rows.hasGutters') ? 30 : 0
      }
    });

    super(options);

    this.view.listenTo(this.view, 'resize', this.refreshFromResize);
    this.sequence.on('change:displaySettings.*', this.refresh);
    // this.on('scroll', (event, yOffset) => {
    //   this.sequence.set('displaySettings.yOffset', yOffset, {
    //     silent: true
    //   }).throttledSave();
    // });
  }
}

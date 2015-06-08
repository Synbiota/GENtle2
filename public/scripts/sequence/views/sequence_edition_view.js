import Styles from '../../styles';
const LineStyles = Styles.sequences.lines;
/**
@module Sequence
@submodule Views
@class SequenceEditionView
**/
// define(function(require) {
  var template = require('../templates/sequence_edition_view.hbs'),
      SequenceCanvas = require('../lib/sequence_canvas'),
      Gentle = require('gentle'),
      ContextMenuView = require('../../common/views/context_menu_view'),
      LinearMapView = require('../../linear_map/views/linear_map_view'),
      PlasmidMapView = require('../../plasmid_map/views/plasmid_map_view'),
      MatchedEnzymesView = require('./matched_enzymes_view'),
      Backbone = require('backbone'),
      Q = require('q'),
      SequenceEditionView;

  SequenceEditionView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'sequence-view',

    initialize: function() {
      var _this = this;

      this.model = Gentle.currentSequence;

      this.contextMenuView = new ContextMenuView({context: 'sequence'});

      this.matchedEnzymesView = new MatchedEnzymesView();
      this.setView('.sequence-matched-enzymes-outlet', this.matchedEnzymesView);

      this.initSecondaryViews();
    },

    initSecondaryViews: function(trigger) {
      var secondaryViews,
          currentView;

      secondaryViews = _.chain(Gentle.plugins)
        .where({type: 'sequence-secondary-view'})
        .pluck('data')
        .value();

      secondaryViews.push({
        name: 'linear',
        title: 'Linear map',
        view: LinearMapView
      });

      secondaryViews.push({
        name: 'plasmid',
        title: 'Plasmid map',
        view: PlasmidMapView
      });

      currentView = this.model.get('isCircular') ? 'plasmid' : 'linear';

      // if(!~_.pluck(secondaryViews, 'name').indexOf(currentView))
      //   currentView = 'linear';

      this.secondaryViews = secondaryViews;
      this.changeSecondaryView(currentView, false);
    },

    handleResizeRight: function(trigger) {
      $('#sequence-canvas-primary-view-outlet, .sequence-canvas-outlet').css({
        'right': this.secondaryView.$el.width(),
      });
      if(trigger !== false) {
        this.trigger('resize');
        this.secondaryView.trigger('resize');
      }
    },

    secondaryViewRightPos: function() {
      return $('#sequence-secondary-view-outlet').width();
    },

     primaryViewLeftPos: function() {
      return $('#sequence-primary-view-outlet').width();
    },

    changeSecondaryView: function(viewName, render) {
      var secondaryViewClass = _.findWhere(this.secondaryViews, {name: viewName});
      if(this.secondaryView) this.secondaryView.remove();
      this.secondaryView = new secondaryViewClass.view();

      this.model.set('displaySettings.secondaryView', viewName).throttledSave();

      this.setView('#sequence-canvas-secondary-view-outlet', this.secondaryView);
      var secondaryViewPromise;
      if(render !== false) {
        secondaryViewPromise = this.secondaryView.render();
      } else {
        secondaryViewPromise = Q.resolve();
      }
      // `handleResizeRight` requires secondaryView to be rendered so that
      // it (`this.secondaryView.$el.width()`) is the correct value.
      secondaryViewPromise.then(() => {
        this.handleResizeRight(false);
        if(render !== false) {
         this.sequenceCanvas.refresh();
        }
      });
    },

    afterRender: function() {
      this.$('.sequence-canvas-outlet').css({
        'right': this.secondaryView.$el.width(),
      });

      var sequence = this.model;

      var dnaStickyEndHighlightColour = function(reverse, base, pos) {
        return sequence.isBeyondStickyEnd(pos, reverse) && '#ccc';
      };

      var dnaStickyEndTextColour = function(reverse, defaultColour, base, pos) {
        return sequence.isBeyondStickyEnd(pos, reverse) ? '#fff' : defaultColour;
      };

      var sequenceCanvasLines = {

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
          textColour: _.partial(dnaStickyEndTextColour, false, LineStyles.dna.text.color),
          highlightColour: _.partial(dnaStickyEndHighlightColour, false),
          selectionColour: LineStyles.dna.selection.fill,
          selectionTextColour: LineStyles.dna.selection.color
        }],

        // Complements
        complements: ['DNA', {
          height: 15,
          baseLine: 15,
          textFont: LineStyles.complements.text.font,
          textColour: _.partial(dnaStickyEndTextColour, true, LineStyles.complements.text.color),
          highlightColour: _.partial(dnaStickyEndHighlightColour, true),
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
            return sequence.features && sequence.get('displaySettings.rows.features');
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

      var sequenceCanvas = this.sequenceCanvas = new SequenceCanvas({
        sequence: sequence,
        container: this.$('.sequence-canvas-outlet').first(),
        contextMenuView: this.contextMenuView,
        lines: sequenceCanvasLines,
        yOffset: sequence.get('displaySettings.yOffset'),
        // non library option
        contextMenu: this.contextMenuView,
        view: this
      });

      this.listenTo(this, 'resize', sequenceCanvas.refreshFromResize);

      _.each(['change:sequence change:features'], (eventName) => {
        sequence.on(eventName, () => sequenceCanvas.trigger(eventName));
      });

      sequenceCanvas.on('scroll', (event, yOffset) => {
        sequence.set('displaySettings.yOffset', yOffset, {
          silent: true
        }).throttledSave();
      });
      this.sequenceCanvas.refresh();
      this.contextMenuView.$assumedParent = this.$('.scrolling-parent').focus();
      this.contextMenuView.boundTo = this.sequenceCanvas;
    },

  });
export default SequenceEditionView;
  // return SequenceEditionView;
// });

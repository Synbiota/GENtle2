/**
@class RestrictionEnzymeReplacerView
@module Sequence
@submodule Views
**/
define(function(require) {
  var template = require('../templates/restriction_enzyme_replacer_view.hbs'),
    Backbone = require('backbone'),
    SequenceTranforms = require('../lib/sequence_transforms'),
    SynbioData = require('../../common/lib/synbio_data'),
    RestrictionEnzymes= require('../lib/restriction_enzymes'),
    Sequence = require('../models/sequence'),
    SequenceCanvas = require('../lib/sequence_canvas'),
    Styles = require('../../styles.json'),
    CondonSubView;

  var LineStyles = Styles.sequences.lines;


  CondonSubView = Backbone.View.extend({
    template: template,
    manage: true,

    initialize: function() {
      this.replacements = [];
    },



    serialize: function() {
      var _this = this;
      if (this.showModal === true) {
        _.forEach(this.nonCompliantMatches, function(match){
          _this.autoCorrectSuggestionForMatch(match);
        });
        // this.autoCorrectSuggestionForMatch(this.sequenceCanvas.selection);
      
        return {
          restrictionType: this.restrictionType,
          selection: this.selection,
          aminoAcidKeys: this.aminoAcids,
          aminoAcidSubs: this.aminoAcidSubs,
        };     
      } 
    },

    colorRedText: function(_base, _base_pos) {
      var basePairs=[];
      var subs = this.aminoAcidSubs;
      _.each(subs, function(aminoAcid){
        var firstBase= aminoAcid.modThreePosition*3;
        
        if (aminoAcid.codons.length !== 0){
          var n = firstBase;
          if (n < 0) {
            n = 0;
          }
          for (n ; n < (firstBase + 3); n++) {
            basePairs.push(n);
          }
        }        
      });

      basePairs = _.flatten(basePairs);

      if (_.includes(basePairs, _base_pos)) {
        return "#FF0000";
      } else {
        return LineStyles.complements.text.color;
      }

    },

    afterRender: function() {
      console.log('Sequence', this.sequence);

      if (this.showModal === true){
        $("#condonSubModal").modal("show");
        // highlight first one TODO: relies on the a specific structure to the handbars template, which is not smart. 
      
        $('.selectable').first().addClass('codon-selected');

        var paddedSubSeq= this.sequence.getPaddedSubSeq(0, this.sequence.get('sequence').length);
        var tempSequence = new Sequence({
          sequence: paddedSubSeq.subSeq,
          displaySettings: {
            rows: {
              aaOffset: 0,
              hasGutters: false,
              res: {
                manual: ['BsaI', 'NotI']
              },

            }
          },
        });

        var sequenceCanvasLines = {
          // Blank line
          topSeparator: ['Blank', {
            height: 5,
            visible: function() {
              return false;
            }
          }],
          // Aminoacids
          aa: ['DNA', {
            height: 15,
            baseLine: 15,
            textFont: LineStyles.aa.text.font,
            transform: function(base) {
              return tempSequence.getAA(tempSequence.get('displaySettings.rows.aa'), base, parseInt(tempSequence.get('displaySettings.rows.aaOffset')));
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
            drawSingleStickyEnds: true,
            textFont: LineStyles.dna.text.font,
            textColour: (_base, _base_pos) =>  {return this.colorRedText(_base, _base_pos);},
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
            getSubSeq: _.partial(tempSequence.getTransformedSubSeq, 'complements', {}),
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
          }],


          // Restriction Enzyme Sites
          restrictionEnzymeSites: ['RestrictionEnzymeSites', {
            floating: true,
          }],
        };

        this.tempSequenceCanvas = new SequenceCanvas({
          view: this,
          $canvas: this.$('.sequence-canvas-container canvas').first(),
          sequence: tempSequence,
          lines: sequenceCanvasLines
        });

        this.tempSequenceCanvas.refresh();

      }
    },

    events: {
      'click .close': 'closeModal',
    },


    selectableClicked: function(event){
      if(event) event.preventDefault();
      var selectedElement = $(event.target);

      var allSelectableButtons= selectedElement.parents('div .row').children('ul').children('li').children('button');
      
      _.each(allSelectableButtons, function(selectableButton) {
        $(selectableButton).removeClass('codon-selected');
      });
      
      selectedElement.addClass(' codon-selected');

    },

    closeModal: function(event) {
      if(event) event.preventDefault();
      $("#condonSubModal").modal("hide");
    },

    replaceCodon: function(event) {
      // if(event) event.preventDefault();
      // var selectedLink= $('.codon-selected');
      // if (selectedLink.length === 0 || _.isUndefined(selectedLink)) {
      //   // do nothing
      // } else {
      //   var replacementCodon = selectedLink.data("codon");
      //   var replacementPosition = selectedLink.parents('ul').data('position');
      //   var selection = this.selection;
      //   var paddedSubSeq= this.sequence.getPaddedSubSeq(this.selection[0], this.selection[1], 3, 0);
      //   var subSeq = paddedSubSeq.subSeq;
      //   var paddingOffset = selection[0] - paddedSubSeq.startBase;
      //   var newSubSeq = subSeq.substr(0, replacementPosition*3) + replacementCodon + subSeq.substr((replacementPosition*3 + 3), subSeq.length - replacementPosition*3 - 3);
      //   var text = newSubSeq.substr(paddingOffset, (selection[1] - selection[0] + 1));

      //   var replacementCodonStartBase = selection[0] + replacementPosition*3;

      //   if(text) {
      //     if(selection) {
      //       this.selection = undefined;
      //       this.sequence.deleteBases(
      //         selection[0],
      //         selection[1] - selection[0] + 1
      //       );
      //     }

      //     this.sequenceCanvas.afterNextRedraw(function() {
      //       console.log('callback called');

      //       this.highlight = undefined;
      //       this.select(
      //         replacementCodonStartBase, (replacementCodonStartBase + 2)
      //       );          
      //       this.displayCaret(replacementCodonStartBase + 3);
      //       this.focus();
      //     });


      //     this.sequenceCanvas.sequence.insertBases(text, selection[0]);          
      //     this.showModal=false;
      //     $("#condonSubModal").modal("hide");

      //     this.sequenceCanvas.redraw();

         
      //   }
      // }
    },
    
    hasRelevantRES: function(sequence) {
      var matches = RestrictionEnzymes.getAllInSeq(sequence, {customList: ['BsaI', "NotI"]});  
      return !_.isUndefined(matches[0]);
    },

    hasBsaIRES: function(sequence){
      var matches = RestrictionEnzymes.getAllInSeq(sequence, {customList: ['BsaI']});  
      return !_.isUndefined(matches[0]);
    },

    hasNotIRES: function(sequence){
      var matches = RestrictionEnzymes.getAllInSeq(sequence, {customList: ['NotI']});  
      return !_.isUndefined(matches[0]);
    },

    autoCorrectSuggestionForMatch: function(match){
      // TODO: Get correct reading frame
      console.log("pmatch", match);
      if (_.isArray(match)){
        match = match[0];
      }
      console.log("this", this);
      var paddedSubSeq= this.sequence.getPaddedSubSeq(match.cut, (match.seq.length - 1), 3, 0);
      var subSeq = paddedSubSeq.subSeq;
      var paddingOffset = match.cut - paddedSubSeq.startBase;
      
      var getAASubSeq = function(sequence) { 
        return _.map(sequence.match(/.{1,3}/g), SequenceTranforms.codonToAALong);
      };


      var baseAA= getAASubSeq(subSeq);
      var aaSubs= {};

      // Get all possible substitutes
      for(var i=0; i<baseAA.length; i++){
        var aminoAcid= baseAA[i];
        var aaData= SynbioData.aa;
        var potentialCodons = _.clone(_.findWhere( aaData, {long: aminoAcid}).codons);
        var currentCodon= subSeq.match(/.{1,3}/g)[i];
        if (_.includes(potentialCodons, currentCodon)){
          potentialCodons.splice(potentialCodons.indexOf(currentCodon), 1);  
        }
        
        var loopLength = potentialCodons.length;
        var codonsToRemove = [];
        for(var z=0; z<loopLength; z++){
          // Iterate through each potential codon
          var _codon= potentialCodons[z];

          // Make a new subsequence of the codon substitution
          var newSubSeq = subSeq.substr(0, i*3) + _codon + subSeq.substr((i*3 + 3), subSeq.length - i* - 3);
          var newUnpaddedSubSeq = newSubSeq.substr(paddingOffset, subSeq.length);
          var hasRES = this.hasRelevantRES(newUnpaddedSubSeq);
          // If its still a BSA1 or Not1 site, remove it from the list of potential codons
          if (hasRES) {
            if (_.includes(potentialCodons, _codon)){
              codonsToRemove.push(_codon);  
            } 

          } 
        }

        potentialCodons= _.without(potentialCodons, ...codonsToRemove);
        var bestMatchCodon = function(potentialCodons) {
          return potentialCodons.first();
        };
        // Pick the best
        console.log('potentialCodons', potentialCodons);
        var replacement = { 
          originalCodon: currentCodon,  
          adminoAcid: aminoAcid,
          startBase: match.cut, 
          endBase: (match.seq.length -1),
          generatedSub: bestMatchCodon
        };

        this.replacements.push(replacement); 
        console.log(this.replacements);
      }
    },

  });

  return CondonSubView;
});
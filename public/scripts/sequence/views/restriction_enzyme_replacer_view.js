/**
@class RestrictionEnzymeReplacerView
@module Sequence
@submodule Views
**/
// define(function(require) {
  var template = require('../templates/restriction_enzyme_replacer_view.hbs'),
    Backbone = require('backbone'),
    SequenceTranforms = require('gentle-sequence-transforms'),
    SynbioData = require('../../common/lib/synbio_data'),
    RestrictionEnzymes= require('gentle-restriction-enzymes'),
    Sequence = require('../models/sequence'),
    SequenceCanvas = require('gentle-sequence-canvas'),
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
        _this.autoCorrectSuggestionForMatch(this.nonCompliantMatches);
        // this.autoCorrectSuggestionForMatch(this.sequenceCanvas.selection);
        return {
          replacements: this.replacements,
        };     
      } 
    },

    colorRESText: function(changeableBases, offset, _base_pos) {
      _base_pos = Number(_base_pos) + Number(offset);
      if (_.includes(changeableBases, _base_pos)) {
        return "#000000";
      } else {
        return LineStyles.complements.text.color;
      }

    },


    colorWhiteText: function(changeableBases, offset, _base_pos) {
      return "#FFFFFF";
    },

    highlightBlueText: function(_base) {

      if (_base == " ")
        { return "#ffffff"; }
      else
        { return "#428BCA"; }
    },


    afterRender: function() {

      if (this.showModal === true){
        this.sequenceCanvases = [];
        $("#condonSubModal").modal("show");
        // highlight first one TODO: relies on the a specific structure to the handbars template, which is not smart.       
        //for (var i=1; i <= Object.keys(this.replacements).length; i++) {
        //this.replacements.forEach(function(_replacement) {


        _.each(this.replacements, (_replacement, i) => {
          i = i^0 + 1;
          let paddedSubSeq= _replacement.paddedSubSeq;
          let tempSequence = new Sequence({
            sequence: paddedSubSeq.subSeq,
            displaySettings: {
              rows: {
                aaOffset: (paddedSubSeq.startBase) % 3,
                hasGutters: false,
                res: {
                  manual: ['BsaI', 'NotI']
                },

              }
            },
          });

          let sequenceCanvasLines = {

            topSeparator: ['Blank', {height: 5}],

            position: ['Position', {
              height: 15,
              baseLine: 15,
              textFont: LineStyles.position.text.font,
              textColour: LineStyles.position.text.color,
              transform: function(base) { 
                return base+_replacement.subSeqOffset-1;
              },
              //visible: _.memoize2(function() {
              //  return _this.sequence.get('displaySettings.rows.numbering');
              //})
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
              textColour: (_base, _base_pos) =>  {return this.colorRESText(_replacement.changeableBases, _replacement.subSeqOffset ,_base_pos);},
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

            substitutionSeparator: ['Blank', {height: 2}],

            substitution: ['DNA', {
              height: 15,
              baseLine: 15,
              textFont: LineStyles.dna.text.font,
              textColour: (_base, _base_pos) =>  {return this.colorWhiteText(_replacement.changeableBases, _replacement.subSeqOffset ,_base_pos);},
              lineHighlightColor: (_base) => {return this.highlightBlueText(_base);},
              
              getSubSeq: function() { return _replacement.paddedReplacementCodon; } 
            }],

            // Restriction Enzyme Sites
            restrictionEnzymeSites: ['RestrictionEnzymesSites', {
              floating: true,
            }],
          };
        
          // let canvasId = `.sequence-canvas-container-${obj - 1} canvas`;
          // let tempSequenceCanvas = new SequenceCanvas({
          //   view: this,
          //   $canvas: this.$(canvasId).first(),
          //   sequence: tempSequence,
          //   lines: sequenceCanvasLines
          // });

          var tempSequenceCanvas = new SequenceCanvas({
            sequence: tempSequence,
            container: this.$(`.sequence-canvas-outlet-${i}`).first(),
            lines: sequenceCanvasLines,
            layoutSettings: {
              basesPerBlock: 10
            }
          });

          tempSequenceCanvas.refresh();
          this.sequenceCanvases.push(tempSequenceCanvas);
          
        }); // forEach



      }
    },

    events: {
      'click .cancel': 'closeModal',
      'click .replace': 'fixSequence',
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

    fixSequence: function(event) {
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

      /*
           this.sequenceCanvas.afterNextRedraw(function() {
             console.log('callback called');

             this.highlight = undefined;
             this.select(
               replacementCodonStartBase, (replacementCodonStartBase + 2)
             );          
             this.displayCaret(replacementCodonStartBase + 3);
             this.focus();
           });


      //     this.sequenceCanvas.sequence.insertBases(text, selection[0]);          
      //     this.showModal=false;
      //     $("#condonSubModal").modal("hide");

      //     this.sequenceCanvas.redraw();
      */
         
      //   }
      // }

      if(event) { event.preventDefault();}
      var sequence = this.sequence;

      _.each(this.replacements, function(replacement) {

        sequence.deleteBases(replacement.bestStartBase, 3, true);
        sequence.insertBases(replacement.bestReplacementCodon, replacement.bestStartBase, true);

      })

      //this.sequenceCanvas.afterNextRedraw(function() {

      //  this.highlight = undefined;
      //  this.select(
      //    replacementCodonStartBase, (replacementCodonStartBase + 2)
      //  );          
      // this.displayCaret(replacementCodonStartBase + 3);
      //  this.focus();
      //});

      this.showModal=false;
      $("#condonSubModal").modal("hide");
      this.sequenceCanvas.redraw(); 
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

    autoCorrectSuggestionForMatch: function(matches){
      var sequence = this.sequence; 
      var _this =this;
      var matchNum= 0;

      this.replacements = _.reduce(matches, function(memo, n, key) {

        matchNum++
        var matchString= String(matchNum);
        memo[matchString]={
          allMatches: []
        }
        var match = n[0];
        
        var paddedSubSeq= sequence.getPaddedSubSeq(key, (Number(key) + match.seq.length - 1), 3, 0);
        var subSeq = paddedSubSeq.subSeq;
        var paddingOffset = key - paddedSubSeq.startBase;
        
        var getAASubSeq = function(sequence) { 
          return _.map(sequence.match(/.{3}/g), SequenceTranforms.codonToAALong);
        };

        var baseAA= getAASubSeq(subSeq);
        var aaData= SynbioData.codonOptimisations;
        // Get all possible substitutes
        for(var i=0; i<baseAA.length; i += 1){
          var aminoAcid= baseAA[i];
          
          var currentCodon= subSeq.match(/.{3}/g)[i];

          var potentialCodons = _.clone(aaData[currentCodon]);

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
            var hasRES = _this.hasRelevantRES(newUnpaddedSubSeq);
            // If its still a BSA1 or Not1 site, remove it from the list of potential codons
            if (hasRES) {
              if (_.includes(potentialCodons, _codon)){
                codonsToRemove.push(_codon);  
              } 

            } 

          }

          var codons= _.without(potentialCodons, ...codonsToRemove);
          var bestMatchCodon= codons[0];
          var startBase = Number(key) + i*3 - paddingOffset;
          var endBase = startBase + 3;
          var aminoIndex = i;   

          // Pick the best


          if (!_.isUndefined(bestMatchCodon) && bestMatchCodon !== null && bestMatchCodon !== "") {
            memo[matchString].allMatches.push({
              subSeqOffset: Number(key), 
              aminoAcid: aminoAcid, 
              originalCodon: currentCodon,  
              startBase: startBase, 
              endBase: endBase,
              generatedSub: bestMatchCodon,
              paddedSubSeq: paddedSubSeq,
              aminoIndex: Number(aminoIndex),
            });
          };
        }
        return memo;

      }, {});
  
      _.each(this.replacements, function(replacement) {

        // Get all the bases that can be changed


          var startBases = _.map(replacement.allMatches, function(_match) {return _match.startBase;})
          var changeableBases = [];
          _.each(startBases, function(startBase) {
            changeableBases.push(startBase);
            changeableBases.push(startBase + 1);
            changeableBases.push(startBase + 2);
          });

          replacement.changeableBases = changeableBases;



          replacement.subSeqOffset = replacement.allMatches[0].subSeqOffset;
          replacement.paddedSubSeq = replacement.allMatches[0].paddedSubSeq;
          replacement.bestReplacementCodon = replacement.allMatches[0].generatedSub;
          replacement.bestStartBase = replacement.allMatches[0].startBase;
          replacement.bestEndBase = replacement.allMatches[0].endBase;
          

          var marginOffset = (replacement.bestStartBase - replacement.subSeqOffset);
          if(marginOffset < 0) { marginOffset = 0; }

          replacement.paddedReplacementCodon = " ".repeat(marginOffset) + replacement.bestReplacementCodon;
          replacement.marginOffset = marginOffset * 10
      }) 

    },

  });

  export default CondonSubView;
// });
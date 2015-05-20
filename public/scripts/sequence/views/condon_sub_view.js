/**
@class CondonSubView
@module Sequence
@submodule Views
**/
define(function(require) {
  var template = require('../templates/condon_sub_view.hbs'),
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
      this.selection = null;
      this.subCodonPosY = null;
      this.subCodonPosX = null;
      this.aminoAcids = null;
      this.aminoAcidSubs = null;
    },



    serialize: function() {

      if (this.showModal === true) {
        this.positionXY = [this.sequenceCanvas.getXPosFromBase(this.sequenceCanvas.selection[0]), this.sequenceCanvas.getYPosFromBase(this.sequenceCanvas.selection[0])];
        if (this.positionXY[0] <=110) {
          this.subCodonPosX  = this.positionXY[0] ;   
        } else {
          this.subCodonPosX = this.positionXY[0] - 110;   
        }

        this.subCodonPosY = this.positionXY[1] + 120 - this.sequenceCanvas.sequence.get("displaySettings.yOffset");

        this.sequence = this.sequenceCanvas.sequence;
        this.selection= this.sequenceCanvas.selection;
        this.paddedSubSeq = this.sequence.getPaddedSubSeq(this.selection[0], this.selection[1], 3, 0);
        var newUnpaddedSubSeq = this.paddedSubSeq.subSeq.substr((this.selection[0] - this.paddedSubSeq.startBase), this.paddedSubSeq.length);
        this.newUnpaddedSubSeq = newUnpaddedSubSeq;
        if (this.hasBsaIRES(newUnpaddedSubSeq)){
          this.restrictionType = "BsaI";  
        } else if (this.hasNotIRES(newUnpaddedSubSeq)) {
          this.restrictionType = "NotI";
        }
        
        this.autoCorrectSuggestions(this.sequenceCanvas.selection);
      
        return {
          restrictionType: this.restrictionType,
          selection: this.selection,
          subCodonPosY: this.subCodonPosY,
          subCodonPosX: this.subCodonPosX,
          aminoAcidKeys: this.aminoAcids,
          aminoAcidSubs: this.aminoAcidSubs,
        };     
      } else {
        return {
          selection: {}
        };
      }
    },

    boldNBasePairs: function(_base, _base_pos) {
      var matches = RestrictionEnzymes.getAllInSeq(this.newUnpaddedSubSeq, {customList: ['BsaI']});  
      if (!_.isUndefined(matches[0])) {
        var direction= matches[0][0].name.charAt(matches[0][0].name.length -1 );
        if(direction=='←') {
          if (_base_pos <= 4) {
            return LineStyles.dna.text.color;    
          } else {
            return LineStyles.complements.text.color;    
          }
        } else{
         if (_base_pos >= 7 && _base_pos <= 11) {
            return LineStyles.dna.text.color;    
          } else {
            return LineStyles.complements.text.color;    
          }
        } 

      }else {
        return LineStyles.complements.text.color;
      } 

    },

    afterRender: function() {

      if (this.showModal === true){
        $("#condonSubModal").modal("show");
        // highlight first one TODO: relies on the a specific structure to the handbars template, which is not smart. 
      
        $('#condonSubModal').children().children('.modal-body').children('.row:nth-child(1)').children('div:nth-child(1)').children().children().children().children('button').first().addClass('codon-selected');

        var paddedSubSeq= this.paddedSubSeq;

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

        var _this = this;

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
            textColour: (_base, _base_pos) =>  {return this.boldNBasePairs(_base, _base_pos);},
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
      'click .replace': 'replaceCodon',
      'click .selectable': 'selectableClicked',
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
      if(event) event.preventDefault();
      var selectedLink= $('.codon-selected');
      if (selectedLink.length === 0 || _.isUndefined(selectedLink)) {
        // do nothing
      } else {
        var replacementCodon = selectedLink.data("codon");
        var replacementPosition = selectedLink.parents('ul').data('position');
        var selection = this.selection;
        var paddedSubSeq= this.sequence.getPaddedSubSeq(this.selection[0], this.selection[1], 3, 0);
        var subSeq = paddedSubSeq.subSeq;
        var paddingOffset = selection[0] - paddedSubSeq.startBase;
        var newSubSeq = subSeq.substr(0, replacementPosition*3) + replacementCodon + subSeq.substr((replacementPosition*3 + 3), subSeq.length - replacementPosition*3 - 3);
        var text = newSubSeq.substr(paddingOffset, (selection[1] - selection[0] + 1));

        var replacementCodonStartBase = selection[0] + replacementPosition*3;

        if(text) {
          if(selection) {
            this.selection = undefined;
            this.sequence.deleteBases(
              selection[0],
              selection[1] - selection[0] + 1
            );
          }

          this.sequenceCanvas.afterNextRedraw(function() {
            console.log('callback called');

            this.highlight = undefined;
            this.select(
              replacementCodonStartBase, (replacementCodonStartBase + 2)
            );          
            this.displayCaret(replacementCodonStartBase + 3);
            this.focus();
          });


          this.sequenceCanvas.sequence.insertBases(text, selection[0]);          
          this.showModal=false;
          $("#condonSubModal").modal("hide");

          this.sequenceCanvas.redraw();

         
        }
      }
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

 

    autoCorrectSuggestions: function(selection){
      
      // TODO: Get correct reading frame
      var paddedSubSeq = this.paddedSubSeq;
      var subSeq = paddedSubSeq.subSeq;
      var paddingOffset = selection[0] - paddedSubSeq.startBase;
      var getAASubSeq = function(sequence) { 
        return _.map(sequence.match(/.{1,3}/g), SequenceTranforms.codonToAALong);
      };


      var baseAA= getAASubSeq(subSeq);
      var aaSubs= {};

      console.log("getAASubSeq", baseAA);


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
        var codonsToRemove = []
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
        aaSubs[i]={};
        aaSubs[i].aminoAcid = aminoAcid;
        aaSubs[i].codons = potentialCodons;  
        aaSubs[i].modThreePosition = i;

        if (potentialCodons.length === 0) {
          aaSubs[i].color= LineStyles.complements.text.color;      
        } else {
          aaSubs[i].color= '#428bca'
        }
      }

      this.aminoAcids= _.keys(aaSubs);
      this.aminoAcidSubs= aaSubs;
    },

  });

  return CondonSubView;
});
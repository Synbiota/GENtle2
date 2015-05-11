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
    CondonSubView;


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
        this.subCodonPosX = this.positionXY[0] - 110;
        this.subCodonPosY = this.positionXY[1] + 120;

        this.sequence = this.sequenceCanvas.sequence;
        this.selection= this.sequenceCanvas.selection;
        this.autoCorrectSuggestions(this.sequenceCanvas.selection);
      
      
        return {
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

    afterRender: function() {
      if (this.showModal === true){
        $("#condonSubModal").modal("show");
        // highlight first one
        $('#condonSubModal').children().children('.modal-body').children('.row').children('ul ').children('li:nth-child(2)').children().first().addClass('codon-selected');
      }
    },

    events: {
      'click .close': 'closeModal',
      'click .replace': 'replaceCodon',
      'click .selectable': 'selectableClicked'
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
      var selectedLink= $('.selected');
      if (selectedLink.length === 0 || _.isUndefined(selectedLink)) {
        // do nothing
      } else {
        var replacementCodon = selectedLink.data("codon");
        var replacementPosition = selectedLink.parents('ul').data('position');
        var selection = this.selection;
        var caretPosition = (this.selection[0]+1);
        var paddedSubSeq= this.sequence.getPaddedSubSeq(this.selection[0], this.selection[1], 3, 0);
        var subSeq = paddedSubSeq.subSeq;
        var paddingOffset = selection[0] - paddedSubSeq.startBase;
        var newSubSeq = subSeq.substr(0, replacementPosition*3) + replacementCodon + subSeq.substr((replacementPosition*3 + 3), subSeq.length - replacementPosition*3);
        var text = newSubSeq.substr(paddingOffset, subSeq.length);

      

        if(text) {
          if(selection) {
            debugger
            this.selection = undefined;
            this.sequence.deleteBases(
              selection[0],
              selection[1] - selection[0] + 1
            );
          }
          this.sequenceCanvas.sequence.insertBases(text, caretPosition);
          this.sequenceCanvas.displayCaret(caretPosition + text.length);
          this.sequenceCanvas.focus();
          this.showModal=false;
          $("#condonSubModal").modal("hide");
        }
      }
    },
    
    hasRelevantRES: function(sequence) {
      var matches = RestrictionEnzymes.getAllInSeq(sequence, {customList: ['BsaI', "NotI"]});  
      return !_.isUndefined(matches[0]);
    },

    autoCorrectSuggestions: function(selection){
      
      // TODO: Get correct reading frame
      var paddedSubSeq= this.sequence.getPaddedSubSeq(this.selection[0], this.selection[1], 3, 0);
      var subSeq = paddedSubSeq.subSeq;
      var paddingOffset = selection[0] - paddedSubSeq.startBase;
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
        potentialCodons.splice(potentialCodons.indexOf(currentCodon), 1);
        
        for(var z=0; z<potentialCodons.length; z++){
          // Iterate through each potential codon
          var _codon= potentialCodons[z];
          // Make a new subsequence of the codon substitution
          var newSubSeq = subSeq.substr(0, i*3) + _codon + subSeq.substr((i*3 + 3), subSeq.length - i*3);
          var newUnpaddedSubSeq = newSubSeq.substr(paddingOffset, subSeq.length);
          var hasRES = this.hasRelevantRES(newUnpaddedSubSeq);

          // If its still a BSA1 or Not1 site, remove it from the list of potential codons
          if (hasRES) {
            potentialCodons.splice(potentialCodons.indexOf(_codon), 1);
          }

        }

        if (potentialCodons.length !== 0) {
          aaSubs[aminoAcid]={};
          aaSubs[aminoAcid].codons = potentialCodons;  
          aaSubs[aminoAcid].modThreePosition = i;
        }
      }

      this.aminoAcids= _.keys(aaSubs);
      this.aminoAcidSubs= aaSubs;
    },

  });

  return CondonSubView;
});
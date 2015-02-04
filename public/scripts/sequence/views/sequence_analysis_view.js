define(function(require){

  var Backbone = require('backbone.mixed'),
      template = require('../templates/sequence_analysis_view.hbs'),
      _ = require('underscore'),
      SequenceAnalysisView;

  var analysisRubric = {
    sequence: function(fragment){
      return '5\'- ' + fragment + ' -3\'';
    },

    complement: function(fragment){
      var fragmentComplement = ""

      _.each(fragment.split(""), function(nucleotide){
        var complementaryNucleotide
        switch (nucleotide){
          case 'A':
            complementaryNucleotide = 'T'
            break;
          case 'T':
            complementaryNucleotide = 'A'
            break;
          case 'C':
            complementaryNucleotide = 'G'
            break;
          case 'G':
            complementaryNucleotide = 'C'
            break;
        }
        fragmentComplement = fragmentComplement + complementaryNucleotide;
      })

      return '5\'- ' + fragmentComplement + ' -3\'';
    },

    length: function(fragment){
      return fragment.length
    },
    weight: function(fragment){
      return 'weight ' + fragment
    }
  }


  SequenceAnalysisView = Backbone.View.extend({
    manage: true,
    template: template,

    calculateResults: function(fragment){

      this.results = {}
      var _this = this

      _.forEach(analysisRubric, function(calculation, analysisType){
        _this.results[analysisType] = calculation(fragment)
      })

    },

    serialize: function(){
      return {
        results: this.results
      };
    }


  })

  return SequenceAnalysisView;

})

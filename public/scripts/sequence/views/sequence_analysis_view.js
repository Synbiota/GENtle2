define(function(require){

  var Backbone = require('backbone'),
      template = require('../templates/sequence_analysis_view.hbs'),
      _ = require('underscore'),
      SequenceCalculations = require('../lib/sequence_calculations.js'),
      SequenceAnalysisView;

  var analysisRubric = [
    {
      name: "Sequence",
      unit: "",
      formula: function(fragment){
        return '5\'- ' + fragment + ' -3\'';
      },
    },

    {
      name: "Complement",
      unit: "",
      formula: function(fragment){
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
    },

    {
      name: "Length",
      unit: "",
      formula: function(fragment){
        return fragment.length
      },
    },

    {
      name: "Molecular Weight",
      unit: "g/mole",
      formula: SequenceCalculations.molecularWeight,
    },

    {
      name: "CG Content",
      unit: "%",
      formula: SequenceCalculations.gcContent,
    },

    {
      name: "Melting Temperature",
      unit: "ºC",
      formula: SequenceCalculations.meltingTemperature
    }

  ]


  SequenceAnalysisView = Backbone.View.extend({
    manage: true,
    template: template,

    calculateResults: function(fragment){

      this.results = _.reduce(analysisRubric, function(memo, analysis){
        return memo.concat({
          name: analysis.name,
          result: analysis.formula(fragment),
          unit: analysis.unit
        })
      }, [])

    },

    serialize: function(){
      return {
        results: this.results
      };
    }


  })

  return SequenceAnalysisView;

})

define(function(require){

  var Backbone = require('backbone.mixed'),
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
      unit: "bp",
      formula: function(fragment){
        return fragment.length
      },
    },

    {
      name: "Molecular Weight",
      unit: "g/mol",
      formula: function(){
        return (SequenceCalculations.molecularWeight.apply(this, arguments)).toFixed(2);
      }
    },

    {
      name: "GC Content",
      unit: "%",
      formula: function(){
        return (SequenceCalculations.gcContent.apply(this, arguments) * 100).toFixed(2);
      }
    },

    {
      name: "Melting Temperature",
      unit: "ºC",
      formula: function(){
        return (SequenceCalculations.meltingTemperature.apply(this, arguments)).toFixed(2);
      }
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

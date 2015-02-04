define(function(require){

  var Backbone = require('backbone.mixed'),
      template = require('../templates/sequence_analysis_view.hbs'),
      _ = require('underscore'),
      SequenceAnalysisView;

  var analysisRubric = {
    length: function(fragment){
      return 'length ' + fragment
    },
    weight: function(fragment){
      return 'weight ' + fragment
    }
  }


  SequenceAnalysisView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'abcd',


    calculateResults: function(fragment){

      this.results = {}
      var _this = this

      _.forEach(analysisRubric, function(calculation, analysisType){
        _this.results[analysisType] = calculation(fragment)
      })

    },

    serialize: function(){
      console.log(this.results);
      return {
        results: this.results
      };
    }


  })

  return SequenceAnalysisView;

})

import Backbone from 'backbone';
import Gentle from 'gentle';
import template from '../templates/chromatograph_import_prompt_view.hbs';
import Filetypes from '../../../common/lib/filetypes/filetypes.js';
import _ from 'underscore';

export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'click .btn': 'clickInputElement',
    'change input[name=file]': 'openSequenceFromFile'
  },

  initialize: function(){
    this.$el.css({'text-align': 'center'})
  },

  openSequenceFromFile: function(event) {
    event.preventDefault();
    var input     = this.$('input[name=file]')[0],
        _this     = this;

    var onLoad = function(result) {
      Filetypes.guessTypeAndParseFromArrayBuffer(result.content, result.name).then ( function ( sequences ) {
        if ( sequences.length ) {
          _.forEach(sequences, function(sequence){
            Gentle.currentSequence.addChromatogram(sequence)
          })
        }
         else alert('Could not parse the sequence.');
      } , function (err) {
        console.log(err);
        alert('Could not parse the sequence.');
      } ) ;
    };

    var onError = function(filename) {
      alert('Could not load file ' + filename);
    };

    _.each(input.files, function(file) {
      Filetypes.loadFile(file,true).done(onLoad, onError);
    });
  },

  clickInputElement: function(event) {
    event.preventDefault();
    this.$('input[name=file]').click();
  },


})

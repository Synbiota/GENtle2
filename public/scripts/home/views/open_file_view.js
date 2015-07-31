/**
@module Home
@submodule Views
@class OpenFileView
**/
import _ from 'underscore';
import Backbone from 'backbone';
import template from '../templates/open_file_view.hbs';
import Filetypes from '../../common/lib/filetypes/filetypes';
import Gentle from 'gentle';
import dropzone from '../../common/lib/dropzone';


  var OpenFileView = Backbone.View.extend({
    manage: true,
    template: template,
    className: 'home-open-file',

    events: {
      'click .home-open-file-form a.btn': 'clickInputElement',
      'change .home-open-file-form input[name=file]': 'openSequenceFromFile'
    },
    
    openSequenceFromFile: function(event) {
      event.preventDefault();
      var $form     = $('.home-open-file-form').first(),
          input     = $form.find('input[name=file]')[0];

      var onLoad = function(result) {
        Filetypes.guessTypeAndParseFromArrayBuffer(result.content, result.name)
        .then(function(sequences) {
          if(sequences.length) {
            Gentle.addSequencesAndNavigate(sequences);
          } else {
            console.error('Filename: ', result.name, '\nsequences: ', sequences);
            alert('Could not parse the sequence.');
          }
        })
        .catch(function(err) {
          console.error(err, '\nFilename: ', result.name);
          alert('Could not parse the sequence.');
        })
        .done();
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
      this.$('.home-open-file-form input[name=file]').click();
    },

    afterRender: function() {
      this.setupDropzone();
    },

    setupDropzone: function() {
      var $dropzone = 
        this.$('.fullscreen-filedropzone');

      dropzone.init.call(this, $dropzone, function(sequences) {
        Gentle.addSequencesAndNavigate(sequences);
      });
    },

    cleanup: function() {
      dropzone.remove.call(this);
    }


  });
export default OpenFileView;

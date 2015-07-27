import $ from 'jquery';
import Q from 'q';
import _ from 'underscore';
import uploadMultipleSequences from './upload_multiple_sequences';
import {View} from 'backbone';

function checkThis(view) {
  if(!(view instanceof View)) {
    throw new Error('Needs to be bound to the view');
  }
}

function init($dropzone, callback) {
  checkThis(this);
  this.$dropzone = $dropzone;

  $('body').append($dropzone);

  var zone = $dropzone
    .filedrop({
      multiple: true,
      fullDocDragDetect: true
    })
    .filedrop()
    .event('dragEnter', function() {
      $dropzone.addClass('dropzone-visible');
    })
    .event('dragLeave', function() {
      $dropzone.removeClass('dropzone-visible');
    })
    .event('upload', (event) => {
      $dropzone.removeClass('dropzone-visible');

      var listEntries = function(file) {
        return Q.promise(function(resolve, reject) {
          if(
            (file.nativeEntry && file.nativeEntry.isDirectory)
          ) {
            file.listEntries(function(entries) {
              resolve(_.reject(entries, function(entry) {
                return _.isNull(entry.nativeFile);
              }));
            }, reject);
          } else {
            resolve(file);
          }
        });
      };

      Q.all(_.map(zone.filedrop.eventFiles(event), listEntries))
        .then(_.flatten)
        .then(uploadMultipleSequences)
        .then(callback.bind(this))
        .done();
    });
}

function remove() {
  checkThis(this);
  if(this.$dropzone) {
    this.$dropzone.remove();
    delete this.$dropzone;
  }
}

export default {init, remove};
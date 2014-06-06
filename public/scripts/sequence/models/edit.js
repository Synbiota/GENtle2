/**
Edit string validation
@class Edit
@module Sequence
@submodule Models
**/
define(function(require) {
  var Backbone = require('backbone.mixed'),
    _ = require('underscore.mixed'),
    Edit;

  Edit = Backbone.Model.extend({

    valid: function(string, id) {

      if (!string.replace(/\s/g, '').length && id == "name") {
        return 'Unnamed';
      } else if (!string.replace(/\s/g, '').length && id == "desc") {
        return 'No Description';
      } else {
        return string;
      }
    }
  });

  return Edit;
});
/**
@class EditView
@module Sequence
@submodule Views
**/
define(function (require) {
    var template = require('hbars!sequence/templates/edit_settings_view'),
        Backbone = require('backbone.mixed'),
        Gentle = require('gentle')(),
        ls = require('localstorage'),
        Sequences = require('sequence/models/sequences'),
        EditView;

    EditView = Backbone.View.extend({

        manage: true,

        template: template,


        initialize: function () {

            this.model = Gentle.currentSequence;
        },

        events: {
            'click .sequence-save-button': 'readinfo',
        },

        readinfo: function(event){
        
        },

        updateNameDescription: function () {

        },


        serialize: function(){
        return {         
         Name : this.model.name,
         Desc : this.model.description
        };
        }

    });
    return EditView;

});
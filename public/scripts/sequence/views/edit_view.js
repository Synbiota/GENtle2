/**
@class EditView
@module Sequence
@submodule Views
**/
define(function(require) {
    var template = require('hbars!sequence/templates/edit_view'),
        Backbone = require('backbone.mixed'),
        Gentle = require('gentle')(),
        Sequences = require('sequence/models/sequences'),
        EditView;

    EditView = Backbone.View.extend({
        manage: true,
        template: template,

        initialize: function() {
            this.model = Gentle.currentSequence;
        },

        events: {
            'click input[type=submit]': 'updateNameDescription',
        },

        updateNameDescription: function(event) {
            this.model.set('name', this.$('#name').val() || 'Unnamed');
            this.model.set('description', this.$('#desc').val() || 'No Description');
            this.model.sync('update', this.model);
            document.title = this.model.get('name');
        },

        serialize: function() {

            return {

                Name: this.model.get('name'),
                Desc: this.model.get('description')
            };

        }
    });
    return EditView;

});
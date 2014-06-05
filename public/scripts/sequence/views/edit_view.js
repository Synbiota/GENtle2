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
        this.collections = Sequences;
        },

        events: {
            'click .sequence-save-button': 'updateNameDescription',
        },

        updateNameDescription: function(event) {

            this.model.set('name',this.$('#name').val());
            this.model.set('description',this.$('#desc').val());
            this.model.sync('update',this.model);

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
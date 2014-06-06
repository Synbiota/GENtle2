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
        Edit = require('sequence/models/edit'),
        EditView;

    EditView = Backbone.View.extend({
        manage: true,
        template: template,

        initialize: function() {
            this.model = Gentle.currentSequence;
            Edit = new Edit();
        },

        events: {
            'click input[type=submit]': 'updateNameDescription',
        },

        updateNameDescription: function(event) {
            this.model.set('name', Edit.valid(this.$('#name').val(), 'name'));
            this.model.set('description', Edit.valid(this.$('#desc').val(), 'desc'));
            this.model.sync('update', this.model);
            document.title = this.model.get('name')+' / Gentle';
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
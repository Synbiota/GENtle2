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
            'click input[type=submit]': 'readinfo',
        },

        readinfo: function(event) {
            this.error = '';
            if (this.model.valid(this.$('#name').val(), 'name') == 'Unnamed') {
                this.error = true;
                this.render();
            } else {
                this.updateNameDescription();
                this.error = false;
            }
        },

        updateNameDescription: function() {
            this.model.set('name', this.$('#name').val());
            this.model.set('description', this.model.valid(this.$('#desc').val(), 'desc'));
            this.model.sync('update', this.model);
            document.title = this.model.get('name') + ' / Gentle';
            this.render();
        },

        serialize: function() {
            return {
                Name: this.model.get('name'),
                Desc: this.model.get('description'),
                error: this.error
            };

        },
    });

    return EditView;

});
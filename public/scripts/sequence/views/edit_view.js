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
            this.model.nameBefore = this.model.get('name');

        },

        events: {
            'click input[type=button]': 'readAndUpdate',
        },

        readAndUpdate: function(event) {

            var descript = 'No Description';
            this.model.isError=false;
            this.model.set({
            name: this.$('#name').val(),
            description: this.$('#desc').val(),
            }, {validate: true});

            if(!this.model.validationError[0].name || !this.model.validationError[0].description){ 
            if(this.model.validationError[0].name){
            this.model.isError = true;
            }else{
            this.model.set('name', this.$('#name').val());
            document.title = this.$('#name').val() + ' / Gentle';
            }
            if(this.model.validationError[0].description){
            this.model.set('description',descript);
            }else{
            this.model.set('description', this.$('#desc').val());
            }
            }
            this.model.save(); 
            this.render();
        },

        serialize: function() {
            return {
                Name: this.model.get('name'),
                Desc: this.model.get('description'),
                error: this.model.isError
            };

        },
    });

    return EditView;
});
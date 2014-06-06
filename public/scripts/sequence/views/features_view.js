/**
@module Sequence
@submodule Views
@class FeaturesView
**/
define(function(require) {
  var template        = require('hbars!sequence/templates/features_view'),
      Gentle          = require('gentle')(),
      SynbioData      = require('common/lib/synbio_data'),
      Backbone        = require('backbone.mixed'),
      BSConfirmation  = require('bootstrap-confirmation'),
      HistorySteps        = require('sequence/models/history_steps'),
      HistoryStep     = require('sequence/models/history_steps'),

      FeaturesView;
  
  FeaturesView = Backbone.View.extend({
    manage: true,
    template: template,
    events: {
      'click .sequence-feature-link': 'scrollToFeature',
      'click .sequence-feature-edit-button': 'startEditing',
      'click .sequence-feature-create-button': 'startCreating',
      'click .sequence-feature-edit-cancel-button': 'cancelEditing',
      'click .sequence-feature-edit-ranges-delete-button': 'deleteRange',
      'click .sequence-feature-edit-ranges-add-button': 'addRange',
      'click .sequence-feature-edit-save-button': 'saveFeature',
    },
     
    initialize: function() {
      this.model = Gentle.currentSequence;
      this.featureTypes = _.chain(SynbioData.featureTypes).clone()
        .forEach(function(type, typeId) { type.value = typeId; })
        .values()
        .groupBy('category')
        .value();
    },

    getFeatureFromElement: function(element) {
      var $element = $(element),
          featureId = $element.data('featureId');

      return _.find(this.model.get('features'), function(_feature) {
        return _feature._id == featureId;
      });
    },

    scrollToFeature: function(event) {
      var feature = this.getFeatureFromElement(event.currentTarget);

      event.preventDefault();

      this.sequenceCanvas.scrollToBase(feature.ranges[0].from);
    },

    startEditing: function(event) {
      var feature = this.getFeatureFromElement(event.currentTarget),
          ranges = feature.ranges;

      event.preventDefault();

      this.editedFeature = _.clone(feature);
      this.creating = false;
      this.setupRanges();
      this.refresh();
    },

    startCreating: function(event) {
      if(event) event.preventDefault();

      this.editedFeature = this.editedFeature || {
        ranges: [{}],
        _type: 'note'
      };

      this.creating = true;
      this.setupRanges();
      this.refresh();
    },

    createOnRange: function(firstBase, lastBase) {
      this.editedFeature = {
        ranges: [{
          from: firstBase,
          to: lastBase
        }],
        _type: 'noe'
      };
      if(!this.isOpen) this.$toggleButton.click();
      this.startCreating();
    },

    setupRanges: function() {
      var ranges = this.editedFeature.ranges;
      this.editedFeature.ranges = _.map(ranges, function(range, i) {
        return _.extend(range, {
          _id: i,
          _canDelete: ranges.length > 1,
          from: range.from == -1 ? '' : range.from + 1,
          to: range.to == -1 ? '' : range.to + 1,
          _canAdd: i == ranges.length - 1
        });
      });
    },

    addRange: function(event) {
      event.preventDefault();
      this.readValues();
      this.editedFeature.ranges.push({});
      this.setupRanges();
      this.refresh();
    },

    deleteRange: function(event) {
      var $element = $(event.currentTarget),
          rangeId = $element.data('rangeId');

      event.preventDefault();

      this.readValues();
      this.editedFeature.ranges = _.reject(this.editedFeature.ranges, function(range, i) {
        return i == rangeId;
      });

      this.setupRanges();
      this.refresh();
    },

    readValues: function() {
      var $form = this.$('form');

      this.editedFeature.name = $form.find('[name="name"]').val();
      this.editedFeature.desc = $form.find('[name="desc"]').val();
      this.editedFeature._type = $form.find('[name="type"]').val();
      this.editedFeature.ranges =  this.readRanges();
    },

    readRanges: function() {
     return  _.map(this.$('form').find('.sequence-feature-edit-ranges-list tbody tr'), function(row) {
        var $row = $(row),
            from = $row.find('[name="from"]').val()*1 - 1,
            to = $row.find('[name="to"]').val() * 1 - 1;

        return {
          from: from,
          to: to
        };
      });
    },

    saveFeature: function() {
      var ranges;
      
      this.readValues();
      this.errors = {};

      ranges = _.map(_.reject(this.editedFeature.ranges, function(range) {
        return  range.from === '' || range.from < 0 ||
                range.to   === '' || range.to   < 0;
      }), function(range) {
        delete range._canDelete;
        delete range._canAdd;
        return range;
      });

      if(this.editedFeature.name === undefined || this.editedFeature.name === '') {
        this.errors.name = true;
      }

      if(!ranges.length) {
        this.errors.ranges = true;
      }

      if(!_.keys(this.errors).length) {
        this.editedFeature.ranges = ranges;
        if(this.creating) {
          this.model.createFeature(this.editedFeature);
          this.historySteps.comparator(historyStep);
        } else {
          this.model.updateFeature(this.editedFeature);
        }
        this.cancelEditing();
      } else {
        this.setupRanges();
        this.refresh();
      }
    },

    deleteFeature: function(event) {
      event.preventDefault();
      this.model.deleteFeature(this.editedFeature._id);
      this.cancelEditing();
    },

    cancelEditing: function() {
      this.editedFeature = undefined;
      this.refresh();
    },

    refresh: function() {
      this.render();
      this.$('.sequence-settings-tab-link').click(); // Meh..
    },

    serialize: function() {
      if(this.isOpen) {
        if(this.editedFeature) {
          return {
            isOpen: true,
            creating: this.creating,
            editedFeature: this.editedFeature,
            errors: this.errors || {},
            featureTypes: this.featureTypes
          };
        } else {
          return {
            isOpen: true,
            features: this.model.get('features')
          };
        }
      } else return {};
    },

    afterRender: function() {
      this.sequenceCanvas = Gentle.layout.getView('#content').sequenceCanvas;
      $('.sequence-feature-delete-button').confirmation({
        popout: true,
        placement: 'top',
        onConfirm: _.bind(this.deleteFeature, this)
      });
    },

  });

  return FeaturesView;
});
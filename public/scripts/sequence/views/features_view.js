/**
@module Sequence
@submodule Views
@class FeaturesView
**/
// define(function(require) {
  var template = require('../templates/features_view.hbs'),
    Gentle = require('gentle'),
    SynbioData = require('../../common/lib/synbio_data'),
    Backbone = require('backbone'),
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
      this.listenTo(this.model.getHistory(), 'change add remove', _.debounce(this.refresh, 100), this);
      this.featureTypes = _.chain(SynbioData.featureTypes).clone()
        .forEach(function(type, typeId) {
          type.value = typeId;
        })
        .values()
        .groupBy('category')
        .value();
    },

    getFeatureFromElement: function(element) {
      var $element = $(element),
        featureId = $element.data('feature_id');

      return _.find(this.model.getFeatures(), function(_feature) {
        return _feature._id == featureId;
      });
    },

    scrollToFeature: function(event) {
      var feature = this.getFeatureFromElement(event.currentTarget);

      event.preventDefault();

      this.getSequenceCanvas().scrollBaseToVisibility(feature.ranges[0].from);
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
      if (event) event.preventDefault();

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
          to: lastBase,
          reverseComplement: false
        }],
        _type: 'note'
      };
      if (!this.isOpen) this.$toggleButton.click();
      this.startCreating();
    },

    setupRanges: function() {
      var ranges = this.editedFeature.ranges;
      this.editedFeature.ranges = _.map(ranges, function(range, i) {
        return _.extend(range, {
          _id: i,
          _canDelete: ranges.length > 1,
          from: range.from === -1 ? '' : range.from + 1,
          to: range.to === -1 ? '' : range.to + 1,
          _canAdd: i === ranges.length - 1
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
        rangeId = $element.data('range_id');

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
      this.editedFeature.ranges = this.readRanges();
    },

    readRanges: function() {
      return _.map(this.$('form').find('.sequence-feature-edit-ranges-list tbody tr'), (row) => {
        var offset = this.model.getOffset();
        var $row = $(row);
        var frm = $row.find('[name="from"]').val() * 1 - 1 + offset;
        var to = $row.find('[name="to"]').val() * 1 - 1 + offset;
        var reverseComplement = $row.find('[name="rc"]').prop('checked');

        return {
          from: frm,
          to: to,
          reverseComplement: reverseComplement
        };
      });
    },

    saveFeature: function() {
      var ranges;
      var acceptedRanges;
      var length = this.model.getLength(this.model.STICKY_END_FULL);

      this.readValues();
      this.errors = {};

      acceptedRanges = _.reject(this.editedFeature.ranges, (range, i) => {
        range._fromIsInvalid = (range.from === '' || range.from < 0 || range.from >= length);
        range._toIsInvalid = (range.to === '' || range.to < 0 || range.to >= length);
        var reject = range._fromIsInvalid || range._toIsInvalid;
        if(reject) this.errors.ranges = true;
        return reject;
      });

      if (this.editedFeature.name === undefined || this.editedFeature.name === '') {
        this.errors.name = true;
      }

      if (_.isEmpty(this.errors)) {
        ranges = _.map(acceptedRanges, function(range) {
          delete range._canDelete;
          delete range._canAdd;
          delete range._fromIsInvalid;
          delete range._toIsInvalid;
          return range;
        });
        this.editedFeature.ranges = ranges;
        if (this.creating) {
          this.model.createFeature(this.editedFeature, true);
        } else {
          this.model.updateFeature(this.editedFeature,true);
        }
        this.cancelEditing();
      } else {
        this.setupRanges();
        this.refresh();
      }
    },

    deleteFeature: function(event) {
      event.preventDefault();
      this.model.deleteFeature(this.editedFeature, true);
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
      if (this.isOpen) {
        if (this.editedFeature) {
          return {
            readOnly: this.model.get('readOnly'),
            isOpen: true,
            creating: this.creating,
            editedFeature: this.editedFeature,
            errors: this.errors || {},
            featureTypes: this.featureTypes
          };
        } else {
          return {
            readOnly: this.model.get('readOnly'),
            isOpen: true,
            features: this.model.getFeatures()
          };
        }
      } else return {};
    },

    getSequenceCanvas: function() {
      return Gentle.layout.getView('#content').actualPrimaryView.sequenceCanvas;
    },

    afterRender: function() {
      $('.sequence-feature-delete-button').confirmation({
        popout: true,
        placement: 'top',
        onConfirm: _.bind(this.deleteFeature, this)
      });
    },

  });
export default FeaturesView;
  // return FeaturesView;
// });
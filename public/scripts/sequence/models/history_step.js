/**
Handling history steps
@class HistoryStep
@module Sequence
@submodule Models
@constructor
@param {string} model.type instance type (any of `insert`, `delete`, `featureIns`,
  `featureDel`, `featureEdit`)
@param {string} [model.name] if feature
@param {string} [model.featureType] if feature
@param {array<integer>} [model.linked] array of the timestamps of other {HistoryStep}
  instances to undo at the same time. Defaults to `[]`;
@param {integer} model.timestamp unique identifier for the {HistoryStep} instance
  used for sorting.
@param {boolean} model.hidden if true, will not display in {HistoryView} and will not
  undo automatically when calling {{#crossLink "Sequence/undo"}}Sequence#undo{{/crossLink}} 
  or {{#crossLink "Sequence/undoAfter"}}Sequence#undoAfter{{/crossLink}}
@param {string} [operation] when `model.type` is `insert` or `delete`, 
  summarizes the operation
@param {integer} [base] when `model.type` is `insert` or `delete`, position
  in the sequence when the operation occurred
@param {string} [values] when `model.type` is `insert` or `delete`, bases
  which have been inserted or deleted
**/

import Backbone from 'backbone';


var HistoryStep = Backbone.Model.extend({
  defaults: function() {
    return {
      timestamp: +(new Date()),
      hidden: false,
      linked: []
    };
  },

  serialize: function() {
    var type = this.get('type');
    return _.extend(Backbone.Model.prototype.toJSON.call(this), {
      isInsertion: type == 'insert',
      isDeletion: type == 'delete',
      isFeatureInsertion: type == 'featureIns',
      isFeatureEdition: type == 'featureEdit',
      isFeatureDeletion: type == 'featureDel',
      isFeatureDeletedDesignEdit: type == 'design-feature-delete',
      isFeatureCreatedDesignEdit: type == 'design-feature-create',
      isInsertionDesignEdit: type == 'design-insert',
      isDeletionDesignEdit: type == 'design-delete',

      isFeature: /^feature/.test(type)
    });
  }
});

export default HistoryStep;

/**
Handling sequences
@class Sequence
@module Sequence
@submodule Models
@main Models
**/
import SequenceTransforms from '../lib/sequence_transforms';
import HistorySteps from './history_steps';
import Backbone from 'backbone';
import _ from 'underscore';
import BaseSequenceBackboneWrapper from './sequence_backbone_wrapper';
//TODO remove this
import sequenceClassMethodsMixin from '../../library/models/sequence_class_methods_mixin';


var BackboneSequenceModel = Backbone.DeepModel.extend({
  defaults: function() {
    return {
      displaySettings: {
        rows: {
          numbering: true,
          features: true,
          complements: true,
          aa: 'none',
          aaOffset: 0,
          res: this.Gentle && this.Gentle.currentUser && this.Gentle.currentUser.get('displaySettings.rows.res') || {}
        }
      },
      history: new HistorySteps()
    };
  },

  constructor: function(attributes, options={}) {
    //TODO: remove this hack.  Originally we had an official dependency on
    // Gentle, however this does not make sense when using this sequence model
    // in a node command line script outside of Gentle.
    this.Gentle = window.gentle;

    options.SequenceBackboneWrapperClass = options.SequenceBackboneWrapperClass || BaseSequenceBackboneWrapper;
    this.baseSequenceModel = new options.SequenceBackboneWrapperClass(this, attributes);
    Backbone.DeepModel.call(this, attributes, options);

    var defaults = this.defaults();
    if(this.get('displaySettings.rows.res.lengths') === undefined) {
      this.set('displaySettings.rows.res.lengths', defaults.displaySettings.rows.res.lengths);
    }
    if(this.get('displaySettings.rows.res.custom') === undefined) {
      this.set('displaySettings.rows.res.custom', defaults.displaySettings.rows.res.manual);
    }
    this.listenTo(this, 'change:sequence', this.getBaseSequenceModel().clearBlastCache);

    this.getComplements = _.bind(_.partial(this.getTransformedSubSeq, 'complements', {}), this);
  },

  getBaseSequenceModel: function() {
    return this.baseSequenceModel;
  },

  /**
  Returns a transformed subsequence between the bases startBase and end Base
  @method getTransformedSubSeq
  @param {String} variation name of the transformation
  @param {Object} options
  @param {Integer} startBase start of the subsequence (indexed from 0)
  @param {Integer} endBase end of the subsequence (indexed from 0)
  **/
  getTransformedSubSeq: function(variation, options, startBase, endBase) {
    options = options || {};
    var output = '';
    switch (variation) {
      case 'aa-long':
      case 'aa-short':
        var paddedSubSeq = this.getPaddedSubSeq(startBase, endBase, 3, options.offset || 0),
          offset;
        output = _.map(paddedSubSeq.subSeq.match(/.{1,3}/g) || [], function(codon) {
          if (options.complements === true) codon = SequenceTransforms.toComplements(codon);
          return SequenceTransforms[variation == 'aa-long' ? 'codonToAALong' : 'codonToAAShort'](codon);
        }).join('');
        offset = Math.max(0, paddedSubSeq.startBase - startBase);
        output = output.substr(Math.max(0, startBase - paddedSubSeq.startBase), endBase - startBase + 1 - offset);
        _.times(Math.max(0, offset), function() {
          output = ' ' + output;
        });
        break;
      case 'complements':
        output = SequenceTransforms.toComplements(this.getSubSeq(startBase, endBase, true));
        break;
    }
    return output;
  },

  /**
  @method getCodon
  @param {Integer} base
  @param {Integer, optional} offset
  @return {Object} codon to which the base belongs and position of the base in the codon (from 0)
  **/
  getCodon: function(base, offset) {
    var subSeq;
    offset = offset || 0;
    subSeq = this.getPaddedSubSeq(base, base, 3, offset);
    if (subSeq.startBase > base) {
      return {
        sequence: this.attributes.sequence[base],
        position: 1
      };
    } else {
      return {
        sequence: subSeq.subSeq,
        position: (base - offset) % 3
      };
    }
  },

  /**
  @method codonToAA
  **/
  getAA: function(variation, base, offset) {
    var codon = this.getCodon(base, offset || 0),
      aa = SequenceTransforms[variation == 'short' ? 'codonToAAShort' : 'codonToAALong'](codon.sequence) || '';
    return {
      sequence: aa || '   ',
      position: codon.position
    };
  },

  /**
  Validates that a sequence name is present
  @method validate
  **/
  validate: function(attrs, options) {
    var errors = [];
    if (!attrs.name.replace(/\s/g, '').length) {
      errors.push('name');
    }
    return errors.length ? errors : undefined;
  },

  /*
  @method _insertBases  Only to be called by a backbone wrapper class
   */
  _insertBases: function(bases, beforeBase, updateHistory = true) {
    var timestamp;
    if (updateHistory) {
      timestamp = this.getHistory().add({
        type: 'insert',
        position: beforeBase,
        value: bases,
        operation: '@' + beforeBase + '+' + bases
      }).get('timestamp');
    }

    this.throttledSave();
    return timestamp;
  },

  /*
  @method _deleteBases  Only to be called by a backbone wrapper class
   */
  _deleteBases: function(firstBase, updateHistory = true, sequenceBasesRemoved, historyTimestamps) {
    var timestamp;
    if (updateHistory) {
      timestamp = this.getHistory().add({
        type: 'delete',
        value: sequenceBasesRemoved,
        position: firstBase,
        operation: '@' + firstBase + '-' + sequenceBasesRemoved,
        linked: historyTimestamps
      }).get('timestamp');
    }

    this.throttledSave();
    return timestamp;
  },

  /*
  @method _moveFeatures  Only to be called by a backbone wrapper class
   */
  _moveFeatures: function(previousFeatureStates) {
    var historyTimestamps = [];

    _.each(previousFeatureStates, (featurePreviousState) => {
      var {state, feature} = featurePreviousState;

      if(state === 'edited') {
        historyTimestamps.push(this.recordFeatureHistoryEdit(feature, true));
      } else if(state === 'deleted') {
        historyTimestamps.push(this.recordFeatureHistoryDel(feature, true));
      } else {
        throw new Error(`Unsupported feature state: '${state}'`);
      }
    });

    if(previousFeatureStates.length) this.trigger('change change:features');
    return historyTimestamps;
  },

  moveBases: function(firstBase, length, newFirstBase, updateHistory) {
    var lastBase = firstBase + length - 1,
        history = this.getHistory(),
        _this = this,
        featuresInRange, subSeq, deletionTimestamp, insertionTimestamp;

    if(updateHistory === undefined) updateHistory = true;

    featuresInRange = _.deepClone(_.filter(this.get('features'), function(feature) {
      return _.some(feature.ranges, function(range) {
        return range.from >= firstBase && range.to <= lastBase;
      });
    }));

    subSeq = this.getSubSeq(firstBase, lastBase);

    deletionTimestamp = this.deleteBases(firstBase, length, updateHistory);
    insertionTimestamp = this.insertBases(
      subSeq,
      newFirstBase < firstBase ?
        newFirstBase :
        newFirstBase - length
    );

    _.each(featuresInRange, function(feature) {
      feature.ranges = _.map(_.filter(feature.ranges, function(range) {
        return range.from >= firstBase && range.to <= lastBase;
      }), function(range) {
        var offset = newFirstBase < firstBase ?
          newFirstBase - firstBase :
          newFirstBase - length - firstBase;

        return {
          from: range.from + offset,
          to: range.to + offset
        };
      });

      _this.createFeature(feature, updateHistory);
    });

  },

  insertBasesAndCreateFeatures: function(beforeBase, bases, features, updateHistory) {
    var newFeatures = _.deepClone(_.isArray(features) ? features : [features]),
        _this = this;

    this.insertBases(bases, beforeBase, updateHistory);

    _.each(newFeatures,function(feature){

      feature.ranges = [{
        from: beforeBase,
        to: beforeBase + bases.length - 1
      }];

      delete feature.from;
      delete feature.to;

      _this.createFeature(feature, updateHistory);
    });
  },

  insertSequenceAndCreateFeatures: function(beforeBase, bases, features, updateHistory) {
    var newFeatures = _.deepClone(_.isArray(features) ? features : [features]),
        _this = this;

    this.insertBases(bases, beforeBase, updateHistory);

    _.each(newFeatures,function(feature){

      feature.ranges = _.map(feature.ranges, function(range) {
        return {
          from: beforeBase + range.from,
          to: beforeBase + range.to
        };
      });

      _this.createFeature(feature, updateHistory);
    });
  },

  /**
  @method getHistory
  @return {HistorySteps} collection of {{#crossLink "HistoryStep"}}{{/crossLink}}
    attached to the model instance
  **/
  getHistory: function() {
    if (this.attributes.history.toJSON === undefined) {
      this.attributes.history = new HistorySteps(this.attributes.history);
    }
    return this.attributes.history;
  },

  /**
  Revert the last {{#crossLink "HistoryStep"}}{{/crossLink}} instance in
  {{#crossLink "Sequence/getHistory"}}{{/crossLink}} for which `hidden` is not
  `true`
  @method undo
  **/
  undo: function() {
    var history = this.getHistory(),
        lastStep = history.findWhere({hidden: false}),
        _this = this,
        linkedSteps, revertAndRemove;

    revertAndRemove = function(step) {
      _this.revertHistoryStep(step);
      history.remove(step);
    };

    if (lastStep) {
      linkedSteps = lastStep.get('linked') || [];
      revertAndRemove(lastStep);
      _.each(linkedSteps, function(timestamp) {
        revertAndRemove(history.findWhere({timestamp: timestamp}));
      });
    }
  },

  /**
  Reverts all {{#crossLink "HistoryStep"}}{{/crossLink}} instances after `timestamp`
  in {{#crossLink "Sequence/getHistory"}}Sequence#getHistory{{/crossLink}} for which `hidden` is not
  `true`
  @method undoAfter
  @param {integer} timestamp
  **/
  undoAfter: function(timestamp) {
    var _this = this,
        history = this.getHistory(),
        linkedSteps, revertAndPush,
        toBeDeleted = [];

    revertAndPush = function(step) {
      toBeDeleted.push(step);
      _this.revertHistoryStep.call(_this, step);
    };

    history.all(function(historyStep) {
      if (historyStep.get('timestamp') >= timestamp) {
        if(!historyStep.get('hidden')) {
          linkedSteps = historyStep.get('linked') || [];
          revertAndPush(historyStep);
          _.each(linkedSteps, function(timestamp) {
            revertAndPush(history.findWhere({timestamp: timestamp}));
          });
        }
        return true;

      } else {
        // the HistorySteps collection is sorted by DESC timestamp
        // so we can break out of the loop.
        return false;
      }
    });

    history.remove(toBeDeleted);
    this.throttledSave();

  },

  revertHistoryStep: function(historyStep) {
    switch (historyStep.get('type')) {

      case 'featureIns':
        this.deleteFeature(historyStep.get('feature'), false);
        break;

      case 'featureEdit':
        this.updateFeature(historyStep.get('featurePreviousState'), false);
        break;

      case 'featureDel':
        this.createFeature(historyStep.get('featurePreviousState'), false);
        break;

      case 'insert':
        this.deleteBases(
          historyStep.get('position'),
          historyStep.get('value').length,
          false
        );
        break;

      case 'delete':
        this.insertBases(
          historyStep.get('value'),
          historyStep.get('position'),
          false
        );
        break;
    }
  },

  updateFeature: function(editedFeature, record) {
    var oldFeature = _.indexBy(this.get('features'), '_id')[editedFeature._id],
      id = this.get('features').indexOf(oldFeature);
    this.clearFeatureCache();
    this.set('features.' + id, editedFeature);
    this.sortFeatures();
    this.save();
    if (record === true) {
      this.recordFeatureHistoryEdit(editedFeature);
    }
    this.throttledSave();
  },

  createFeature: function(newFeature, record) {
    var id = this.get('features').length, sortedIdList, len;

    if (record === true) {
      this.recordFeatureHistoryIns(newFeature);
    }
    // if (record === 'design-true')
    // this.getHistory().add({
    //   type: 'design-feature-create',
    //   feature: newFeature,
    //   name: newFeature.name,
    //   hidden: true,
    //   featureType: newFeature._type,
    //   range: [{
    //     from: newFeature.ranges[0].from,
    //     to: newFeature.ranges[0].to
    //   }]
    // }).get('timestamp');

    if (id === 0) {
      newFeature._id = 0;
    } else {
      sortedIdList = _.sortBy(_.pluck(this.get('features'),'_id'));
      len = sortedIdList.length;
      newFeature._id = sortedIdList[len-1]+1;
    }

    this.clearFeatureCache();
    this.set('features.' + id, newFeature);
    this.sortFeatures();
    this.throttledSave();
  },


  deleteFeature: function(feature, record) {
    var featureId;
    featureId = (feature._id===undefined)?feature.id : feature._id;
    this.clearFeatureCache();

    if (record === true) {
      this.recordFeatureHistoryDel(feature, false, false);
    }
    //  if (record === 'design-true')
    //  this.getHistory().add({
    //   type: 'design-feature-delete',
    //   feature: feature,
    //   hidden: true,
    //   name: feature.name,
    //   featureType: feature._type,
    //   range: [{
    //     from: feature.ranges[0].from,
    //     to: feature.ranges[0].to
    //   }]
    // }).get('timestamp');

    this.set('features', _.reject(this.get('features'), function(_feature) {
      return _feature._id == featureId;
    }));

    this.sortFeatures();
    this.throttledSave();
  },

  recordFeatureHistoryIns: function(feature) {
    return this.getHistory().add({
      type: 'featureIns',
      feature: feature,
      name: feature.name,
      featureType: feature._type,
      range: [{
        from: feature.ranges[0].from,
        to: feature.ranges[0].to
      }]
    }).get('timestamp');
  },

  recordFeatureHistoryDel: function() {
    var feature = arguments[0],
        isHidden = !!arguments[1];

    return this.getHistory().add({
      type: 'featureDel',
      name: feature.name,
      featurePreviousState: feature,
      featureType: feature._type,
      hidden: isHidden
    }).get('timestamp');
  },

  recordFeatureHistoryEdit: function() {
    var feature = arguments[0],
        isHidden = !!arguments[1];

    return this.getHistory().add({
      type: 'featureEdit',
      name: feature.name,
      featurePreviousState: feature,
      featureType: feature._type,
      hidden: isHidden
    }).get('timestamp');
  },

  length: function() {
    return this.attributes.sequence.length;
  },

  serialize: function() {
    return _.extend(Backbone.Model.prototype.toJSON.apply(this), {
      isCurrent: (this.Gentle && this.Gentle.currentSequence && this.Gentle.currentSequence.get('id') == this.get('id')),
      length: this.length()
    });
  },

  throttledSave: function() {
    if(!this._throttledSave) {
      this._throttledSave = _.throttle(_.bind(this.save, this), 100);
    }
    this._throttledSave();
  },

  _throttledSave: undefined,

  clearBlastCache: function() {
    if(this.get('meta.blast')) {
      this.set('meta.blast', {});
      this.throttledSave();
    }

    return this;
  },

  saveBlastRID: function(RID, database) {
    this.set('meta.blast.RID', RID);
    this.set('meta.blast.database', database);
    this.throttledSave();
    return this;
  },

  saveBlastResults: function(results) {
    this.set('meta.blast.results', results);
    this.throttledSave();
    return this;
  },

});


BackboneSequenceModel.calculateProduct = function(sequenceBases, opts) {
  if(_.isUndefined(opts.from) || _.isUndefined(opts.to)) {
    throw "Must specify `opts.from` and `opts.to`";
  }
  var regionOfInterest = sequenceBases.slice(opts.from, opts.to + 1);
  var startStickyEnd = opts.stickyEnds && opts.stickyEnds.start || '';
  var endStickyEnd = opts.stickyEnds && opts.stickyEnds.end || '';

  if(!_.isString(startStickyEnd)) startStickyEnd = startStickyEnd.sequence;
  if(!_.isString(endStickyEnd)) endStickyEnd = endStickyEnd.sequence;

  var productSequence = startStickyEnd + regionOfInterest + endStickyEnd;
  return {productSequence, regionOfInterest, startStickyEnd, endStickyEnd};
};


// Required for getting name of class as BackboneSequenceModel.name returns 'constructor'
BackboneSequenceModel.className = 'BackboneSequenceModel';


//TODO preferably remove this and refactor sequenceClassMethodsMixin into
//  BaseSequenceModel
sequenceClassMethodsMixin(BackboneSequenceModel);

export default BackboneSequenceModel;

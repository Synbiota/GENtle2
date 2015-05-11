/**
Handling sequences
@class Sequence
@module Sequence
@submodule Models
@main Models
**/
import Gentle from 'gentle';
import SequenceTransforms from '../lib/sequence_transforms';
import HistorySteps from './history_steps';
import Backbone from 'backbone';
import _ from 'underscore';


var SequenceModel = Backbone.DeepModel.extend({
  defaults: function() {
    return {
      id: _.uniqueId(),
      readOnly: false,
      isCircular: false,
      displaySettings: {
        rows: {
          numbering: true,
          features: true,
          complements: true,
          aa: 'none',
          aaOffset: 0,
          res: Gentle.currentUser.get('displaySettings.rows.res'),
          hasGutters: false
        }
      },
      history: new HistorySteps()
    };
  },

  constructor: function() {
    var defaults = this.defaults();
    Backbone.DeepModel.apply(this, arguments);
    this.sortFeatures();
    if(this.get('displaySettings.rows.res.lengths') === undefined) {
      this.set('displaySettings.rows.res.lengths', defaults.displaySettings.rows.res.lengths);
    }
    if(this.get('displaySettings.rows.res.custom') === undefined) {
      this.set('displaySettings.rows.res.custom', defaults.displaySettings.rows.res.manual);
    }
    this.maxOverlappingFeatures = _.memoize2(this._maxOverlappingFeatures);
    this.nbFeaturesInRange = _.memoize2(this.nbFeaturesInRange);
    this.listenTo(this, 'change:sequence', this.clearBlastCache);

    this.getComplements = _.bind(_.partial(this.getTransformedSubSeq, 'complements', {}), this);
  },

  /**
   * Wraps the standard get function to use the custom getSequence if necessary.
   * @param  {String} Standard attribute
   * @param  {Object} Options (optional)
   */
  get: function(attribute, options = {}){
    var value;
    var customGet = "get" + _.capitalize(attribute);

    if (this[customGet]){
      value = this[customGet](options);
    } else {
      value = Backbone.DeepModel.prototype.get.apply(this, arguments);
    }

    return value;
  },

  /**
   * Specialized function for getting the sequence attribute. Looks for a stickyEnd key in options.
   * 'none' will return the sequence without sticky ends.
   * 'overhang' will return the sequence with the active section of sticky ends.
   * Default value will return the full (blunt) sticky end.
   * @param  {Object} Options
   * @return {String} Formatted sequence
   */
  getSequence: function(options){
    var sequence        = Backbone.DeepModel.prototype.get.call(this, 'sequence'),
        stickyEnds      = this.get('stickyEnds'),
        startPostion, endPosition;

    options = _.defaults({}, options);
    if (stickyEnds && options.stickyEndFormat){
      switch (options.stickyEndFormat){
        case "none":
          startPostion = stickyEnds.start.size + stickyEnds.start.offset;
          endPosition = sequence.length - stickyEnds.end.size - stickyEnds.end.offset;
          break;
        case "overhang":
          startPostion = stickyEnds.start.offset;
          endPosition = sequence.length - stickyEnds.end.offset;
          break;
      }

      if ((startPostion !== undefined) && (endPosition !== undefined)){
        sequence = sequence.substring(startPostion, endPosition);
      }
    }

    return sequence;
  },

  getFeatures: function(options = {}){
    var features = Backbone.DeepModel.prototype.get.call(this, 'features'),
        stickyEnds = this.get('stickyEnds'),
        length = this.length(options),
        startStickyEnd, adjust;

    if (stickyEnds){
      startStickyEnd = stickyEnds.start;
    }

    var adjustRanges = function(offset, feature){
      var adjusted = _.deepClone(feature);
      offset = offset || 0;

      _.each(adjusted.ranges, function(range){
        range.from =  Math.max(Math.min(range.from + offset, length -1), 0);
        range.to =  Math.max(Math.min(range.to + offset, length -1), 0);
      });

      return adjusted;
    };

    if (options.stickyEndFormat && stickyEnds){
      switch (options.stickyEndFormat){
        case "none":
          adjust = _.partial(adjustRanges, -(startStickyEnd.offset + startStickyEnd.size));
          features = _.map(features, adjust);
          break;
        case "overhang":
          adjust = _.partial(adjustRanges, -startStickyEnd.offset);
          features = _.map(features, adjust);
          break;
      }
    }

    return features;
  },

  /**
  Returns the subsequence between the bases startBase and end Base
  @method getSubSeq
  @param {Integer} startBase start of the subsequence (indexed from 0)
  @param {Integer} endBase end of the subsequence (indexed from 0)
  **/
  getSubSeq: function(startBase, endBase, options) {
    if (endBase === undefined){
      endBase = startBase;
    } else {
      if (endBase >= this.length() && startBase >= this.length()) return '';
      endBase = Math.min(this.length() - 1, endBase);
    }
    startBase = Math.min(Math.max(0, startBase), this.length() - 1);

    return this.get('sequence', options).substr(startBase, endBase - startBase + 1);

    // endBase = (endBase === undefined) ? startBase + 1 : endBase;
    // return this.get('sequence', options).substring(startBase, endBase);
  },

  isBeyondStickyEnd: function(pos, reverse, options) {
    if (reverse === undefined) {
      reverse = false;
    }
    return this.isBeyondStartStickyEnd(pos, reverse, options) || this.isBeyondEndStickyEnd(pos, reverse, options);
  },

  // Unused
  // isBeyondStartStickyEndOnBothStrands: function(pos) {
  //   return this.overhangBeyondStartStickyEndOnBothStrands(pos) > 0;
  // },

  // Unused
  // isBeyondEndStickyEndOnBothStrands: function(pos) {
  //   return this.overhangBeyondEndStickyEndOnBothStrands(pos) > 0;
  // },

  overhangBeyondStartStickyEndOnBothStrands: function(pos) {
    return Math.min(this.overhangBeyondStartStickyEnd(pos, true), this.overhangBeyondStartStickyEnd(pos, false));
  },

  overhangBeyondEndStickyEndOnBothStrands: function(pos) {
    return Math.min(this.overhangBeyondEndStickyEnd(pos, true), this.overhangBeyondEndStickyEnd(pos, false));
  },

  isBeyondStartStickyEnd: function(pos, reverse, options) {
    if (reverse === undefined) {
      reverse = false;
    }
    return this.overhangBeyondStartStickyEnd(pos, reverse, options) > 0;
  },

  isBeyondEndStickyEnd: function(pos, reverse, options) {
    if (reverse === undefined) {
      reverse = false;
    }
    return this.overhangBeyondEndStickyEnd(pos, reverse, options) > 0;
  },

  overhangBeyondStartStickyEnd: function(pos, reverse, options) {
    var stickyEnds = this.get('stickyEnds');
    var result = 0;

    if (reverse === undefined) {
      reverse = false;
    }

    if(stickyEnds) {
      var startStickyEnd = stickyEnds.start;
      var offset = (options && options.stickyEndFormat == "overhang") ?
                    0 : startStickyEnd.offset;

      if(startStickyEnd) {
        if(reverse) {
          if(startStickyEnd.reverse) {
            result = offset - pos;
          } else {
            result = (offset + startStickyEnd.size) - pos;
          }
        } else {
          if(startStickyEnd.reverse) {
            result = (offset + startStickyEnd.size) - pos;
          } else {
            result = offset - pos;
          }
        }
      }
    }
    return result;
  },

  overhangBeyondEndStickyEnd: function(pos, reverse, options = {}) {
    var stickyEnds = this.get('stickyEnds');
    var seqLength = this.length();
    var result = 0;

    if (reverse === undefined) {
      reverse = false;
    }

    if(stickyEnds) {
      var startStickyEnd = stickyEnds.start;
      var endStickyEnd = stickyEnds.end;

      if(endStickyEnd) {
        var stickyEndTo = seqLength - 1 - endStickyEnd.offset;


        switch (options.stickyEndFormat){
          case "none":
            stickyEndTo -= (startStickyEnd.offset + startStickyEnd.size);
            break;
          case "overhang":
            stickyEndTo -= startStickyEnd.offset;
            break;
        }


        var stickyEndFrom = stickyEndTo - endStickyEnd.size + 1;

        if(reverse) {
          if(endStickyEnd.reverse) {
            result = pos - stickyEndTo;
          } else {
            result = (pos + 1) - stickyEndFrom;
          }
        } else {
          if(endStickyEnd.reverse) {
            result = (pos + 1) - stickyEndFrom;
          } else {
            result = pos - stickyEndTo;
          }
        }
      }
    }
    return result;
  },

  getStickyEndSequence: function(getStartStickyEnd) {
    var wholeSequence = this.get('sequence');
    var stickyEnds = this.get('stickyEnds') || {};
    var isOnReverseStrand;
    var sequence = '';
    var stickyEnd;

    if(getStartStickyEnd) {
      stickyEnd = stickyEnds.start;
      if(stickyEnd) {
        sequence = wholeSequence.substr(stickyEnd.offset, stickyEnd.size);
      }
    } else {
      stickyEnd = stickyEnds.end;
      if (stickyEnd) {
        var offset = wholeSequence.length - (stickyEnd.offset + stickyEnd.size);
        sequence = wholeSequence.substr(offset, stickyEnd.size);
      }
    }

    if(stickyEnd) {
      isOnReverseStrand = stickyEnd.reverse;
      if(isOnReverseStrand) {
        sequence = SequenceTransforms.toComplements(sequence);
      }
    }
    return {sequence, isOnReverseStrand};
  },

  getStartStickyEndSequence: function() {
    return this.getStickyEndSequence(true);
  },

  getEndStickyEndSequence: function() {
    return this.getStickyEndSequence(false);
  },

  stickyEndConnects: function (sequence) {
    var thisEndStickySequence = this.getEndStickyEndSequence();
    var otherStartStickySequence = sequence.getStartStickyEndSequence();

    var canConnect = ((thisEndStickySequence.isOnReverseStrand != otherStartStickySequence.isOnReverseStrand) &&
      SequenceTransforms.areComplementary(thisEndStickySequence.sequence, otherStartStickySequence.sequence));

    return canConnect;
  },

  hasStickyEnds: function() {
    var stickyEnds = this.get('stickyEnds');
    return !!(stickyEnds && stickyEnds.start && stickyEnds.end);
  },

  /**
  Returns a transformed subsequence between the bases startBase and end Base
  @method getTransformedSubSeq
  @param {String} variation name of the transformation
  @param {Object} options
  @param {Integer} startBase start of the subsequence (indexed from 0)
  @param {Integer} endBase end of the subsequence (indexed from 0)
  **/
  getTransformedSubSeq: function(variation, options, startBase, endBase, subSeqOptions) {
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
        output = SequenceTransforms.toComplements(this.getSubSeq(startBase, endBase, subSeqOptions));
        break;
    }
    return output;
  },

  /**
  Returns a subsequence including the subsequence between the bases `startBase` and `endBase`.
  Ensures that blocks of size `padding` and starting from the base `offset` in the
  complete sequence are not broken by the beginning or the end of the subsequence.
  @method getPaddedSubSeq
  @param {String} variation name of the transformation
  @param {Integer} startBase start of the subsequence (indexed from 0)
  @param {Integer} endBase end of the subsequence (indexed from 0)
  @param {Integer, optional} offset relative to the start of full sequence
  **/
  getPaddedSubSeq: function(startBase, endBase, padding, offset) {
    offset = offset || 0;
    startBase = Math.max(startBase - (startBase - offset) % padding, 0);
    endBase = Math.min(endBase - (endBase - offset) % padding + padding - 1, this.length());
    return {
      subSeq: this.getSubSeq(startBase, endBase),
      startBase: startBase,
      endBase: endBase
    };
  },

  /**
  @method getCodon
  @param {Integer} base
  @param {Integer, optional} offset
  @returns {Object} codon to which the base belongs and position of the base in the codon (from 0)
  **/
  getCodon: function(base, offset) {
    var subSeq;
    offset = offset || 0;
    subSeq = this.getPaddedSubSeq(base, base, 3, offset);
    if (subSeq.startBase > base) {
      return {
        sequence: this.get('sequence')[base],
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
  @method featuresInRange
  @param {integer} startBase
  @param {integer} endBase
  @returns {array} all features present between start and end base
  **/
  featuresInRange: function(startBase, endBase, options) {
    var features = this.get('features', options)
    if (_.isArray(features)) {
      return _(features).filter((feature) => {
        return this.filterRanges(startBase, endBase, feature.ranges).length > 0;
      });
    } else {
      return [];
    }
  },

  /**
   * @method filterRanges
   * @param  {integer} startBase
   * @param  {integer} endBase
   * @param  {array} list of feature ranges
   * @return {array} all ranges overlapping start and end base
   */
  filterRanges: function(startBase, endBase, ranges) {
    return _.filter(ranges, function(range) {
      if(range.from < range.to) {
        return range.from <= endBase && range.to >= startBase;
      } else {
        return range.to <= endBase && range.from >= startBase;
      }
    });
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


  /**
  @method maxOverlappingFeatures
  @returns {integer}
  **/
  _maxOverlappingFeatures: function() {
    var ranges = _.flatten(_.pluck(this.attributes.features, 'ranges')),
      previousRanges = [],
      i = 0,
      filterOverlappingRanges = function(ranges) {
        return _.filter(ranges, function(range) {
          return _.some(ranges, function(testRange) {
            return range != testRange && range.from <= testRange.to && range.to >= testRange.from;
          });
        });
      };

    while(ranges.length > 1 && _.difference(ranges, previousRanges).length && i < 100) {
      previousRanges = _.deepClone(ranges);
      ranges = filterOverlappingRanges(ranges);
      i++;
    }
    return i;
  },

  /**
  @method featuresCountInRange
  @returns {integer}
  **/
  nbFeaturesInRange: function(startBase, endBase) {
    return _.filter(this.attributes.features, function(feature) {
      return _.some(feature.ranges, function(range) {
        return range.from <= endBase && range.to >= startBase;
      });
    }).length;
  },

  insertBases: function(bases, beforeBase, options = {}){
    var seq = this.get('sequence'),
        stickyEnds = this.get('stickyEnds'),
        offset = 0,
        adjustedBeforeBase,
        timestamp;

    options = _.defaults(options, {updateHistory: true});

    // Adjust offset depending on sticky end format
    if (stickyEnds && options.stickyEndFormat){
      switch (options.stickyEndFormat){
        case "none":
          offset = stickyEnds.start.size + stickyEnds.start.offset;
          break;
        case "overhang":
          offset = stickyEnds.start.offset;
          break;
      }
    }

    adjustedBeforeBase = beforeBase + offset;

    this.set('sequence',
      seq.substr(0, adjustedBeforeBase) +
      bases +
      seq.substr(adjustedBeforeBase, seq.length - (adjustedBeforeBase) + 1)
    );

    this.moveFeatures(beforeBase, bases.length, options);

    if (options.updateHistory) {
      timestamp = this.getHistory().add({
        type: 'insert',
        position: adjustedBeforeBase,
        value: bases,
        operation: '@' + adjustedBeforeBase + '+' + bases
      }).get('timestamp');
    }

    this.throttledSave();

    return timestamp;
  },

  moveBases: function(firstBase, length, newFirstBase, options = {}) {
    var lastBase = firstBase + length - 1,
        history = this.getHistory(),
        _this = this,
        featuresInRange, subSeq, deletionTimestamp, insertionTimestamp;

    options = _.defaults(options, {updateHistory: true});

    featuresInRange = _.deepClone(_.filter(this.get('features'), function(feature) {
      return _.some(feature.ranges, function(range) {
        return range.from >= firstBase && range.to <= lastBase;
      });
    }));

    subSeq = this.getSubSeq(firstBase, lastBase);

    deletionTimestamp = this.deleteBases(firstBase, length, options);
    insertionTimestamp = this.insertBases(
      subSeq,
      newFirstBase < firstBase ?
        newFirstBase :
        newFirstBase - length,
      options
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

      _this.createFeature(feature, options);
    });

  },

  insertBasesAndCreateFeatures: function(beforeBase, bases, features, options) {
    var newFeatures = _.deepClone(_.isArray(features) ? features : [features]),
        _this = this;

    this.insertBases(bases, beforeBase, options);

    _.each(newFeatures,function(feature){

      feature.ranges = [{
        from: beforeBase,
        to: beforeBase + bases.length - 1
      }];

      delete feature.from;
      delete feature.to;

      _this.createFeature(feature, options);
    });
  },

  insertSequenceAndCreateFeatures: function(beforeBase, bases, features, options = {}) {
    var newFeatures = _.deepClone(_.isArray(features) ? features : [features]),
        _this = this;

    this.insertBases(bases, beforeBase, options);

    _.each(newFeatures,function(feature){

      feature.ranges = _.map(feature.ranges, function(range) {
        return {
          from: beforeBase + range.from,
          to: beforeBase + range.to
        };
      });

      _this.createFeature(feature, options);
    });
  },

  deleteBases: function(firstBase, length, options = {}) {
    var seq = this.get('sequence'),
        stickyEnds = this.get('stickyEnds'),
        offset = 0,
        adjustedFirstBase,
        timestamp,
        subseq, linkedHistoryStepTimestamps;

    options = _.defaults(options, {updateHistory: true});

    // Adjust offset depending on sticky end format
    if (stickyEnds && options.stickyEndFormat){
      switch (options.stickyEndFormat){
        case "none":
          offset = stickyEnds.start.size + stickyEnds.start.offset;
          break;
        case "overhang":
          offset = stickyEnds.start.offset;
          break;
      }
    }

    adjustedFirstBase = firstBase + offset;

    subseq = seq.substr(adjustedFirstBase, length);

    this.set('sequence',
      seq.substr(0, adjustedFirstBase) +
      seq.substr(adjustedFirstBase + length, seq.length - (adjustedFirstBase + length - 1))
    );

    // moveFeatures manages the adjustment.
    linkedHistoryStepTimestamps = this.moveFeatures(firstBase, -length, options);

    // if (updateHistory === 'design-true')
    //   this.getHistory().add({
    //     type: 'design-delete',
    //     value: subseq,
    //     hidden: true,
    //     position: adjustedFirstBase,
    //     operation: '@' + adjustedFirstBase + '-' + subseq,
    //     linked: linkedHistoryStepTimestamps
    //   });

    if (options.updateHistory) {
      timestamp = this.getHistory().add({
        type: 'delete',
        value: subseq,
        position: adjustedFirstBase,
        operation: '@' + adjustedFirstBase + '-' + subseq,
        linked: linkedHistoryStepTimestamps
      }).get('timestamp');
    }

    this.throttledSave();

    return timestamp;

  },

  moveFeatures: function(base, offset, options) {
    var features = this.get('features'),
        stickyEnds = this.get('stickyEnds'),
        featurePreviousState,
        storePreviousState,
        firstBase, lastBase,
        trigger = false,
        historyTimestamps = [];

    storePreviousState = function(feature) {
      featurePreviousState = featurePreviousState || _.deepClone(feature);
    };

    if (stickyEnds && options.stickyEndFormat){
      switch (options.stickyEndFormat){
        case "none":
          base += stickyEnds.start.size + stickyEnds.start.offset;
          break;
        case "overhang":
          base += stickyEnds.start.offset;
          break;
      }
    }

    if (_.isArray(features)) {

      for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        featurePreviousState = undefined;

        for (var j = 0; j < feature.ranges.length; j++) {
          var range = feature.ranges[j];

          if (offset > 0) {

            if (range.from >= base) range.from += offset;
            if (range.to >= base) range.to += offset;
            if (range.from >= base || range.to >= base) trigger = true;

          } else {

            firstBase = base;
            lastBase = base - offset - 1;

            if (firstBase <= range.from) {
              storePreviousState(feature);
              trigger = true;
              if (lastBase >= range.to) {
                feature.ranges.splice(j--, 1);
              } else {
                range.from -= lastBase < range.from ? -offset : range.from - firstBase;
                range.to += offset;
              }
            } else if (firstBase <= range.to) {
              storePreviousState(feature);
              trigger = true;
              range.to = Math.max(firstBase - 1, range.to + offset);
            }

          }
        }
        // If there are no more ranges, we remove the feature and
        // record the operation in the history
        if (feature.ranges.length === 0) {
          historyTimestamps.push(this.recordFeatureHistoryDel(featurePreviousState, true));
          features.splice(i--, 1);
        } else if (featurePreviousState !== undefined) {
          historyTimestamps.push(this.recordFeatureHistoryEdit(featurePreviousState, true));
        }
      }
      this.clearFeatureCache();
      if(trigger) this.trigger('change change:features');

    }

    return historyTimestamps;
  },

  clearFeatureCache: function() {
    this.nbFeaturesInRange.clearCache();
    this.maxOverlappingFeatures.clearCache();
  },

  /**
  @method getHistory
  @returns {HistorySteps} collection of {{#crossLink "HistoryStep"}}{{/crossLink}}
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
        this.deleteFeature(historyStep.get('feature'), {updateHistory: false});
        break;

      case 'featureEdit':
        this.updateFeature(historyStep.get('featurePreviousState'), {updateHistory: false});
        break;

      case 'featureDel':
        this.createFeature(historyStep.get('featurePreviousState'), {updateHistory: false});
        break;

      case 'insert':
        this.deleteBases(
          historyStep.get('position'),
          historyStep.get('value').length,
          {
            updateHistory: false
          }
        );
        break;

      case 'delete':
        this.insertBases(
          historyStep.get('value'),
          historyStep.get('position'),
          {
            updateHistory: false
          }
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

  createFeature: function(newFeature, options = {}) {
    var id = this.get('features').length, sortedIdList, len;

    if (options.updateHistory === true) {
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

  sortFeatures: function() {
    this.set('features',
      _.sortBy(
        _.map(this.get('features'), function(feature) {
          feature.ranges = _.sortBy(feature.ranges, function(range) {
            return range.from;
          });
          return feature;
        }), function(feature) {
          return feature.ranges[0].from;
        }), {
        silent: true
      });
  },

  length: function(options) {
    return this.get('sequence', options).length;
  },

  serialize: function() {
    return _.extend(Backbone.Model.prototype.toJSON.apply(this), {
      isCurrent: (Gentle.currentSequence && Gentle.currentSequence.get('id') == this.get('id')),
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


var calculateOverhang = function(sequence, pos) {
  var overhangStart = sequence.overhangBeyondStartStickyEndOnBothStrands(pos);
  var overhangEnd = sequence.overhangBeyondEndStickyEndOnBothStrands(pos);
  return Math.max(overhangStart, 0) - Math.max(overhangEnd, 0);
};


SequenceModel.concatenateSequences = function(sequenceModels, circularise=false, truncateFeatures=true) {
  var previousSequenceModel;
  var previousStickyEnds;

  var newSequenceAttributes = _.reduce(sequenceModels, function(attributes, sequenceModel, i) {
    var isFirst = i === 0;
    var isLast = i === (sequenceModels.length - 1);
    var stickyEnds = sequenceModel.get('stickyEnds');
    var appendSequenceNts = sequenceModel.get('sequence');


    // Add sticky ends
    if(isFirst && !circularise) {
      if(stickyEnds.start) {
        // Add sticky end at start
        attributes.stickyEnds.start = _.deepClone(stickyEnds.start);
      }
    }
    if(isLast && !circularise) {
      if(stickyEnds.end) {
        // Add sticky end at end
        attributes.stickyEnds.end = _.deepClone(stickyEnds.end);
      }
    }

    var offset = 0;
    if(isFirst && circularise) {
      previousSequenceModel = sequenceModels[sequenceModels.length-1];
      previousStickyEnds = previousSequenceModel.get('stickyEnds');
    }
    if(previousSequenceModel) {
      // Check sticky ends are compatible
      if(previousSequenceModel.stickyEndConnects(sequenceModel)) {
        attributes.sequence = attributes.sequence.substr(0, attributes.sequence.length - previousStickyEnds.end.offset);
        var toRemove = stickyEnds.start.offset + stickyEnds.start.size;
        appendSequenceNts = appendSequenceNts.substr(toRemove);
        offset = attributes.sequence.length - toRemove;
      } else {
        throw `Can not concatenate sequences ${previousSequenceModel.get('id')} and ${sequenceModel.get('id')} as they have incompatible sticky ends: \`${previousSequenceModel.getEndStickyEndSequence().sequence}\` and \`${sequenceModel.getStartStickyEndSequence().sequence}\``;
      }
    }
    if(isLast && circularise) {
      appendSequenceNts = appendSequenceNts.substr(0, appendSequenceNts.length - stickyEnds.end.offset);
    }
    // Add the suitable sequence bases
    attributes.sequence += appendSequenceNts;

    // Add features
    _.each(sequenceModel.get('features'), (feature) => {
      var positions = _.flatten(_.map(feature.ranges, (range) => [range.to, range.from]));
      var maxPos = Math.max(...positions);
      var minPos = Math.min(...positions);
      var accepted = true;
      var overhangStart = sequenceModel.overhangBeyondStartStickyEndOnBothStrands(minPos);
      var overhangEnd = sequenceModel.overhangBeyondEndStickyEndOnBothStrands(maxPos);
      if((circularise || !isFirst) && (overhangStart > 0)) {
        accepted = false;
      }
      if((circularise || !isLast) && (overhangEnd > 0)) {
        accepted = false;
      }
      if(accepted || truncateFeatures) {
        var copiedFeature = _.deepClone(feature);

        _.each(copiedFeature.ranges, (range) => {
          // TODO improve.  Is partial truncate implementation.  If there is a
          // range completely outside the seqeunce, it will be truncate to be
          // 1 long at the start / end of the sequence, which is a) stupid and
          // b) might overlap with another truncated range.  The range should
          // just be dropped completely.
          var overhangOnFrom = calculateOverhang(sequenceModel, range.from);
          var overhangOnTo = calculateOverhang(sequenceModel, range.to);
          range.from += offset;
          range.to += offset;
          if(truncateFeatures) {
            range.from += overhangOnFrom;
            range.to += overhangOnTo;
          }
        });

        attributes.features.push(copiedFeature);
      }
    });

    previousSequenceModel = sequenceModel;
    previousStickyEnds = stickyEnds;
    return attributes;
  }, {
    sequence: '',
    stickyEnds: {},
    features: [],
  });
  return new SequenceModel(newSequenceAttributes);
};


SequenceModel.calculateProduct = function(sequenceNts, opts) {
  if(_.isUndefined(opts.from) || _.isUndefined(opts.to)) {
    throw "Must specify `opts.from` and `opts.to`";
  }
  var regionOfInterest = sequenceNts.slice(opts.from, opts.to + 1);
  var startStickyEnd = opts.stickyEnds && opts.stickyEnds.start || '';
  var endStickyEnd = opts.stickyEnds && opts.stickyEnds.end || '';

  if(!_.isString(startStickyEnd)) startStickyEnd = startStickyEnd.sequence;
  if(!_.isString(endStickyEnd)) endStickyEnd = endStickyEnd.sequence;

  var productSequence = startStickyEnd + regionOfInterest + endStickyEnd;
  return {productSequence, regionOfInterest, startStickyEnd, endStickyEnd};
};



if(false) {
  class StubCurrentUser {
    get () {
      return '';
    }
  }
  var currentUser = new StubCurrentUser();
  Gentle.currentUser = currentUser;

  var sequence1 = new SequenceModel({
    sequence: 'CCCCCCCCCCCGGTACC',
    id: 1,
    stickyEnds: {
      // Leave a TA sticky end
      end: {
        reverse: false,
        offset: 2,
        size: 2,
      }
    },
    features: [{
      name: 'Sequence1Annotation',
      _type: 'sequence',
      ranges: [{
        from: 3,
        to: 8,
      }]
    },
    {
      name: 'Sequence1EndAnnotation',
      _type: 'sequence',
      ranges: [{
        from: 11, // let's say the GGTT is the RE site
        to: 14,
      }]
    }]
  });

  var sequence2 = new SequenceModel({
    sequence: 'CCTACCCCCCCCCCC',
    id: 2,
    stickyEnds: {
      // Leave a AT sticky end
      start: {
        reverse: true,
        offset: 2,
        size: 2,
      }
    },
    features: [
    {
      name: 'Sequence2AnnotationShouldStay',
      _type: 'sequence',
      ranges: [{
        from: 2,
        to: 2,
      }]
    },
    {
      name: 'Sequence2AnnotationShouldBeRemoved',
      _type: 'sequence',
      ranges: [{
        from: 1,
        to: 2, // let's say the CCTT is the RE site
      }]
    }
    ]
  });

  var sequence3 = new SequenceModel({
    sequence: 'GGGTACCGGGGGGGGGTAGG',
    id: 3,
    stickyEnds: {
      // Leave a AT sticky end
      start: {
        reverse: true,
        offset: 3,
        size: 2,
      },
      // Leave a TA sticky end
      end: {
        reverse: false,
        offset: 2,
        size: 2,
      }
    },
    features: [{
      name: 'Sequence3Annotation',
      _type: 'sequence',
      ranges: [{
        from: 17,
        to: 17,
      }]
    },
    {
      name: 'Sequence3AnnotationShouldBeRemoved',
      _type: 'sequence',
      ranges: [{
        from: 17,
        to: 18,
      }]
    },
    {
      name: 'Sequence3AnnotationShouldAlsoBeRemoved',
      _type: 'sequence',
      ranges: [{
        from: 18,
        to: 17,
      }]
    }]
  });


  // Test sticky end functions
  // Test isBeyondEndStickyEnd
  console.assert(sequence1.isBeyondEndStickyEnd(15));
  console.assert(sequence1.isBeyondEndStickyEnd(14, true));
  console.assert(!sequence1.isBeyondEndStickyEnd(14));
  console.assert(!sequence1.isBeyondEndStickyEnd(14, false));

  // Test isBeyondEndStickyEndOnBothStrands
  // console.assert(sequence1.isBeyondEndStickyEndOnBothStrands(15));
  // console.assert(!sequence1.isBeyondEndStickyEndOnBothStrands(14));

  // Test isBeyondStartStickyEnd
  console.assert(sequence2.isBeyondStartStickyEnd(1));
  console.assert(!sequence2.isBeyondStartStickyEnd(2, true));
  console.assert(sequence2.isBeyondStartStickyEnd(2));
  console.assert(sequence2.isBeyondStartStickyEnd(2, false));

  // Test isBeyondStartStickyEndOnBothStrands
  // console.assert(sequence2.isBeyondStartStickyEndOnBothStrands(1));
  // console.assert(!sequence2.isBeyondStartStickyEndOnBothStrands(2));

  // Test getStartStickyEndSequence
  console.assert(sequence1.getStartStickyEndSequence().sequence === '');
  console.assert(sequence1.getStartStickyEndSequence().isOnReverseStrand === undefined);
  console.assert(sequence2.getStartStickyEndSequence().sequence === 'AT');
  console.assert(sequence2.getStartStickyEndSequence().isOnReverseStrand);

  // Test getEndStickyEndSequence
  console.assert(sequence1.getEndStickyEndSequence().sequence === 'TA');
  console.assert(!sequence1.getEndStickyEndSequence().isOnReverseStrand);
  console.assert(sequence2.getEndStickyEndSequence().sequence === '');
  console.assert(sequence2.getEndStickyEndSequence().isOnReverseStrand === undefined);

  // Test stickyEndConnects
  console.assert(sequence1.stickyEndConnects(sequence2), 'sequence1 should be able to connect with sequence2');
  console.assert(!sequence2.stickyEndConnects(sequence1), 'sequence2 should not be able to connect with sequence1 (they are blunt ends)');

  // Test concatenateSequences
  var concatenatedSequence;
  var features;

  concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence2], false, false);
  console.assert(concatenatedSequence.get('sequence') === 'CCCCCCCCCCCGGTA' + 'CCCCCCCCCCC');
  features = concatenatedSequence.get('features');
  console.assert(features.length === 3);
  console.assert(features[0].name === 'Sequence1Annotation');
  console.assert(features[0].ranges[0].from === 3);
  console.assert(features[0].ranges[0].to === 8);
  console.assert(features[1].name === 'Sequence1EndAnnotation');
  console.assert(features[1].ranges[0].from === 11);
  console.assert(features[1].ranges[0].to === 14);
  console.assert(features[2].name === 'Sequence2AnnotationShouldStay');
  console.assert(features[2].ranges[0].from === 13);
  console.assert(features[2].ranges[0].to === 13);

  concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence3, sequence2], false, false);
  console.assert(concatenatedSequence.get('sequence') === 'CCCCCCCCCCCGGTA' + 'CCGGGGGGGGGTA' + 'CCCCCCCCCCC');
  features = concatenatedSequence.get('features');
  console.assert(features.length === 4);
  console.assert(features[0].name === 'Sequence1Annotation');
  console.assert(features[0].ranges[0].from === 3);
  console.assert(features[0].ranges[0].to === 8);
  console.assert(features[1].name === 'Sequence1EndAnnotation');
  console.assert(features[1].ranges[0].from === 11);
  console.assert(features[1].ranges[0].to === 14);
  console.assert(features[2].name === 'Sequence2AnnotationShouldStay');
  console.assert(features[2].ranges[0].from === 26);
  console.assert(features[2].ranges[0].to === 26);
  console.assert(features[3].name === 'Sequence3Annotation');
  console.assert(features[3].ranges[0].from === 27);
  console.assert(features[3].ranges[0].to === 27);

  concatenatedSequence = SequenceModel.concatenateSequences([sequence1, sequence3, sequence2], false, true);
  console.assert(concatenatedSequence.get('sequence') === 'CCCCCCCCCCCGGTA' + 'CCGGGGGGGGGTA' + 'CCCCCCCCCCC');
  features = concatenatedSequence.get('features');
  console.assert(features.length === 7);
  console.assert(features[0].name === 'Sequence1Annotation');
  console.assert(features[0].ranges[0].from === 3);
  console.assert(features[0].ranges[0].to === 8);
  console.assert(features[1].name === 'Sequence1EndAnnotation');
  console.assert(features[1].ranges[0].from === 11);
  console.assert(features[1].ranges[0].to === 14);
  console.assert(features[2].name === 'Sequence2AnnotationShouldBeRemoved');
  console.assert(features[2].ranges[0].from === 26);
  console.assert(features[2].ranges[0].to === 26);
  console.assert(features[3].name === 'Sequence2AnnotationShouldStay');
  console.assert(features[3].ranges[0].from === 26);
  console.assert(features[3].ranges[0].to === 26);
  console.assert(features[4].name === 'Sequence3Annotation');
  console.assert(features[4].ranges[0].from === 27);
  console.assert(features[4].ranges[0].to === 27);
  console.assert(features[5].name === 'Sequence3AnnotationShouldBeRemoved');
  console.assert(features[5].ranges[0].from === 27);
  console.assert(features[5].ranges[0].to === 27);
  console.assert(features[6].name === 'Sequence3AnnotationShouldAlsoBeRemoved');
  console.assert(features[6].ranges[0].from === 27);
  console.assert(features[6].ranges[0].to === 27);

  concatenatedSequence = SequenceModel.concatenateSequences([sequence3, sequence3], true, false);
  console.assert(concatenatedSequence.get('sequence') === 'CCGGGGGGGGGTA' + 'CCGGGGGGGGGTA');
  console.assert(_.isEmpty(concatenatedSequence.get('stickyEnds')));
  features = concatenatedSequence.get('features');
  console.assert(features.length === 2);
  console.assert(features[0].name === 'Sequence3Annotation');
  console.assert(features[0].ranges[0].from === 12);
  console.assert(features[0].ranges[0].to === 12);
  console.assert(features[1].name === 'Sequence3Annotation');
  console.assert(features[1].ranges[0].from === 25);
  console.assert(features[1].ranges[0].to === 25);


  // Test featuresInRange
  var features;
  features = sequence3.featuresInRange(0, 1);
  console.assert(features.length === 0);
  features = sequence3.featuresInRange(13, 19);
  console.assert(features.length === 3);
  features = sequence3.featuresInRange(18, 18);
  console.assert(features.length === 2);


  var error;
  try {
    SequenceModel.concatenateSequences([sequence1, sequence2, sequence2], false);
  } catch (e) {
    error = e;
  }
  console.assert(error === 'Can not concatenate sequences 2 and 2 as they have incompatible sticky ends: `` and `AT`');
  error = undefined;

  try {
    SequenceModel.concatenateSequences([sequence1, sequence2], true);
  } catch (e) {
    error = e;
  }
  console.assert(error === 'Can not concatenate sequences 2 and 1 as they have incompatible sticky ends: `` and ``');
  error = undefined;

  delete Gentle.currentUser;
}


export default SequenceModel;

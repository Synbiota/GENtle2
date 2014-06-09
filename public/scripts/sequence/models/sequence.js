/**
Handling sequences
@class Sequence
@module Sequence
@submodule Models
@main Models
**/
define(function(require) {
    var Gentle = require('gentle'),
        SequenceTransforms = require('sequence/lib/sequence_transforms'),
        HistorySteps = require('sequence/models/history_steps'),
        Backbone = require('backbone.mixed'),
        _ = require('underscore.mixed'),
        Sequence;

    Gentle = Gentle();

    Sequence = Backbone.DeepModel.extend({
        defaults: function() {
            return {
                id: +(new Date()) + '-' + (Math.floor(Math.random() * 10000)),
                displaySettings: {
                    rows: {
                        numbering: true,
                        features: true,
                        aa: 'none',
                        aaOffset: 0
                    }
                },
                history: new HistorySteps()
            };
        },

        constructor: function() {
            Backbone.DeepModel.apply(this, arguments);
            this.sortFeatures();
            this.maxOverlappingFeatures = _.memoize2(this._maxOverlappingFeatures);
            this.nbFeaturesInRange = _.memoize2(this._nbFeaturesInRange);
        },

        /**
    Returns the subsequence between the bases startBase and end Base
    @method getSubSeq
    @param {Integer} startBase start of the subsequence (indexed from 0)
    @param {Integer} endBase end of the subsequence (indexed from 0)
    **/
        getSubSeq: function(startBase, endBase) {
            if (endBase === undefined)
                endBase = startBase;
            else {
                if (endBase >= this.length() && startBase >= this.length()) return '';
                endBase = Math.min(this.length() - 1, endBase);
            }
            startBase = Math.min(Math.max(0, startBase), this.length() - 1);
            return this.attributes.sequence.substr(startBase, endBase - startBase + 1);
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
                    output = SequenceTransforms.toComplements(this.getSubSeq(startBase, endBase));
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
    @method featuresInRange
    @param {integer} startBase
    @param {integer} endBase
    @returns {array} all features present in the range
    **/
        featuresInRange: function(startBase, endBase) {
            if (_.isArray(this.attributes.features)) {
                return _(this.attributes.features).filter(function(feature) {
                    return !!~_.map(feature.ranges, function(range) {
                        return range.from <= endBase && range.to >= startBase;
                    }).indexOf(true);
                });
            } else {
                return [];
            }
        },

     /**
    @method validate
    @param {String} id
    @param {String} text
    @returns {String} replaces the form feild text
    **/
        validate: function(attrs, options) {
        errors = [];
        if(!attrs.name.replace(/\s/g, '').length) 
        {
        errors.push({name : true, description : false});
        }
        if(!attrs.description.replace(/\s/g, '').length && attrs.description!='No Description') 
        {
        errors.push({name : false, description : true});
        }
        else{
        errors.push({name : false, description : false});  
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

            while (ranges.length > 1 && _.difference(ranges, previousRanges).length && i < 100) {
                previousRanges = _.clone(ranges);
                ranges = filterOverlappingRanges(ranges);
                i++;
            }
            return i + 1;
        },

        /**
    @method featuresCountInRange
    @returns {integer}
    **/
        _nbFeaturesInRange: function(startBase, endBase) {
            return _.filter(this.attributes.features, function(feature) {
                return _.some(feature.ranges, function(range) {
                    return range.from <= endBase && range.to >= startBase;
                });
            }).length;
        },

        insertBases: function(bases, beforeBase, updateHistory) {


            var seq = this.get('sequence');

            if (updateHistory === undefined) updateHistory = true;

            this.set('sequence',
                seq.substr(0, beforeBase) +
                bases +
                seq.substr(beforeBase, seq.length - beforeBase + 1)
            );

            this.moveFeatures(beforeBase, bases.length);

            if (updateHistory) {
                this.getHistory().add({
                    type: 'insert',
                    position: beforeBase,
                    value: bases,
                    operation: '@' + beforeBase + '+' + bases,
                    timestamp: +(new Date())
                });
            }

            this.throttledSave();
        },

        deleteBases: function(firstBase, length, updateHistory) {
            var seq = this.get('sequence'),
                subseq;
            if (updateHistory === undefined) updateHistory = true;


            subseq = seq.substr(firstBase, length);

            this.set('sequence',
                seq.substr(0, firstBase) +
                seq.substr(firstBase + length, seq.length - (firstBase + length - 1))
            );

            this.moveFeatures(firstBase, -length);

            if (updateHistory) {
                this.getHistory().add({
                    type: 'delete',
                    value: subseq,
                    position: firstBase,
                    operation: '@' + firstBase + '-' + subseq,
                    timestamp: +(new Date())
                });
            }

            this.throttledSave();

        },

        moveFeatures: function(base, offset) {
            var features = this.get('features'),

                firstBase, lastBase;
            if (_.isArray(features)) {

                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];

                    for (var j = 0; j < feature.ranges.length; j++) {
                        var range = feature.ranges[j];

                        if (offset > 0) {

                            if (range.from >= base) range.from += offset;
                            if (range.to >= base) range.to += offset;


                            this.recordFeatureHistoryIn(feature, false, false);


                        } else {

                            firstBase = base;
                            lastBase = base - offset - 1;

                            if (firstBase <= range.from) {
                                if (lastBase >= range.to) {
                                    this.recordFeatureHistoryIn(feature, range.from, range.to);
                                    feature.ranges.splice(j--, 1);
                                } else {
                                    range.from -= lastBase < range.from ? -offset : range.from - firstBase;
                                    range.to += offset;
                                    this.recordFeatureHistoryIn(feature, false, false);

                                }
                            } else if (firstBase <= range.to) {
                                range.to = Math.max(firstBase - 1, -offset);



                                this.recordFeatureHistoryIn(feature, false, false);

                            }

                        }
                    }
                    // If there are no more ranges, we remove the feature and
                    // record the operation in the history
                    if (feature.ranges.length === 0) {
                        this.recordFeatureHistoryDel(feature, range.from, range.to, false);
                        features.splice(i--, 1);
                    }
                }
                this.clearFeatureCache();

            }
        },

        clearFeatureCache: function() {
            this.nbFeaturesInRange.clearCache();
            this.maxOverlappingFeatures.clearCache();
        },

        getHistory: function() {
            if (this.attributes.history.toJSON === undefined) {
                this.attributes.history = new HistorySteps(this.attributes.history);
            }
            return this.attributes.history;
        },

        undo: function() {
            var history = this.getHistory(),
                lastStep = history.first();

            if (lastStep) {
                this.revertHistoryStep(lastStep);
                history.remove(lastStep);
            }
        },

        undoAfter: function(timestamp) {
            var _this = this,
                toBeDeleted = [];

            this.getHistory().all(function(historyStep) {
                if (historyStep.get('timestamp') >= timestamp) {

                    toBeDeleted.push(historyStep);
                    _this.revertHistoryStep.call(_this, historyStep);
                    return true;

                } else {
                    // the HistorySteps collection is sorted by DESC timestamp
                    // so we can break out of the loop.
                    return false;
                }
            });

            this.getHistory().remove(toBeDeleted);
            this.save();

        },

        revertHistoryStep: function(historyStep) {
            switch (historyStep.get('type')) {

                case 'annotatein':
                    this.undoFeature(historyStep.get('timestamp'));
                    break;

                case 'annotatedel':
                    this.undoFeature(historyStep.get('timestamp'));
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

        setupRanges: function(feature) {
            var ranges = feature.ranges;
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

        undoFeature: function(timestamp) {
            var annHistoryIn,
                annHistoryDel;
            annHistoryIn = this.getHistory().where({
                timestamp: timestamp,
                type: 'annotatein'
            });
            annHistoryDel = this.getHistory().where({
                timestamp: timestamp,
                type: 'annotatedel'
            });
            if (annHistoryIn[0] != undefined) {
                this.deleteFeature(annHistoryIn[0].attributes.feature, false);
            }
            if (annHistoryDel[0] != undefined) {
                this.createFeature(annHistoryDel[0].attributes.feature, false);
            }

        },

        updateFeature: function(editedFeature, record) {
            var oldFeature = _.indexBy(this.get('features'), '_id')[editedFeature._id],
                id = this.get('features').indexOf(oldFeature),
                Feature = editedFeature;

            this.clearFeatureCache();
            this.set('features.' + id, editedFeature);
            this.sortFeatures();
            this.save();
            if (record){
                this.recordFeatureHistoryIn(Feature, false, false);
            }
            this.throttledSave();
        },

        createFeature: function(newFeature, record) {
            var id = this.get('features').length;
            var fromN, toN;
            var seqmem;
            var Feature = newFeature;
            if (record) {
                this.recordFeatureHistoryIn(Feature, false, false);

            } else if (record == false) {
                if (Feature.ranges[0] == undefined) {

                    seqmem = this.getHistory().where({
                        extension: 'memoryVar'
                    });
                    fromN = seqmem[0].attributes.range[0].from;
                    if (fromN != 0)
                        fromN -= 1;
                    toN = seqmem[0].attributes.range[0].to - 1;
                    Feature.ranges[0] = {
                        from: fromN,
                        to: toN
                    };

                }
            }
            if (id === 0) {
                newFeature._id = 0;
            } else {
                newFeature._id = _.max(_.pluck(this.get('features'), '_id')) + 1;
            }

            this.clearFeatureCache();
            this.set('features.' + id, newFeature);
            this.sortFeatures();
            this.save();
            this.throttledSave();
        },

        deleteFeature: function(Feature, record) {
            this.clearFeatureCache();
            if (record) {
                this.recordFeatureHistoryDel(Feature, false, false);
            }
            this.set('features', _.reject(this.get('features'), function(feature) {
                return feature._id == Feature._id;
            }));
            this.sortFeatures();
            this.save();
            this.throttledSave();
        },

        recordFeatureHistoryIn: function(feature, fromVal, toVal) {

            var fromN, toN, susbseq, seqmem, extensionMem;

            if (feature.ranges[0] == undefined) {


                seqmem = this.model.getHistory().where({
                    extension: 'memoryVar'
                });

                fromN = seqmem[0].attributes.range[0].from;
                toN = seqmem[0].attributes.range[0].to;

                feature.ranges[0] = {
                    from: fromN,
                    to: toN
                };
            } else {

                if (fromVal == false) {
                    fromN = feature.ranges[0].from + 1;
                } else {
                    fromN = fromVal + 1;
                }
                if (toVal == false) {
                    toN = (feature.ranges[0].to + 1);
                } else {
                    toN = toVal + 1;
                }
            }

            if (toN - fromN == 1) {
                extensionMem = "memoryVar";
            } else {
                extensionMem = '';
            }

            this.getHistory().add({
                type: 'annotatein',
                feature: feature,
                name: feature.name,
                annType: feature._type,
                range: [{
                    from: fromN,
                    to: toN
                }],
                extension: extensionMem,
                timestamp: +(new Date())
            });

        },

        recordFeatureHistoryDel: function(feature, fromVal, toVal) {
            var fromN;
            var toN;
            if (fromVal == false) {
                if (feature.ranges[0] == undefined)
                    fromN = 1;
                else
                    fromN = feature.ranges[0].from + 1;
            } else {
                fromN = fromVal + 1;
            }
            if (toVal == false) {
                if (feature.ranges[0] == undefined)
                    toN = 1;
                else
                    toN = feature.ranges[0].to + 1;
            } else {
                toN = toVal + 1;
            }
            this.getHistory().add({
                type: 'annotatedel',
                name: feature.name,
                feature: feature,
                annType: feature._type,
                range: [{
                    from: fromN,
                    to: toN
                }],
                timestamp: +(new Date())
            });
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

        length: function() {
            return this.attributes.sequence.length;
        },

        serialize: function() {
            return _.extend(Backbone.Model.prototype.toJSON.apply(this), {
                isCurrent: (Gentle.currentSequence && Gentle.currentSequence.get('id') == this.get('id')),
                length: this.length()
            });
        },

        throttledSave: function() {
            return _.throttle(_.bind(this.save, this), 100)();
        }

    });

    return Sequence;
});
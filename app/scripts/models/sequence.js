/**
Handling sequences
@class Sequence
**/
define(function(require){
  var Backbone            = require('backbone'),
      Gentle              = require('gentle'),
      SequenceTransforms  = require('lib/sequence_transforms'),
      DeepModel = require('deepmodel'),
      Sequence;

  Gentle = Gentle();

  Sequence = Backbone.DeepModel.extend({
    defaults: function() {
      return {
        id: +(new Date()) + '-' + (Math.floor(Math.random()*10000)),
        displaySettings: {
          rows: {
            numbering: true,
            features: true,
            aa: 'none',
            aaOffset: 0
          }
        }
      };
    },

    // constructor: function() {
    //   this.on('change:features', function() {
    //     this.maxOverlappingFeatures.cache = {};
    //   });
    // },

    /**
    Returns the subsequence between the bases startBase and end Base
    @method getSubSeq
    @param {Integer} startBase start of the subsequence (indexed from 0)
    @param {Integer} endBase end of the subsequence (indexed from 0)
    **/
    getSubSeq: function(startBase, endBase) {
      if(endBase === undefined) 
        endBase = startBase;
      else { 
        if(endBase >= this.length() && startBase >= this.length()) return '';
        endBase = Math.min(this.length() - 1, endBase);
      }
      startBase = Math.min(Math.max(0,startBase), this.length() - 1);
      return this.attributes.sequence.substr(startBase, endBase-startBase+1);
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
      switch(variation) {
        case 'aa-long': 
        case 'aa-short':
          var paddedSubSeq = this.getPaddedSubSeq(startBase, endBase, 3, options.offset || 0),
              offset;
          output = _.map(paddedSubSeq.subSeq.match(/.{1,3}/g) || [], function(codon) {
            if(options.complements === true) codon = SequenceTransforms.toComplements(codon);
            return SequenceTransforms[variation == 'aa-long' ? 'codonToAALong' : 'codonToAAShort'](codon);
          }).join('');
          offset = Math.max(0, paddedSubSeq.startBase - startBase);
          output = output.substr(Math.max(0,startBase - paddedSubSeq.startBase), endBase - startBase + 1 - offset);
          _.times(Math.max(0, offset), function() { output = ' ' + output; });
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
      if(subSeq.startBase > base) {
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
      if(_.isArray(this.attributes.features)) {
        return _(this.attributes.features).filter(function(feature) {
          return !!~_.map(feature._range, function(range) {
            return range.from <= endBase && range.to >= startBase;
          }).indexOf(true);
        });
      } else {
        return [];
      }
    },

    /**
    @method maxOverlappingFeatures
    @returns {integer}
    **/
    maxOverlappingFeatures: _.memoize2(function() {
      var ranges = _.flatten(_.pluck(this.attributes.features, '_range')),
          previousRanges = [], i = 0;

      while(ranges.length > 1 && _.difference(ranges, previousRanges).length && i < 100) {
        previousRanges = _.clone(ranges);
        ranges = _.filter(ranges, function(range) {
          return _.some(ranges, function(testRange) {
            return range != testRange && range.from <= testRange.to && range.to >= testRange.from;
          });
        });
        i++;
      }
      return i+1;
    }),

    /**
    @method featuresCountInRange
    @returns {integer}
    **/
    nbFeaturesInRange: _.memoize2(function(startBase, endBase) {
      return _.filter(this.attributes.features, function(feature) {
        return _.some(feature._range, function(range) {
          return range.from <= endBase && range.to >= startBase;
        });
      }).length;
    }),

    length: function() { return this.attributes.sequence.length; },

    serialize: function() {
      return _.extend(Backbone.Model.prototype.toJSON.apply(this), {
        isCurrent: (Gentle.currentSequence && Gentle.currentSequence.get('id') == this.get('id'))
      });
    },

    throttledSave: function() { return _.throttle(_.bind(this.save, this), 100)(); }

  });

  return Sequence;
});
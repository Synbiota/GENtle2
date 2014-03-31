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
            complements: true
          }
        }
      };
    },

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
      return {
        sequence: subSeq.subSeq,
        position: (base - offset) % 3
      };
    },

    /**
    @method codonToAA
    **/
    getAA: function(variation, base, offset) {
      var codon = this.getCodon(base, offset || 0),
          aa = SequenceTransforms[variation == 'short' ? 'codonToAAShort' : 'codonToAALong'](codon.sequence);
      return {
        sequence: aa,
        position: codon.position
      };
    },


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
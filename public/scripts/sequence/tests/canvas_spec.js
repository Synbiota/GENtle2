import _ from 'underscore';
import {dnaTextColour} from '../lib/sequence_calculations';
import SequenceModel from '../models/sequence';
import {stubCurrentUser} from '../../common/tests/stubs';

stubCurrentUser();

var defaultColour = '#222';
var complementaryColour = '#999';
var stickyEndColour = '#59955C';
var hiddenColouring = '#fff';


describe('dnaTextColour', function() {
  var forwardDnaColour, reverseDnaColour, stickyEndedSequence;
  beforeAll(function() {
    stickyEndedSequence = new SequenceModel({
      sequence: 'AATGCTT',
      stickyEnds: {
        start: {
          offset: 2,
          size: 1,
          reverse: true,
          name: '',
          sequence: '',
        },
        end: {
          offset: 2,
          size: 1,
          reverse: false,
          name: '',
          sequence: '',
        }
      }
    });
    forwardDnaColour = _.partial(dnaTextColour, stickyEndedSequence, false, defaultColour, '');
    reverseDnaColour = _.partial(dnaTextColour, stickyEndedSequence, true, complementaryColour, '');
  });

  describe('full stickyEnd view', function() {
    beforeEach(function() {
      stickyEndedSequence.setStickyEndFormat('full');
    });

    it('should correctly colour the ends', function() {
      expect(forwardDnaColour(1)).toEqual(defaultColour);
      expect(reverseDnaColour(1)).toEqual(complementaryColour);
      expect(forwardDnaColour(5)).toEqual(defaultColour);
      expect(reverseDnaColour(5)).toEqual(complementaryColour);
    });

    it('should correctly colour the sticky overhang', function() {
      expect(forwardDnaColour(2)).toEqual(defaultColour);
      expect(reverseDnaColour(2)).toEqual(complementaryColour);
      expect(forwardDnaColour(4)).toEqual(defaultColour);
      expect(reverseDnaColour(4)).toEqual(complementaryColour);
    });

    it('should correctly colour the middle', function() {
      expect(forwardDnaColour(3)).toEqual(defaultColour);
      expect(reverseDnaColour(3)).toEqual(complementaryColour);
    });
  });


  describe('overhang stickyEnd view', function() {
    beforeEach(function() {
      stickyEndedSequence.setStickyEndFormat('overhang');
    });

    it('should correctly colour the sticky overhang', function() {
      expect(forwardDnaColour(0)).toEqual(hiddenColouring);
      expect(reverseDnaColour(0)).toEqual(stickyEndColour);
      expect(forwardDnaColour(2)).toEqual(stickyEndColour);
      expect(reverseDnaColour(2)).toEqual(hiddenColouring);
    });

    it('should correctly colour the middle', function() {
      expect(forwardDnaColour(1)).toEqual(defaultColour);
      expect(reverseDnaColour(1)).toEqual(complementaryColour);
    });
  });


  describe('no stickyEnd view', function() {
    beforeEach(function() {
      stickyEndedSequence.setStickyEndFormat('none');
    });

    it('should correctly colour the middle', function() {
      expect(forwardDnaColour(0)).toEqual(defaultColour);
      expect(reverseDnaColour(0)).toEqual(complementaryColour);
    });

    it('should ignore out of bounds positions', function() {
      expect(forwardDnaColour(-1)).toEqual(hiddenColouring);
      expect(reverseDnaColour(1)).toEqual(hiddenColouring);
    });
  });
});

import PrimerCalculation from '../../pcr/lib/primer_calculation';
import {defaultSequencingPrimerOptions} from '../../pcr/lib/primer_defaults';
import getAllPrimersAndProducts from '../lib/sequencing_primers_design';
import Primer from '../../pcr/lib/primer';

import {mikeForward1} from '../../pcr/lib/universal_primers';
import {sequence863, sequenceFromMike} from './test_sequences';
import {expected863Primers, expectedMikePrimers} from './test_expected_primers';


var checkResult = function(testLabel, expectedPrimersAndProducts, calculatedPrimersAndProducts) {
  var productFields = ['from', 'to', 'name'];
  var primerFields = ['from', 'to', 'name', 'sequence', 'meltingTemperature', 'gcContent'];
  _.each(expectedPrimersAndProducts, function(expectedProductAndPrimer, i){
    _.each(productFields, function(productField, j) {
      var expected = expectedProductAndPrimer[productField];
      var calculated = calculatedPrimersAndProducts[i][productField];
      expect(expected).toEqual(calculated); //, `productField \`${productField}\`: expected ${expected} and calculated ${calculated} are not equal.`);
    });
    _.each(primerFields, function(primerField, j) {
      var expected = expectedProductAndPrimer.primer[primerField];
      var calculated = calculatedPrimersAndProducts[i].primer[primerField];
      expect(expected).toEqual(calculated); //, `primerField \`${primerField}\`: expected ${expected} and calculated ${calculated} are not equal.`);
    });
  });
};

var getAllPrimersAndProducts_TestFactory = function(sequence, testLabel, firstPrimerDetails, expectedPrimersAndProducts) {
  // console.log(`Set up getAllPrimersAndProducts test for ${testLabel}`);

  var firstPrimer = new Primer(firstPrimerDetails);
  var promisePrimersAndProducts = getAllPrimersAndProducts(sequence, firstPrimer, defaultSequencingPrimerOptions())
  .then(function(calculatedPrimersAndProducts){
    // console.log(`Got getAllPrimersAndProducts results for ${testLabel}, calculatedPrimersAndProducts:`, calculatedPrimersAndProducts);
    checkResult(testLabel, expectedPrimersAndProducts, calculatedPrimersAndProducts);
  }).catch(function(e){
    console.error(e);
  });
  
  return promisePrimersAndProducts;
};


var oldIDTMeltingTemperature;

beforeEach(function(done) {
  if(!oldIDTMeltingTemperature) {
    oldIDTMeltingTemperature = PrimerCalculation.stubOutIDTMeltingTemperature();
  }
  done();
});


describe('finding Sequencing Primers', function() {
  it('find primers for sequence863', function(done) {

    var firstPrimerDetails = {
      sequence: 'AAAGGGAAAGGGAAACCCAAA',
      name: 'First (universal) primer',
      from: -100,
      to: -80,
      meltingTemperature: 62.6,
      gcContent: 0.429,
    };

    var testSequence863 = getAllPrimersAndProducts_TestFactory(sequence863,
    'getAllPrimersAndProducts with sequence863', firstPrimerDetails, expected863Primers);

    testSequence863.then(done);
  });

  it('find primers for sequence from Mike', function(done) {
    var testSequenceFromMike = getAllPrimersAndProducts_TestFactory(sequenceFromMike,
    'getAllPrimersAndProducts with sequenceFromMike', mikeForward1(), expectedMikePrimers);

    testSequenceFromMike.then(done);
  });

  it('finally: teardown', function(done) {
    PrimerCalculation.restoreIDTMeltingTemperature(oldIDTMeltingTemperature);
    done();
  });

});


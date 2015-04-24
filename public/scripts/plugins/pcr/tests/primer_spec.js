import _ from 'underscore';
import Primer from '../lib/primer';


describe('pcr primer class', function() {

  it('can instantiate', function() {
    try {
      new Primer({
        sequence: 'AGCTAAAAAAAAAA',
        from: 5,
        to: 18,
        meltingTemperature: 48,
        gcContent: 0.5,
      });
    } catch (e) {
      expect(e).toBeFalsy();
    }
  });

  it('should error about `from` being more than `sequence.length`', function() {
    var error;
    try {
      var primerSequenceTooShort = new Primer({
        sequence: 'AGCT',
        from: 5,
        to: 10,
        meltingTemperature: 48,
        gcContent: 0.5,
      });
    } catch (e) {
      error = e.toString();
    }
    expect(error).toEqual("Error: length of sequence '4' does not accommodate `from` '5' and `to` '10' (length should be: '6')");
  });

  it('should error about a missing required field', function() {
    var error;
    try {
      var primerMissingField = new Primer({
        from: 5,
        to: 10,
        meltingTemperature: 48,
        gcContent: 0.5,
      });
    } catch (e) {
      error = e.toString();
    }
    expect(error).toEqual("Error: Field `sequence` is absent");
  });

  it('should error about invalid `from`, `to` and `reverse` values', function() {
    var error;
    try {
      var primerInvalidFromToFieldValues = new Primer({
        sequence: 'AGCTAAAAAAAAAA',
        from: 5,
        to: 18,
        reverse: true,
        meltingTemperature: 48,
        gcContent: 0.5,
      });
    } catch (e) {
      error = e.toString();
    }
    expect(error).toEqual("Error: Invalid `from`, `to` and `reverse` values: '5', '18', 'true'");
  });

});

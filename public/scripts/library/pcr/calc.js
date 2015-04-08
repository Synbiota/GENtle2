import getSequenceFromFile from '../common/get_sequence_from_file';
import getPcrProductAndPrimers from '../../plugins/pcr/lib/pcr_primer_design';
import _ from 'underscore';
import Q from 'q';


import PrimerCalculation from '../../plugins/pcr/lib/primer_calculation';
import idtMeltingTemperatureStub from '../../plugins/pcr/tests/idt_stub';

// PrimerCalculation.stubOutIDTMeltingTemperature(idtMeltingTemperatureStub);


var calculatePrimers = function({inputFile, primerFrom, primerEnd, primerTo}) {
  // var promisePrimers = Q.defer();
  getSequenceFromFile(inputFile).then(function(sequences) {
    if(sequences.length === 1) {
      var sequence = sequences[0].sequence;
      if(_.isNaN(primerFrom)) throw `'from' value must be specified but was: ${primerFrom}`;
      var to = primerTo;
      if(_.isNaN(to)) {
        to = sequence.length - 1 - primerEnd;
      }
      if(_.isNaN(to)) throw `'to' or 'end' value must be specified but were: ${primerTo} ${primerEnd}`;

      var options = {from: primerFrom, to: to};
      console.log(`calculating pcr product ${JSON.stringify(options)} for sequence:\n`, sequence, '\n');
      getPcrProductAndPrimers(sequence, options)
      .then(function(pcrProduct){

        console.log('pcr product result:\n', JSON.stringify(pcrProduct));

      }).done();
    } else {
      console.error(`You must provide 1 and only 1 sequence to process but provided ${sequences.length}`);
      process.exit(1);
    }
  })
  // .catch(function(error) {
  //   promisePrimers.reject(error);
  // })
  .done();

  // return promisePrimers.promise;
};

export default calculatePrimers;

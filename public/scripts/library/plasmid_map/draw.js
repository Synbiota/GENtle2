import getSequenceFromFile from '../common/get_sequence_from_file';

var drawPlasmidMap = function({inputFile, outputFile}) {
  getSequenceFromFile(inputFile).then(function(sequences) {
    console.log('sequences', JSON.stringify(sequences));
    // TODO draw the plasmid
  }).done();
};

export default drawPlasmidMap;

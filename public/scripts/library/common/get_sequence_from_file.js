import FileTypes from './../../common/lib/filetypes/filetypes';


var getSequenceFromFile = function(inputFile) {
  var fs = require('fs');
  var inputFileContents = fs.readFileSync(inputFile);
  var inputFileString = inputFileContents.toString();
  return FileTypes.guessTypeAndParseFromText(inputFileString)
  .catch(function(err) {
    console.error(err);
    process.exit();
  });
};

export default getSequenceFromFile;

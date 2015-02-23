import Proxy from '../../../common/lib/proxy';
import _ from 'underscore.mixed';
import Q from 'q';

var url = "http://www.idtdna.com/AnalyzerService/AnalyzerService.asmx/Analyze";
// ?Sequence=atcgatcgatcg&TargetType=DNA&OligoConc=0.25&NaConc=50&MgConc=2&dNTPsConc=0

var cache = {};

var cacheKey = function(sequence, options) { 
  return _.flatten([sequence, _.pairs(options)]).join('~');
};

var getResults = function(sequence, options) {
  var key = cacheKey(sequence, options);
  if(_.has(cache, key)) {
    return Q(cache[key]);
  } else {
    return Proxy.yqlGetXml(url, { 
      Sequence: sequence,
      OligoConc: options.concentration * 1e6,
      NaConc: options.naPlusConcentration * 1e3,
      MgConc: options.mg2PlusConcentration * 1e3,
      dNTPsConc: options.dNTPsConcentration * 1e3,
      TargetType: 'DNA'
    }).then(function(results) {
      if(_.isObject(results)) {
        return cache[key] = results.AnalyzerResult;
      } else {
        return {};
      }
    }, (e) => console.log(e));
  }
};


export default function(sequence, opts = {}) {
  return getResults(
    _.isString(sequence) ? sequence : sequence.get('sequence'),
    _.defaults(opts, {
      concentration: 0.25e-6,
      naPlusConcentration: 50e-3,
      mg2PlusConcentration: 2e-3,
      dNTPsConcentration: 0.2e-3
    })
  );
}
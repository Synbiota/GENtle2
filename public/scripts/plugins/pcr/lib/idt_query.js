import Proxy from '../../../common/lib/proxy';
import _ from 'underscore';
import Q from 'q';
// import Tms from '../tests/melting_temperatures';
// var cache = _.clone(Tms);  // makes running development faster with known sequences
var cache = {};


var url = "http://www.idtdna.com/AnalyzerService/AnalyzerService.asmx/Analyze";
// ?Sequence=atcgatcgatcg&TargetType=DNA&OligoConc=0.25&NaConc=50&MgConc=2&dNTPsConc=0


var cacheKey = function(sequence, options) {
  return _.flatten([sequence, _.pairs(options)]).join('~');
};

// Call IDT at most every N milliseconds
var rateLimitedYqlGetXml = Proxy.getRateLimitedYqlGetXml(100);

var getResults = function(sequence, options) {
  var key = cacheKey(sequence, options);
  if(_.has(cache, key)) {
    return Q(cache[key]);
  } else {
    return rateLimitedYqlGetXml(url, {
      Sequence: sequence,
      OligoConc: options.concentration * 1e6,
      NaConc: options.naPlusConcentration * 1e3,
      MgConc: options.mg2PlusConcentration * 1e3,
      dNTPsConc: options.dNTPsConcentration * 1e3,
      TargetType: 'DNA'
    }).then(function(results) {
      if(_.isObject(results)) {
        cache[key] = results.AnalyzerResult;
        return cache[key];
      } else {
        return {};
      }
    })
    .catch((e) => {
      console.error('idt_query, getResults:', e);
      throw e;
    });
  }
};


export default function(sequence, opts = {}) {
  return getResults(
    _.isString(sequence) ? sequence : sequence.getSequence(),
    _.defaults(opts, {
      concentration: 0.25e-6,
      naPlusConcentration: 50e-3,
      mg2PlusConcentration: 2e-3,
      dNTPsConcentration: 0.2e-3
    })
  );
}
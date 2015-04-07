import Tms from './melting_temperatures';
import {_IDTMeltingTemperature} from '../lib/primer_calculation';
import Q from 'q';
import _ from 'underscore';


var idtMeltingTemperatureStub = function(potentialPrimer) {
  return Q.promise(function(resolve) {
    var Tm = Tms[potentialPrimer];
    if(Tm) {
      console.log(`stubbedIDTMeltingTemperature received: ${potentialPrimer}, responding with Tm: ${Tm}`);
      resolve(Tm);
    } else {
      // Set to true to go and get the result from IDT and record it so that
      // we can update the Tms dictionary
      // Default this to false, we don't want to be hammering IDT during tests accidentally.
      var automaticallyGoToIDT = false;
      if(automaticallyGoToIDT) {
        console.warn(`Getting result from IDT for ${potentialPrimer} and storing on \`window.TmsFromIDT\`.  Please update the Tms dictionary.`);
        if(!window.TmsFromIDT) window.TmsFromIDT = [];
        _IDTMeltingTemperature(potentialPrimer).then(function(Tm) {
          window.TmsFromIDT.push({[potentialPrimer]: Tm});
          window.TmsFromIDT = _.sortBy(window.TmsFromIDT, function(li){return _.keys(li)[0];});

          var TmsAsString = _.map(window.TmsFromIDT, function(Tm) {
            return `'${_.keys(Tm)[0]}': ${_.values(Tm)[0]},`;
          }).join('\n');
          console.log('\nTms from IDT:\n' + TmsAsString);
          resolve(Tm);
        });
      } else {
        throw `Unknown IDT Tm for ${potentialPrimer}.  Look up on https://www.idtdna.com/calc/analyzer with 2 mM Mg++, 0.2 mM dNTPs, and add to \`Tms\` dict.`;
      }
    }
  });
};


export default idtMeltingTemperatureStub;

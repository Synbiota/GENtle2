import Tms from './melting_temperatures';
import {_IDTMeltingTemperature} from '../lib/primer_calculation';
import Q from 'q';


var idtMeltingTemperatureStub = function(potentialPrimer) {
  return Q.promise(function(resolve) {
    var Tm = Tms[potentialPrimer];
    if(Tm) {
      // console.log(`stubbedIDTMeltingTemperature received: ${potentialPrimer}, responding with Tm: ${Tm}`);
      resolve(Tm);
    } else {
      // Set to true to go and get the result from IDT and record it so that
      // we can update the Tms dictionary
      // Default this to false, we don't want to be hammering IDT during tests.
      var automaticallyGoToIDT = false;
      if(automaticallyGoToIDT) {
        console.warn(`Getting result from IDT for ${potentialPrimer} and storing on \`window.TmsFromIDT\`.  Please update the Tms dictionary.`);
        if(!window.TmsFromIDT) window.TmsFromIDT = '';
        _IDTMeltingTemperature(potentialPrimer).then(function(Tm) {
          window.TmsFromIDT += `'${potentialPrimer}': ${Tm},`;
          console.log('TmsFromIDT', window.TmsFromIDT);
          resolve(Tm);
        });
      } else {
        throw `Unknown IDT Tm for ${potentialPrimer}.  Look up on https://www.idtdna.com/calc/analyzer with Mg++ Conc of 2mM, and add to \`Tms\` dict.`;
      }
    }
  });
};


export default idtMeltingTemperatureStub;

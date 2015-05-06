import _ from 'underscore';
import Backbone from 'backbone';
import Gentle from 'gentle';
import SynbioData from '../../common/lib/synbio_data';
import template from '../templates/stop_codons_view.hbs';


export default Backbone.View.extend({

  template: template,
  manage: true,
  foundSites: [],
  targets: [],
  className: "stop-codons",

  events: {
    'click .find-stop-codons': 'findStopCodons',
  },

  initialize: function() {
    //console.log("initialize find stop codons");
    this.model = Gentle.currentSequence;

    this.targets = this.getTargets();
    //console.log(this.targets);

    this.listenTo(
      this.model,
      'change:sequence',
      this.render,
      this
    );

  },

  findStopCodons: function(event) {
    if (event) { event.preventDefault(); }

    //console.log("searching: ");
    //console.log(this.model.attributes.sequence);
    //console.log("for: ")
    //console.log(this.targets);

    var matches = []

    var pattern = this.targets.join("|");
    var regex = new RegExp(pattern, "gi");
    var match;
    while((match = regex.exec(this.model.attributes.sequence)) != null) {
      //console.log(match);

      var matchHash = {}
      matchHash["codon"] = match[0]
      matchHash["start"] = match.index;
      matchHash["end"] = match.index+2

      matches.push(matchHash); 
    }
    
    console.log("found these codons");
    console.log(matches);
  },

  getTargets: function() {
    
    var targets = [];

    for(var aaIndex in SynbioData.aa) {
      if (SynbioData.aa[aaIndex].long == "STP") {
        targets = SynbioData.aa[aaIndex].codons;
        break;
      }
      /*else {
        console.log(SynbioData.aa[aaIndex]);
        console.log(SynbioData.aa[aaIndex].long);
        console.log(SynbioData.aa[aaIndex]["long"]);
      }*/
    }

    return targets;
  }

});
import Primer from '../lib/primer';
import PcrPrimer from '../lib/pcr_primer';
import PcrProductSequence from '../lib/product';


describe('PcrProductSequence', function() {
  var pcrProductSequence = new PcrProductSequence({
    "name": "ertry-RDP",
    "sequence": "TCAGTCAGTCAGTCAGGGTCTCAGATGAACCCTTT",
    "sourceSequenceName": "ertry",
    "features": [
      {
        "_type": "misc",
        "name": "X-sdf-Z'",
        "desc": "",
        "ranges": [
          {
            "from": 0,
            "to": 35
          }
        ]
      }
    ],
    "rdpEdits": [],
    "frm": 0,
    "size": 35,
    "desc": "ertry-RDP",
    "shortName": "X-sdf-Z'",
    "partType": "CDS",
    "stickyEnds": {
      "start": {
        "sequence": "TCAG",
        "reverse": false,
        "offset": 2,
        "size": 2,
        "name": "X"
      },
      "end": {
        "sequence": "CTTT",
        "reverse": true,
        "offset": 2,
        "size": 2,
        "name": "Z'"
      },
      "name": "X-Z'"
    },
    "meta": {
      "associations": {
        "forwardPrimer": {
          "range": {
            "from": 0,
            "size": 10,
            "reverse": false
          },
          "annealingRegion": {
            "range": {
              "from": 5,
              "size": 5,
              "reverse": false
            },
            "meltingTemperature": 67.4,
            "gcContent": 0.48,
            "name": "Forward primer - Annealing Region",
          },
          "name": "Forward primer",
        },
        "reversePrimer": {
          "range": {
            "from": 25,
            "size": 10,
            "reverse": true
          },
          "annealingRegion": {
            "range": {
              "from": 30,
              "size": 5,
              "reverse": true
            },
            "meltingTemperature": 67.4,
            "gcContent": 0.46153846153846156,
            "name": "Reverse primer - Annealing Region",
          },
          "name": "Reverse primer",
        }
      }
    }
  });
  
  it('should instantiate forwardPrimer', function() {
    var forwardPrimer = pcrProductSequence.get('forwardPrimer');
    expect(forwardPrimer instanceof PcrPrimer).toEqual(true);
    expect(forwardPrimer.range.to).toEqual(10);
    var annealingRegion = forwardPrimer.annealingRegion;
    expect(annealingRegion instanceof Primer).toEqual(true);
    expect(annealingRegion.range.from).toEqual(5);
  });

  it('should serialise and include forwardPrimer', function() {
    var serialised = pcrProductSequence.toJSON();
    expect(serialised.meta.associations.forwardPrimer.range.size).toEqual(10);
  });

  it('a valid model should save without validation error', function() {
    expect(pcrProductSequence.validationError).toEqual(null);
    Backbone.sync = () => {};
    pcrProductSequence.save();  // calls _validate
    expect(pcrProductSequence.validationError).toEqual(null);
  });
});

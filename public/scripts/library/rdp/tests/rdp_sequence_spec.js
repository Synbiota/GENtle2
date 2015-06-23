// Runs the calls to registerAssociation and registerPreProcessor
import plugin from '../../../plugins/pcr/plugin';

import RdpSequence from '../rdp_sequence';
import {stubCurrentUser} from '../../../common/tests/stubs';
import RdpEdit from '../rdp_edit';
import RdpSequenceFeature from '../rdp_sequence_feature';
import SequenceRange from 'gentle-sequence-model/range';

stubCurrentUser();


describe('RdpSequence model', function() {
  var attributes = {
    "_type": "rdp_pcr_product",
    "version": 1,
    "name": "Retro Graduated Ligase",
    "shortName": "Retu",
    "sourceSequenceName": "bloomy",
    "sequence": "GGTCTCAGATGATGAAACCCTTTGGGAAACCCTTTGGCCGGCTGAGACC",
    "readOnly": false,
    "isCircular": false,
    "partType": "CDS",
    "stickyEnds": {
      "name": "X-Z'",
      "start": {
        "sequence": "GGTCTCAGATG",
        "reverse": false,
        "offset": 7,
        "size": 4,
        "name": "X"
      },
      "end": {
        "sequence": "CGGCTGAGACC",
        "reverse": true,
        "offset": 7,
        "size": 4,
        "name": "Z'"
      },
    },
    "features": [
      {
        "name": "X end",
        "_type": "sticky_end",
        "ranges": [
          {
            "from": 0,
            "to": 10
          }
        ],
      },
      {
        "name": "Z' end",
        "_type": "sticky_end",
        "ranges": [
          {
            "from": 48,
            "to": 36
          }
        ],
      }
    ],
    "meta": {
      "pcr": {
        "options": {
        }
      },
      "associations": {
        "forwardPrimer": {
          "version": 1,
          "name": "Forward primer",
          "range": {
            "from": 0,
            "size": 37,
            "reverse": false
          },
          "annealingRegion": {
            "version": 1,
            "name": "Forward primer - Annealing Region",
            "meltingTemperature": 67.5,
            "gcContent": 0.46153846153846156,
            "range": {
              "from": 11,
              "size": 26,
              "reverse": false
            },
          },
        },
        "reversePrimer": {
          "version": 1,
          "name": "Reverse primer",
          "range": {
            "from": 16,
            "size": 33,
            "reverse": true
          },
          "annealingRegion": {
            "version": 1,
            "name": "Reverse primer - Annealing Region",
            "meltingTemperature": 67.4,
            "gcContent": 0.5454545454545454,
            "range": {
              "from": 16,
              "size": 22,
              "reverse": true
            },
          },
        },
        "rdpEdits": [
          {
            "type": "RDP_EDIT_METHIONINE_START_CODON",
            "contextBefore": {
              "_type": "RDP_EDIT_METHIONINE_START_CODON",
              "name": "Will modify TTG",
              "desc": "Will modify start codon to be ATG (Methionine)",
              "ranges": [
                {
                  "from": 0,
                  "size": 3,
                  "reverse": false
                }
              ],
              "sequence": "TTGAAACCCTTT",
              "contextualFrom": 0,
              "contextualTo": 12
            },
            "contextAfter": {
              "_type": "RDP_EDIT_METHIONINE_START_CODON",
              "name": "Modified TTG",
              "desc": "Modified start codon to be ATG (Methionine)",
              "ranges": [
                {
                  "from": 0,
                  "size": 3,
                  "reverse": false
                }
              ],
              "sequence": "ATGAAACCCTTT",
              "contextualFrom": 0,
              "contextualTo": 12
            }
          }
        ]
      }
    }
  };
  var rdpSequence;

  it('should instantiate from json data from server', function() {
    rdpSequence = new RdpSequence(attributes);
    expect(rdpSequence.get('rdpEdits').length).toEqual(1);
    var rdpEdit = rdpSequence.get('rdpEdits')[0];
    expect(rdpEdit instanceof RdpEdit).toEqual(true);
    expect(rdpEdit.contextBefore instanceof RdpSequenceFeature).toEqual(true);
    expect(rdpEdit.contextAfter instanceof RdpSequenceFeature).toEqual(true);
    expect(rdpEdit.contextBefore.ranges.length).toEqual(1);
    expect(rdpEdit.contextBefore.ranges[0] instanceof SequenceRange).toEqual(true);
  });

  it('should serialise', function() {
    var json = rdpSequence.toJSON();
    expect(json.meta.associations.rdpEdits[0].contextAfter.ranges[0].size).toEqual(3);
  });
});

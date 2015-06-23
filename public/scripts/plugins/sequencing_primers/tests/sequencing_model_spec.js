// runs the calls to registerAssociation and registerPreProcessor
import plugin from '../plugin';

import SequenceModel from '../../../sequence/models/sequence';
import {stubCurrentUser} from '../../../common/tests/stubs';


stubCurrentUser();


describe('Sequence model', function() {
  var sequenceModel;
  it('should deserialise from v0 data', function() {
    let v0data = {
      sequence: 'ATCGATCGATCG',
      meta: {
        sequencingPrimers: {
          products: [
            {
              from: 1,
              to: 9,
              primer: {
                sequence: 'XXX',
                from: 3,
                to: 0,
                meltingTemperature: 63,
                gcContent: 0.5,
                id: '1433410703536-1bdc3',
                name: 'Fwd Anchor primer',
                antisense: true
              },
              id: '1433410707772-1dbe8',
              name: 'Fwd Anchor',
              antisense: false
            }
          ]
        }
      }
    };
    sequenceModel = new SequenceModel(v0data);

    let products = sequenceModel.get('sequencingProducts');
    expect(products.length).toEqual(1);
    var product = products[0];
    expect(product.version).toEqual(1);
    expect(product.range.from).toEqual(1);
    expect(product.range.size).toEqual(9);
    expect(product.range.reverse).toEqual(false);
    expect(product.primer.range.from).toEqual(1);
    expect(product.primer.range.size).toEqual(3);
    expect(product.primer.range.reverse).toEqual(true);
  });

  it('should serialise correctly', function() {
    let data = sequenceModel.toJSON();
    expect(data.meta).toBeTruthy();
    expect(data.meta.associations).toBeTruthy();
    expect(data.meta.associations.sequencingProducts).toBeTruthy();
    expect(data.meta.associations.sequencingProducts.length).toEqual(1);
    let product = data.meta.associations.sequencingProducts[0];
    expect(product.version).toEqual(1);
    expect(product.primer.range.size).toEqual(3);
  });

  it('should deserialise from v1 data correctly', function() {
    let sequenceModel2 = new SequenceModel(sequenceModel.toJSON());

    let products = sequenceModel2.get('sequencingProducts');
    expect(products).toBeTruthy();
    expect(products.length).toEqual(1);
    expect(products[0].version).toEqual(1);
    expect(products[0].primer.range.size).toEqual(3);
  });
});

import Backbone from 'backbone.mixed';
import Filetypes from '../../../common/lib/filetypes/filetypes';
import Sequence from '../../../sequence/models/sequence';
import template from '../templates/sequencing_primers_products_view.hbs';

export default Backbone.View.extend({
  manage: true,
  template: template,

  events: {
    'click .export-sequence': 'exportSequence',
  },

  getProducts: function() {
    return this.parentView().products;
  },

  serialize: function() {
    console.log('products', this.getProducts())
    return {
      products: this.getProducts()
    };
  },

  getProductAndSequenceForSequenceID: function(sequenceID) {
    var products = this.getProducts();
    
    var fields = ['forwardPrimer', 'reversePrimer'];
    for (var i = products.length - 1; i >= 0; i--) {
      var product = products[i];
      for (var j = fields.length - 1; j >= 0; j--) {
        var sequence = product[fields[j]];
        if(sequence && sequence.id && sequence.id === sequenceID) return [product, sequence];
      }
    }
  },

  getSequenceID: function(event) {
    return $(event.target).data('sequence_id');
  },

  exportSequence: function(event) {
    var sequenceID = this.getSequenceID(event);
    var result = this.getProductAndSequenceForSequenceID(sequenceID);

    if(result) {
      var [product, sequence] = result;
      Filetypes.exportToFile('fasta', (new Sequence({
        sequence: sequence.sequence,
        name: product.name + ' - ' + sequence.name,
      })).toJSON());
    }
  }


});
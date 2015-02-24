import Backbone from 'backbone';

export default Backbone.DeepModel.extend({
  defaults: {
    id: _.uniqueId(),
    displaySettings: {
      rows: {
        res: {
          display: true,
          lengths: ['4','5','6'],
          manual: ['HindIII', 'KpnI', 'PvuII', 'XhoI']
        }
      }
    }
  },

  localStorage: new Backbone.LocalStorage('Gentle-user', {
    serialize: function(item) {
      return _.isObject(item) ? 
        JSON.stringify(_.isObject(item.attributes) ? item.attributes : item) : 
        item;
    },
    // fix for "illegal access" error on Android when JSON.parse is passed null
    deserialize: function (data) {
      return data && JSON.parse(data);
    }
  }),

  initialize: function() {
    this.throttledSave = _.throttle(() => this.save(), 200);
    this.on('change', this.throttledSave);
  },
});
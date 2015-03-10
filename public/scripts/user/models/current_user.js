import Backbone from 'backbone';

export default Backbone.DeepModel.extend({
  defaults: {
    id: _.uniqueId(),
    displaySettings: {
      rows: {
        res: {
          display: true,
          lengths: ['4','5','6'],
          hideNonPalindromicStickyEndSites: true,
          manual: ['HindIII', 'KpnI', 'PvuII', 'XhoI', 'BsaI']
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

  enableFeature: function(feature) {
    this.set('featureFlags.' + feature, true).throttledSave();
  },

  disableFeature: function(feature) {
    this.set('featureFlags.' + feature, false).throttledSave();
  }
});
define(function(require) {
  var Backbone        = require('backbone.mixed'),
      Gentle          = require('gentle')(),
      Artist          = require('common/lib/graphics/artist'),
      PlasmidMapCanvas = require('../lib/plasmid_map_canvas'),
      template        = require('hbars!plasmid_map/templates/plasmid_map_view'),
      LinearMapView;

  PlasmidMapView = Backbone.View.extend({
    manage: true,
    className: 'plasmid-map',
    template: template,

    initialize: function() {
      this.model = Gentle.currentSequence;
    },

    initPlasmidMap: function(){
      this.plasmidMapCanvas = new PlasmidMapCanvas({
        view: this,
        $canvas: this.$('canvas').first()
      });
    },

    afterRender: function(){
      this.initPlasmidMap();
    }

  });

  return PlasmidMapView;

});
define(function(require) {
  var Backbone        = require('backbone.mixed'),
      Gentle          = require('gentle')(),
      Artist          = require('common/lib/graphics/artist'),
      PlasmidMapCanvas = require('../lib/plasmid_map_canvas'),
      PlasmidMapVisibleRangeCanvas = require('../lib/plasmid_map_visible_range_canvas'),
      template        = require('hbars!plasmid_map/templates/plasmid_map_view'),
      LinearMapView, canvas, len, from, to, height;

  PlasmidMapView = Backbone.View.extend({
    manage: true,
    className: 'plasmid-map',
    template: template,

    initialize: function() {
      this.model = Gentle.currentSequence;
    },

    initPlasmidMap: function(){
      var _this = this;

      this.plasmidMapCanvas = new PlasmidMapCanvas({
        view: this,
        $canvas: this.$('#plasmid_map_canvas')
      });

      this.parentView().sequenceCanvas.once('change:layoutHelpers', function() {
        _this.plasmidMapCanvas = new PlasmidMapVisibleRangeCanvas({
          view: _this,
          $canvas: _this.$('#plasmid_map_canvas-visible-range')
        });
      });
    },

    afterRender: function(){
      this.initPlasmidMap();
    }

  });

  return PlasmidMapView;

});
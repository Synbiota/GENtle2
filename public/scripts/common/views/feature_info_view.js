/**
@module Common
@submodule Views
**/
define(function(require) {
  var template        = require('hbars!common/templates/feature_info'),
      Backbone        = require('backbone.mixed'),
      FeatureInfo;

  FeatureInfo = function(event,featureInfo) {
      event.preventDefault();
      this.display = true;
      this.posX = event.clientX;
      this.posY = event.clientY;
      this.featureInfo = featureInfo;
      this.createElement();
      };
   
  FeatureInfo.prototype.createElement= function(){
      var _this = this;
      _.each(this.featureInfo,function(info, index){
        if(info.length >  12)
          _this.featureInfo[index] = info.substring(0,11);
      });    

      this.$container = $('div.sequence-canvas-container');
      this.leftOffset = $('div.sequence-sidebar').children().width();

      var $element = $(template({
          display: true,
          featureInfo: this.featureInfo,
          posX: this.posX-(this.leftOffset),
          posY: this.posY-40
        })).hide();
      
      this.$container.append($element);
      this.$element = $element;
 };

  FeatureInfo.prototype.move = function(posX, posY) {   
    this.remove();
    this.leftOffset = $('div.sequence-sidebar').children().width();
    this.posX = posX-(this.leftOffset);
    this.posY = posY-40;
    this.$element
      .css({
        top: this.posY,
        left: this.posX
      })
      .show();
  };

  FeatureInfo.prototype.remove = function() {
    this.$element.hide();
    this.posX = this.posY = undefined;
  };

  return FeatureInfo;
});
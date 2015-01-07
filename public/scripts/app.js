/**
Gentle app definition.
**/

var $ = require('jquery.mixed');
var _ = require('underscore.mixed');
var Backbone = require('backbone.mixed');
var Gentle = require('./common/models/gentle');
var config = require('./config.json');
var Layout = require('./common/views/layout');
var Router = require('./router');
var Sequences = require('./sequence/models/sequences');

var ncbi = require('./plugins/ncbi/plugin');
var designer = require('./plugins/designer/plugin'); 

var plugins = [ncbi, designer];

var Blast = require('./plugins/blast/lib/blast_request');
window.blast = Blast;



Gentle = Gentle();

Gentle.config = config;
  
Gentle.sequences = new Sequences();

Gentle.sequences.fetch();

Gentle.router = new Router();
window.gentle = Gentle;

$(function() {
  Gentle.layout = new Layout();
  Backbone.history.start();

  _.each(_.where(Gentle.plugins, {type: 'init'}), function(plugin) {
    plugin.data.afterDomReady && plugin.data.afterDomReady(Gentle);
  });
});
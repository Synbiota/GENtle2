/**
Gentle app definition.
**/

import $ from 'jquery.mixed';
import _ from 'underscore.mixed';
import Backbone from 'backbone.mixed';

import Gentle from './common/models/gentle';
import config from './config.json';
import Layout from './common/views/layout';
import Router from './router';
import Sequences from './sequence/models/sequences';

import ncbi from './plugins/ncbi/plugin';
import designer from './plugins/designer/plugin';
import blast from './plugins/blast/plugin';
import pcr from './plugins/pcr/plugin';

var plugins = [ncbi, designer, blast, pcr];


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
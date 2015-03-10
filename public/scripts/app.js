/**
Gentle app definition.
**/

import $ from 'jquery.mixed';
import _ from 'underscore.mixed';
import Backbone from 'backbone.mixed';
import Q from 'q';

import Gentle from './common/models/gentle';
import config from './config.json';
import Layout from './common/views/layout';
import Router from './router';
import Sequences from './sequence/models/sequences';
import CurrentUser from './user/models/current_user';

import ncbi from './plugins/ncbi/plugin';
import designer from './plugins/designer/plugin';
import blast from './plugins/blast/plugin';
import pcr from './plugins/pcr/plugin';
import sequencing_primers from './plugins/sequencing_primers/plugin';

var plugins = [ncbi, designer, blast, pcr, sequencing_primers];

Gentle.config = config;
Gentle.sequences = new Sequences();
var currentUser = Gentle.currentUser = new CurrentUser({id: 'current-user'});

Gentle.sequences.fetch();
Gentle.currentUser.fetch();

Gentle.enableFeatures('pcr', 'blast');

Gentle.router = new Router();
window.gentle = Gentle;

$(function() {
  Gentle.layout = new Layout();
  Backbone.history.start();

  _.each(_.where(Gentle.plugins, {type: 'init'}), function(plugin) {
    if(plugin.data.afterDomReady) plugin.data.afterDomReady(Gentle);
  });
});
/**
Gentle app definition.
**/

import $ from 'jquery.mixed';
import _ from 'underscore.mixed';
import Backbone from 'backbone.mixed';
import Bugsnag from 'bugsnag-js';

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

import WipCircuit from './plugins/designer/lib/wip_circuit';

import tooltip from 'tooltip';

var plugins = [ncbi, designer, blast, pcr, sequencing_primers];

Gentle.config = config;
Gentle.sequences = new Sequences();
var currentUser = Gentle.currentUser = new CurrentUser({id: 'current-user'});

Gentle.sequences.fetch();
Gentle.currentUser.fetch();

Gentle.enableFeatures('blast');

Gentle.router = new Router();
window.gentle = Gentle;

if(process.env.ENABLE_BUGSNAG) {
  Bugsnag.apiKey = process.env.BUGSNAG_API_KEY;
  Bugsnag.releaseStage = process.env.BUGSNAG_RELEASE_STAGE || 'production';
  Bugsnag.appVersion = process.env.BUGSNAG_APP_VERSION;
} else {
  Bugsnag.autoNotify = false;
}

window.testBugsnag = function() {
  Bugsnag.notify('bugsnag/sourcemaps test');
};

window.testProcess = process.env;

// Custom build - adding preloaded sequences

import preloadedSequences from './preloaded_sequences';
import { STICKY_END_FULL } from './sequence/models/sequence';

// var addableSequences = _.filter(preloadedSequences, function(sequence) {
//   return !Gentle.sequences.some(existingSequence => {
//     return existingSequence.getSequence(STICKY_END_FULL) === sequence.sequence;
//   });
// });

var addableSequences = _.chain(preloadedSequences)
                        .filter(function(sequence) {
                          return !Gentle.sequences.some(existingSequence => {
                            return existingSequence.getSequence(STICKY_END_FULL) === sequence.sequence;
                          });
                        })
                        .map(function(sequence){
                          sequence.hidden = true;
                          return sequence;
                        })
                        .value();

if (Gentle.visibleSequences().length == 0) {
  var sequence  = new WipCircuit({
    name: 'New Circuit',
    sequence: '',
    displaySettings: {
      primaryView: 'designer'
    },
    availableSequences: []
  });

  addableSequences.push(sequence);

}

if(addableSequences.length) {
  Gentle.addSequences(addableSequences);
}

// end custom build


$(function() {
  Gentle.layout = new Layout();
  Backbone.history.start();
  Gentle.layout.on('afterRender', () => tooltip.insert())

  _.each(_.where(Gentle.plugins, {type: 'init'}), function(plugin) {
    if(plugin.data.afterDomReady) plugin.data.afterDomReady(Gentle);
  });
});

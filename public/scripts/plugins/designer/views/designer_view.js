import Backbone from 'backbone';
import _ from 'underscore';
import template from '../templates/designer_view_template.hbs';
import AvailableSequencesView from './available_sequences_view';
import DesignedSequenceView from './designed_sequence_view';
import Gentle from 'gentle';
import uploadMultipleSequences from '../../../common/lib/upload_multiple_sequences';
import Modal from '../../../common/views/modal_view';
import DiagnosticModalView from './designer_diagnostic_modal_view';
import CannotUploadModalView from './designer_cannot_upload_modal_view';
import cleanSearchableText from '../lib/clean_searchable_text';
import Q from 'q';
import WipCircuit from '../lib/wip_circuit';
import $ from 'jquery';
import dropzone from '../../../common/lib/dropzone';

var DesignerView = Backbone.View.extend({
  template: template,
  manage: true,
  className: 'designer',

  events: {
    'change #circularise-dna': 'updateCirculariseDna',
    'click .designer-trigger-file-upload-input': 'triggerFileInput',
    'change .file-upload-input': 'uploadNewSequences',
    'click .assemble-sequence-btn': 'assembleSequence',
    'keydown .designer-available-sequences-filter input': 'filterAvailableSequences',
    'click .designer-available-sequences-filter-clear': 'clearFilter',
    'click .designer-available-sequences-clear-all': 'clearAvailableSequences'
  },

  initialize: function() {
    var model = this.model = Gentle.currentSequence;

    if(!(model instanceof WipCircuit)) {
      model.destroy();
      Gentle.router.home();
      return;
    }

    var specialSequenceNames = [
      'x-z', 'x-z\'', 'z-x', 'z-x\'',
      'x-adp-z\'', 'x-Inv-z', 'z-adp-x\'', 'z-Inv-x',
      'anc-Ori-x\'', 'z-ChlR-cap'
    ];

    var outlet1StickyEndNames = [
      'x-z\'', 'da20-z\'', 'x-dt20'
    ];

    var filterbyStickyEnds = _.partial(_.bind(
      model.filterAvailableSequencesByStickyEnds,
      model
    ), _, specialSequenceNames);

    this.setView(
      '.designer-available-sequences-outlet.outlet-1',
      new AvailableSequencesView({
        name: 'x-z\' Parts',
        getSequences: filterbyStickyEnds(outlet1StickyEndNames)
      })
    );

    var outlet2StickyEndNames = [
      'z-x\'', 'z-dt20', 'z-da20', 'da20-x\''
    ];

    this.setView(
      '.designer-available-sequences-outlet.outlet-2',
      new AvailableSequencesView({
        name: 'z-x\' Parts',
        getSequences: filterbyStickyEnds(outlet2StickyEndNames)
      })
    );

    var outlet3StickyEndNames = outlet1StickyEndNames.concat(outlet2StickyEndNames);

    this.setView(
      '.designer-available-sequences-outlet.outlet-3',
      new AvailableSequencesView({
        name: 'Adapter and inverter parts',
        getSequences: filterbyStickyEnds(outlet3StickyEndNames, true)
      })
    );

    var designedSequenceView = this.designedSequenceView =
      new DesignedSequenceView({model: this.model});
    this.setView('.designer-designed-sequence-outlet', designedSequenceView);

    this.listenTo(designedSequenceView, 'afterRender', this.updateDisabled, this);

    this.filterAvailableSequences = _.afterLastCall(
      _.bind(this.filterAvailableSequences, this),
      200
    );

    _.bindAll(this,
      'addAvailableSequences'
    );
  },

  triggerFileInput: function(event) {
    event.preventDefault();
    this.$('.file-upload-input').click();
  },

  addAvailableSequences: function(sequences) {
    var errors = this.model.addAvailableSequences(
      _.unique(sequences, sequence => sequence.sequence)
    );

    if(errors.length > 0) {
       Modal.show({
        title: 'Invalid sequences',
        confirmLabel: 'OK',
        cancelLabel: null,
        bodyView: new CannotUploadModalView({errors})
      });
    }

    this.render();
  },

  uploadNewSequences: function(event) {
    uploadMultipleSequences(event.target.files)
      .then(this.addAvailableSequences)
      .done();
  },

  serialize: function() {
    return {
      sequenceName: this.model.get('name'),
      circulariseDna: this.model.get('isCircular'),
      emptyAvailableSequences: this.model.get('availableSequences').length === 0
    };
  },

  beforeRender: function() {
    this.removeDropzone();
  },

  afterRender: function() {
    this.updateDisabled();
    this.setupDropzone();
  },

  updateCirculariseDna: function(event) {
    event.preventDefault();
    this.model.set('isCircular', event.target.checked).throttledSave();
  },

  updateDisabled: function() {
    var $button = this.$('.assemble-sequence-btn');
    if(this.model.get('sequences').length === 0) {
      $button.attr('disabled', 'disabled');
    } else {
      $button.removeAttr('disabled');
    }
  },

  setupDropzone: function() {
    var $dropzone =
      this.$('.fullscreen-filedropzone');

    dropzone.init.call(this, $dropzone, this.addAvailableSequences);
  },

  cleanup: function() {
    dropzone.remove.call(this);
  },

  removeDropzone: function() {
    if(this.$dropzone) {
      this.$dropzone.remove();
      delete this.$dropzone;
    }
  },

  filterAvailableSequences: function(eventOrString) {
    var query = cleanSearchableText(
      _.isString(eventOrString) ?
        eventOrString :
        $(eventOrString.currentTarget).val()
    );
    this.$('.glyphicon-search').toggleClass('hide', query.length > 0);
    this.$('.designer-available-sequences-filter-clear').toggleClass('hide', query.length === 0);
    Gentle.trigger('designer:availableSequences:filter', {query: query});
  },

  clearFilter: function(event) {
    event.preventDefault();
    this.$('.designer-available-sequences-filter input').val('');
    this.filterAvailableSequences('');
  },

  clearAvailableSequences: function() {
    this.model.clearAvailableSequences();
    this.model.throttledSave();
    this.render();
  },

  assembleSequence: function() {
    var errors = this.model.get('errors');
    if(errors.length > 0) {
      Modal.show({
        title: 'Cannot assemble circuit',
        confirmLabel: 'OK',
        cancelLabel: null,
        bodyView: new DiagnosticModalView({
          errors: _.uniq(_.pluck(errors, 'type'))
        })
      });
    } else {
      var attributes = this.model.assembleSequences();
      // this.model.destroy();
      Gentle.addSequencesAndNavigate([attributes]);
    }
  }

});

export default DesignerView;

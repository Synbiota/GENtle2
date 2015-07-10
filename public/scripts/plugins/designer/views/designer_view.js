import Backbone from 'backbone';
import _ from 'underscore';
import AssembleSequence from '../lib/assemble_sequence';
import template from '../templates/designer_view_template.hbs';
import AvailableSequencesView from './available_sequences_view';
import DesignedSequenceView from './designed_sequence_view';
import Gentle from 'gentle';
import uploadMultipleSequences from '../lib/upload_multiple_sequences';
import Modal from '../../../common/views/modal_view';
import DiagnosticModalView from './designer_diagnostic_modal_view';
import cleanSearchableText from '../lib/clean_searchable_text';
import Q from 'q';

var DesignerView = Backbone.View.extend({
  template: template,
  manage: true,
  className: 'designer',

  events: {
    'change #circularise-dna': 'updateCirculariseDna',
    'click .designer-available-sequences-header button': 'triggerFileInput',
    'change .file-upload-input': 'uploadNewSequences',
    'click .assemble-sequence-btn': 'assembleSequence',
    'keydown .designer-available-sequences-filter input': 'filterAvailableSequences',
    'click .designer-available-sequences-filter-clear': 'clearFilter'
  },

  initialize: function() {
    var model = this.model = Gentle.currentSequence;

    var outlet1StickyEndNames = [
      'x-z\'', 'da20-z\'', 'x-dt20'
    ];

    var filterbyStickyEnds = _.bind(
      model.filterAvailableSequencesByStickyEnds, 
      model
    );

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
        name: 'Linker parts',
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
  },

  triggerFileInput: function(event) {
    event.preventDefault();
    this.$('.file-upload-input').click();
  },

  uploadNewSequences: function(event) {
    uploadMultipleSequences(event.target.files).then((sequences) => {
      this.model.addAvailableSequences(sequences);
      this.render();
    }).done();
  },

  serialize: function() {
    return {
      sequenceName: this.model.get('name'),
      circulariseDna: this.model.get('isCircular')
    };
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
    var $dropzone = this.$('.designer-available-sequences-container-filedropzone');

    $('body').append($dropzone);

    var zone = $dropzone
      .filedrop({
        multiple: true,
        fullDocDragDetect: true
      })
      .filedrop()
      .event('dragEnter', function() {
        $dropzone.addClass('dropzone-visible');
      })
      .event('dragLeave', function() {
        $dropzone.removeClass('dropzone-visible');
      })
      .event('upload', (event) => {
        $dropzone.removeClass('dropzone-visible');

        var listEntries = function(file) {
          return Q.promise(function(resolve, reject) {
            if(
              (file.nativeEntry && file.nativeEntry.isDirectory)
            ) {
              file.listEntries(function(entries) {
                resolve(_.reject(entries, function(entry) {
                  return _.isNull(entry.nativeFile);
                }));
              }, reject);
            } else {
              resolve(file);
            }
          });
        };

        Q.all(_.map(zone.filedrop.eventFiles(event), listEntries))
          .then(_.flatten)
          .then(uploadMultipleSequences)
          .then((sequences) => {
            this.model.addSequences(_.unique(sequences, function(sequence) {
              return sequence.sequence;
            }));
            this.render();
          }).done();
      });


  },

  insertSequenceViews: function() {
    var _this = this,
        designedSequenceView;

    _.each(this.model.allSequences, function(sequence) {
      var outletSelector = `.designer-available-sequence-outlet[data-sequence_id="${sequence.id}"]`;
      var sequenceView = new AvailableSequenceView({model: sequence});
      _this.setView(outletSelector, sequenceView);
      sequenceView.render();
    });

    designedSequenceView = new DesignedSequenceView({model: this.model});
    this.setView('.designer-designed-sequence-outlet', designedSequenceView);
    this.designedSequenceView = designedSequenceView;
    designedSequenceView.render();
  }, 

  getAvailableSequenceViewFromSequenceId: function(sequenceId) {
    return this.getView(`.designer-available-sequence-outlet[data-sequence_id="${sequenceId}"]`);
  },

  isInsertable: function(sequence) {
    return this.model.isInsertable(sequence);
  },

  getDescriptiveAnnotationContent: function(sequence) {
    var features = sequence.get('features');
    if(features.length == 1) {
      var feature = features[0];
      var range = feature.ranges[0];
      if(range.from === 0 && range.to >= sequence.length()-1) {
        return feature.name;
      }
    }
  },

  changeSecondaryView: function() {
    // Currently NoOp
  },

  cleanup: function() {
    this.removeAllViews();
    Gentle.sequences.off(null, null, this);
  },

  removeAllViews: function() {
    this.designedSequenceView = undefined;
    this.getViews().each((view) => {
      view.remove();
    });
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

  assembleSequence: function() {
    var errors = this.model.errors;
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
      this.model.assembleSequences().throttledSave();
      this.parentView(1).changePrimaryView('edition');
    }
  }

});

export default DesignerView;
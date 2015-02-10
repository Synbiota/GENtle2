import Backbone from 'backbone.mixed';
import template from '../templates/blast_view.hbs';
import AlignView from './blast_align_view';
import BlastRequest from '../lib/blast_request';
import NCBIRequest from '../../ncbi/lib/ncbi_request';
import Gentle from 'gentle';

Gentle = Gentle();

export default Backbone.View.extend({
  manage: true,
  template: template,
  className: 'blast',

  events: {
    'click #blast-intro-run': 'getRID',
    'click .show-align': 'showAlign',
    'click .blast-open-sequence': 'openSequence',
    'click .blast-run-new': 'runNewSearch',
    'click .blast-clear-search': 'clearSearch'
  },

  initialize: function() {
    this.currentResultsIteration = 0;
    this.noRID = false;
    this.alignView = new AlignView();
    this.setView('#blast-align-container', this.alignView);
    this.model = Gentle.currentSequence;
    this.initBlastRequest();
    this.initDatabases();

    if(this.model.get('meta.blast.RID')) this.getRID();

    _.bindAll(this, 
      'incrementProgressBar',
      'handleBlastRequestError'
    );
  },

  initBlastRequest: function() {
    this.blastRequest = new BlastRequest(this.model);
  },

  initDatabases: function() {
    this.databases = _.map(BlastRequest.databases, function(name, value) {
      return {
        name: name, 
        value: value
      };
    });
  },

  serialize: function() {
    return {
      blastRequest: this.blastRequest,
      noRID: this.noRID,
      NCBIError: this.NCBIError,
      resultId: this.resultId,
      databases: this.databases
    };
  },

  showAlign: function(event) {
    var $el = $(event.currentTarget);
    this.resultId = $el.data('resultId');
    this.hspId = $el.data('hspId');
    this.alignView.render();
    $el.closest('table').find('tr').removeClass('info');
    $el.closest('tr').addClass('info');
  },

  getRID: function() {
    var $el = this.$('#blast-intro-run');
    $el.attr('disabled', 'disabled');
    $el.find('.btn-label').text('Initiating request with NCBI');
    this.$('.loader').show();

    var $databaseInput = this.$('#blast-database-select');
    this.database = $databaseInput.val();

    this.NCBIError = undefined;
    this.$('.alert-danger').hide();

    this.blastRequest.getRequestId(this.database).then(() => {
      this.render();
      this.getResults();
    }).catch(this.handleBlastRequestError);
  },

  getResults: function() {
    var sequenceLength = this.model.length();
    // this.incrementProgressBar();
    this.blastRequest.getResults().then((results) => {
      this.render();
    }).catch(this.handleBlastRequestError);
  },

  handleBlastRequestError: function(error) {
    if(_.isObject(error)) {
      switch(error.type) {
        case 'NO_RID':
          this.NCBIError = "We could not receive a request ID from NCBI. You can try again later.";
          break;
        default: 
          this.NCBIError = error.message || 'An error occurred';
          break;
      }

      this.render();
    }
  },

  incrementProgressBar: function() {
    var $progressBar = this.$('.blast-progress-bar');
    var iteration = this.currentResultsIteration;
    var resolution = 100;
    var maxIterations = this.blastRequest.estimatedResultsTiming * 1000 / resolution;

    if(iteration < maxIterations) {
      $progressBar.width((iteration+1)/maxIterations*100+'%');
    } else {
      $progressBar.parent().addClass('progress-striped active');
    }

    if(!this.blastRequest.resultsLoaded) {
      this.currentResultsIteration++;
      setTimeout(this.incrementProgressBar, resolution);
    }
  },

  openSequence: function(event) {
    event.preventDefault();

    var resultId = $(event.currentTarget).data('resultId');
    var result = _.find(this.blastRequest.results, {id: resultId});

    NCBIRequest
      .loadFromId(result.NCBIAccessionId, 'nuccore')
      .then(Gentle.addSequencesAndNavigate);
  },

  clearSearch: function(event) {
    this.model.clearBlastCache();
    this.initBlastRequest();
    this.render();
  },

  runNewSearch: function(event) {
    this.clearSearch();
    this.getRID();
  }


});
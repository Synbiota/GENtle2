import Proxy from '../../../common/lib/proxy';
import Q from 'q';
import _ from 'underscore.mixed';
import $ from 'jquery.mixed';

var URL = 'http://blast.ncbi.nlm.nih.gov/Blast.cgi';

var iterationTimings = [3000, 5000, 15000, 30000];
var estimationTimingRegexp = /We estimate that results will be ready in (\d+) seconds/;

var isObject = _.isObject;
var map = _.map;
var each = _.each;
var isUndefined = _.isUndefined;

var databases =  {
  nr: "Nucleotide collection (nr/nt)",   
  refseq_rna: "Reference RNA sequences (refseq_rna)",
  refseq_genomic: "Reference genomic sequences (refseq_genomic)",
  chromosome: "NCBI Genomes (chromosome)",
  est: "Expressed sequence tags (est)",
  gss: "Genomic survey sequences (gss)",
  htgs: "High throughput genomic sequences (HTGS)",
  pat: "Patent sequences(pat)",
  pdb: "Protein Data Bank (pdb)",
  alu: "Human ALU repeat elements (alu_repeats)",
  dbsts: "Sequence tagged sites (dbsts)",
  Whole_Genome_Shotgun_contigs: "Whole-genome shotgun contigs (wgs)",
  tsa_nt: "Transcriptome Shotgun Assembly (TSA)",
  'rRNA_typestrains/prokaryotic_16S_ribosomal_RNA': "16S ribosomal RNA sequences (Bacteria and Archaea)"
};

var BlastRequest = class {
  constructor(sequence) {
    this.sequence = sequence;
    
    this.hitlistSize = 20;
    this._loadingRIDPromise = false;
    this._loadingResultsDefer = false;
    this._currentResultsIteration = 0;
    this.estimatedResultsTiming = 30;

    this.RID = sequence.get('meta.blast.RID');
    this.RIDLoading = false;
    this.RIDLoaded = !!this.RID;

    this.database = sequence.get('meta.blast.database') || 'nr';

    this.results = sequence.get('meta.blast.results') || [];
    this.resultsLoaded = !!this.results.length;

    _.bindAll(this, 
      'getResults', 
      '_processResults', 
      '_parseRIDResponse', 
      '_parseResultsResponse',
      '_formatHsp'
    );
  }

  getRequestId(database) {
    if(!isUndefined(database) && _.has(databases, database)) 
      this.database = database;

    this._loadingRIDPromise = this._loadingRIDPromise || Q.promise((resolve, reject) => {
      // var selector = "//input[@type = 'hidden' and @name = 'RID'] | //comment()";
      var selector = "//input[@type = 'hidden' and @name = 'RID']";

      if(this.RID) {
        this._loadingRIDPromise = false;
        this.RIDLoading = false;
        this.RIDLoaded = true;
        resolve(this.RID)
      } else {

        Proxy.yqlExtractHtmlPost(URL, {
          CMD: 'Put',
          QUERY: this.sequence.get('sequence'),
          DATABASE: this.database,
          PROGRAM: 'blastn',
          NCBI_GI: 'on',
          HITLIST_SIZE: this.hitlistSize
        }).then(this._parseRIDResponse).then((RID) => {
          this.RID = RID;
          this.sequence.saveBlastRID(RID, this.database);
          this.RIDLoaded = true;
          resolve(RID);
        }).catch((error) => {
          console.log('error', error)
          reject(error);
        }).finally(() => {
          this._loadingRIDPromise = false;
          this.RIDLoading = false;
        });

      } 
    });

    return this._loadingRIDPromise;
  }

  getResults(database) {
    if(!isUndefined(database) && _.has(databases, database)) 
      this.database = database;

    var defer = this._loadingResultsDefer = this._loadingResultsDefer || Q.defer();

    if(this.RID && !this.results.length) {

      var selector = "//ul[@class = 'msg']/li[@class = 'error'] | //blastoutput//iteration_hits";

      Proxy.yqlExtractHtml(URL, {
        CMD: 'Get',
        RID: this.RID,
        FORMAT_TYPE: 'XML'
      }, selector).then(this._parseResultsResponse)
        .then(this._processResults)
        .catch(defer.reject);

    } else if(!this.RID) {

      this.getRequestId().then(() => setTimeout(this.getResults, 500)).catch(defer.reject);

    } else if(this.results.length) {

      this.resultsLoaded = true;
      defer.resolve(this.results);

    }

    return defer.promise;
  }

  _parseRIDResponse(data) {
    var _this = this;
    return Q.promise((resolve, reject) => {
      var $results = $(data).find('results');
      var $input = $results.find('input[type="hidden"][name="RID"]').first();

      if($input.length) {
        // var commentNode = _.find($results.find('#content>form').contents(), function(node) {
        //   return node.nodeType == 8 && estimationTimingRegexp.test(node.textContent);
        // });

        // console.log('commentNode', !!commentNode, commentNode)

        // if(commentNode) {
        //   // try {
        //     console.log('estimated', estimationTimingRegexp.exec(commentNode.textContent)[1])
        //     console.log(_this)
        //     _this.estimatedResultsTiming = Number(estimationTimingRegexp.exec(commentNode.textContent)[1]);
        //     console.log('check', _this.estimatedResultsTiming)
        //   // } catch(e) {}
        // }

        resolve($input.attr('value'));
      } else {
        reject({type: 'NO_RID'});
      }
    });
  }

  _parseResultsResponse(data) {
    return Q.promise((resolve, reject) => {
      if(isObject(data) && _.keys(data).length) {
        try {
          // NCBI returns an error: likely the job does not exist
          var message = data.p.content;
          var type = /rid[\w\s]+not\sfound/i.test(message) ? 'RID_NOT_FOUND' : 'NCBI_ERROR';


          if(type == 'RID_NOT_FOUND') {
            this.RID = undefined;
            this.RIDLoaded = false;
          }

          reject({
            type: type,
            message: message
          });
        } catch(e) {
          if(isObject(data.iteration_hits)) {
            resolve(data);
          } else if(!_.isUndefined(data.iteration_hits)) {
            resolve([]);
          } else {
            // resolve(null);
          }
        }
      } else {
        resolve(null);
      }
    });
  }

  _getNextIterationTiming() {
    return iterationTimings[this._currentResultsIteration] || _.last(iterationTimings);
  }

  _processResults(data) {
    var defer = this._loadingResultsDefer;

    if(isObject(data)) {
      this.resultsLoaded = true;
      this.results = this._formatResults(data); 
      this.sequence.saveBlastResults(this.results);
      defer.resolve(this.results);
    } else {
      if(this._currentResultsIteration <= 30) {
        setTimeout(this.getResults, this._getNextIterationTiming());
        defer.notify( this._currentResultsIteration);
        this._currentResultsIteration++;
      } else {
        defer.reject();
      }
    }
  }

  _formatResults(data) {
    var hits = data.iteration_hits;
    if (isObject(hits)) {
      return map(hits.hit, (sequence) => {
        var hsps = sequence.hit_hsps.hsp;

        return {
          name: sequence.hit_def,
          NCBIAccessionId: sequence.hit_accession,
          id: _.uniqueId(),
          hsps: _.isArray(hsps) ? 
            map(hsps, this._formatHsp) : 
            [this._formatHsp(hsps)]
        };
      });
    } else {
      return [];
    }
  }

  _formatHsp(blastHsp) {
    var output = {
      id: _.uniqueId()
    };

    var formatName = function(name) {
      return name
        .replace(/\-/g, ' ')
        .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
    };

    var extractNumber = function(name) {
      output[formatName(name)] = Number(blastHsp['hsp_'+name]);
    };

    var extractString = function(name) {
      output[formatName(name)] = blastHsp['hsp_'+name];
    };

    each([
      'align-len', 'bit-score', 'evalue', 
      'gaps', 'hit-frame', 'hit-from',
      'hit-to', 'identity', 'num',
      'positive', 'query-frame', 'query-from',
      'query-to', 'score',
    ], extractNumber);

    // We use 0-indexed bases
    output.queryFrom--;
    output.queryTo--;
    output.hitFrom--;
    output.hitTo--;

    var sequenceLength = this.sequence.length();
    output.alignFromPct = output.queryFrom / sequenceLength * 100;
    output.alignLenPct = output.alignLen / sequenceLength * 100;

    each([
      'hseq', 'midline'
    ], extractString);


    return output;
  }
};

BlastRequest.databases = databases;

export default BlastRequest;
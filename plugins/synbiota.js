var synbiota_data = {} ;

synbiota.prototype = new Plugin() ;
synbiota.prototype.constructor = synbiota ;

synbiota.prototype.saveToSynbiota = function () {
	// Init
	var me = this ;
	var sc = this.getCurrentSequenceCanvas() ;
	if ( sc === undefined ) return ; // Paranoia
	if ( sc.sequence.synbiota === undefined ) sc.sequence.synbiota = {
		project_id : synbiota_data.project_id ,
		sequence_id : -1 ,
		kind : 'Misc'
	} ;
	
	var file = new FT_sybil();
	var sybil = file.getExportString ( sc.sequence ) ;
	
	var url = synbiota_data.api_url + '/api/' + synbiota_data.api_version + '/projects/' + sc.sequence.synbiota.project_id + '/gentle_files' ;
	var params = {
		token : synbiota_data.token ,
		'gentle_file[name]' : ( sc.sequence.name || '' ) ,
		'gentle_file[kind]' : sc.sequence.synbiota.kind ,
		'gentle_file[description]' : ( sc.sequence.desc || '' ) ,
		'gentle_file[sybil]' : sybil
	} ;
	if ( sc.sequence.synbiota.sequence_id > -1 ) params.id = sc.sequence.synbiota.sequence_id ;

	
	if ( synbiota_data.use_proxy ) {
		params.url = url ;
		url = './data/synbiota_proxy.php' ;
	}
	
	$.post ( url , params , function ( d ) {
		// TODO check status
//		console.log ( d ) ;
	} , 'json' ) ;
}

synbiota.prototype.global_init = function () {
	if ( undefined === gentle.url_vars.token ) {
		return ; // No token, no joy!
	}

	if ( plugins.registerPlugin ( { className : 'synbiota' , url : 'plugins/synbiota.js' } ) ) {
		plugins.registerAsTool ( { className : 'synbiota' , module : 'dna' , section : 'file' , call : 'saveToSynbiota' , linkTitle : 'Save to Synbiota' } ) ;
	} else {
		return ; // Plugin registry failed. Abort, abort!!
	}

	synbiota_data.use_proxy = true ; // MAIN SWITCH FOR TESTING/PRODUCTION SETUP
	
	synbiota_data.api_version = 1 ;
	synbiota_data.api_url = 'http://synbiota-test.herokuapp.com' ;
//	synbiota_data.save_url = 'http://localhost:3000/gentle_files' ;
	
	
	synbiota_data.token = gentle.url_vars.token ;
	if ( undefined === synbiota_data.token ) return ;
	synbiota_data.project_id = gentle.url_vars.project_id ;
	
	if ( gentle.url_vars.id == -1 ) {
		gentle.startNewSequenceDialog() ;
	} else {
		while ( gentle.sequences.length > 0 ) gentle.closeCurrentSequence() ;
		synbiota_data.sequence_id = gentle.url_vars.id ;
		synbiota_load_sequence ( gentle.url_vars.project_id , gentle.url_vars.id ) ;
	}
}

function synbiota () {
	this.name = 'synbiota' ;
}


function synbiota_load_sequence ( project_id , sequence_id ) {
	var url = synbiota_data.api_url + '/api/' ;
	if ( synbiota_data.api_version > 0 ) url += synbiota_data.api_version + '/' ;
	url += 'projects/'+project_id+'/gentle_files/'+sequence_id+'?token='+synbiota_data.token ;
	$.getJSON ( gentle_config.proxy + '?callback=?' , 
		{ url : url } ,
		function ( data ) {
			data = JSON.parse ( data ) ;
			// data keys : created_at creator_id description project_id sybil updated_at id kind last_editor_id name
			
			var sybil = new FT_sybil () ;
			sybil.text = data.sybil ;
			var seqids = sybil.parseFile() ;
			if ( seqids.length != 1 ) {
				alert ( "There was a problem opening Synbiota sequence " + sequence_id + " in project " + project_id ) ;
				return ;
			}
			
			// Add synbiota data to sequence object
			gentle.sequences[seqids[0]].synbiota = {
				project_id : data.project_id , 
				sequence_id : data.id ,
				created_at : data.created_at ,
				creator_id : data.creator_id ,
				updated_at : data.updated_at ,
				kind : data.kind ,
				last_editor_id : data.last_editor_id
			} ;
			
	} ) ;
}


var dummy = new synbiota() ;
dummy.global_init () ;

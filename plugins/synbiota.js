var synbiota_data = {} ;

synbiota.prototype = new Plugin() ;
synbiota.prototype.constructor = synbiota ;

synbiota.prototype.saveToSynbiota = function () {
	// Init
	var me = this ;
	var sc = this.getCurrentSequenceCanvas() ;
	if ( sc === undefined ) return ; // Paranoia
	if ( sc.synbiota === undefined ) sc.synbiota = { project_id : synbiota_data.project_id , sequence_id : -1 } ; //return ;
	
	var file = new FT_sybil();
	var sybil = file.getExportString ( sc.sequence ) ;
	
	$.post ( synbiota_data.save_url , {
		token : synbiota_data.token ,
		project_id : sc.synbiota.project_id ,
		id : sc.synbiota.sequence_id ,
		sequence : sybil
	} , function ( d ) {
		console.log ( d ) ;
	} , 'json' ) ;
}

function synbiota () {
	this.name = 'synbiota' ;
}


function synbiota_load_sequence ( project_id , sequence_id ) {
	var url = synbiota_data.load_url + '/api/projects/'+project_id+'/sequences/'+sequence_id+'?token='+synbiota_data.token ;
	console.log ( url ) ;
	$.getJSON ( gentle_config.proxy + '?callback=?' , 
		{ url : url } ,
		function ( data ) {
			data = JSON.parse ( data ) ;
			var name = data.name ;
			var seq = data.long_description ;
			var fa = new FT_fasta () ; // TODO sybil
			fa.text = ">" + name + "\n" + seq ;
			var seq = fa.parseFile() ;
			var seqid = seq[0] ;
			
			gentle.sequences[seqid].sequence.synbiota = { sequence_id : sequence_id , project_id : project_id } ;
	} ) ;
}

function synbiota_init () {
	synbiota_data.load_url = 'http://synbiota-alpha.herokuapp.com' ;
	
//	synbiota_data.save_url = './data/synbiota_proxy.php' ; // Testing
	synbiota_data.save_url = 'http://localhost:3000/gentle_files' ;
	
	synbiota_data.token = gentle.url_vars.token ;
	if ( undefined === synbiota_data.token ) return ;
	synbiota_data.project_id = gentle.url_vars.project_id ;
	synbiota_data.sequence_id = gentle.url_vars.id ;
	while ( gentle.sequences.length > 0 ) gentle.closeCurrentSequence() ;
	synbiota_load_sequence ( gentle.url_vars.project_id , gentle.url_vars.id ) ;
}

if ( plugins.registerPlugin ( { className : 'synbiota' , url : 'plugins/synbiota.js' } ) ) {
	plugins.registerAsTool ( { className : 'synbiota' , module : 'dna' , section : 'file' , call : 'saveToSynbiota' , linkTitle : 'Save to Synbiota' } ) ;
	synbiota_init () ;
}

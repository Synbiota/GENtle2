var synbiota_data = {} ;

synbiota.prototype = new Plugin() ;
synbiota.prototype.constructor = synbiota ;

function synbiota () {
	this.name = 'synbiota' ;
}


function synbiota_load_sequence ( project_id , sequence_id ) {
	var url = 'http://synbiota-alpha.herokuapp.com/api/projects/'+project_id+'/sequences/'+sequence_id+'?token='+synbiota_data.token ;
	console.log ( url ) ;
	$.getJSON ( gentle_config.proxy + '?callback=?' , 
		{ url : url } ,
		function ( data ) {
			data = JSON.parse ( data ) ;
			var name = data.name ;
			var seq = data.long_description ;
			var fa = new FT_fasta () ;
			fa.text = ">" + name + "\n" + seq ;
			fa.parseFile() ;
	} ) ;
}

function synbiota_init () {
	synbiota_data.token = gentle.url_vars.token ;
	if ( undefined === synbiota_data.token ) return ;
	synbiota_data.project_id = gentle.url_vars.project_id ;
	synbiota_data.sequence_id = gentle.url_vars.id ;
	while ( gentle.sequences.length > 0 ) gentle.closeCurrentSequence() ;
	synbiota_load_sequence ( gentle.url_vars.project_id , gentle.url_vars.id ) ;
}

plugins.registerPlugin ( { className : 'synbiota' , url : 'plugins/synbiota.js' } ) ;
synbiota_init () ;

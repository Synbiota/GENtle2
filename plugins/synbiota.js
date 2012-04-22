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

synbiota.prototype.findParts = function () {
	var sc = this.getCurrentSequenceCanvas() ;
	if ( sc === undefined ) return ; // Paranoia

	var me = this ;
	me.fpdid = 'synbiota_find_parts_dialog' ;
	me.fpd_results = [] ;
	
	var h = '' ;
	h += '<div class="modal" id="' + this.fpdid + '">' ;
	h += '<div class="modal-header"><a class="close" data-dismiss="modal"></a><h3>Find parts</h3></div>' ;
	h += '<div class="modal-body">' ;

	h += "<div><form id='fpd_form'><input type='text' id='fpd_query' value='' size='50' /> <input type='submit' value='Find parts' /></form></div>" ;
	
	h += "<div id='fpd_results' class='well' style='min-height:300px;max-height:300px;width:95%;overflow:auto;'>" ;
	h += "</div>" ; // fpd_results

	h += '</div>' ; // modal-body

//	h += '<div class="modal-footer"><a href="#" class="btn btn-primary" onclick=\'gentle.sequence_info_dialog.onSaveButton();return false\'>Save changes</a>' ;
//	h += '<a href="#" class="btn" onclick=\'gentle.sequence_info_dialog.onCancelButton();return false\'>Cancel</a></div>' ;
	h += '</div>' ; // modal

//</div>

	$('#'+this.fpdid).remove() ;
	$('body').append ( h ) ;
	$('#'+this.fpdid).modal();
	$('#fpd_query').focus() ;
	$('#fpd_form').submit ( function () {
		setTimeout ( function () { $('#fpd_results').html ( '<div class="alert alert-info">Querying database...</div>' ) ; } , 1 ) ;
		var query = $('#fpd_query').val() ;
		
		var url = synbiota_data.api_url + '/api/' ;
		if ( synbiota_data.api_version > 0 ) url += synbiota_data.api_version + '/' ;
		url += 'parts?token=' + synbiota_data.token + '&name=' + escape ( query ) ;

		$.getJSON ( gentle_config.proxy + '?callback=?' , 
			{ url : url } ,
			function ( data ) {
				me.fpd_results = JSON.parse ( data ) ;
				me.show_fpd_results() ;
		} ) ;
		
		return false ;
	} ) ;
}

synbiota.prototype.show_fpd_results = function () {
	var me = this ;
	var h = '' ;
	h += "<table class='table'>" ;
	h += "<tr><th>Kind</th><th>Name / Description</th></tr>" ;
	
	$.each ( me.fpd_results , function ( k , v ) {
		h += "<tr id='fpd_result_" + k + "' class='fpd_result_row'>" ;
		h += "<td>" + (v.kind||'Unknown') + "</td>" ;
		h += "<td><div><b>" + (v.name||'<i>No name</i>') + "</b></div>" ;
		h += "<div style='max-height:60px;overflow:auto;'><pre style='font-size:7pt;font-family:Verdana;line-height:100%;'>" + (v.description||'<i>No description available</i>') + "</pre></div>" ;
		h += "</td>" ;
		h += "</tr>" ;
	} ) ;
	
	h += "</table>" ;
	$('#fpd_results').html ( h ) ;
	
	$('.fpd_result_row').css ( { cursor : 'pointer' } ) ;

	$.each ( me.fpd_results , function ( k , v ) {
		$('#fpd_result_'+k).click ( function () { me.fpd_load_part ( k ) } ) ;
/*		var s = ( v.description || '' ) ;
		if ( s == '' ) return ;
		$('#fpd_result_'+k).popover ( { content : "<pre>" + s + "</pre>" } ) ;*/
	} ) ;
}

synbiota.prototype.fpd_load_part = function ( num ) {
	var me = this ;
	var o = me.fpd_results[num] ;
	
//	console.log ( o ) ;
	if ( undefined === o.completed_part_id || null === o.completed_part_id ) { // Load part from project/id
		synbiota_load_sequence_from_project ( o.project_id , o.id ) ;
	} else { // Load completed part
		synbiota_load_sequence_part ( o.completed_part_id ) ;
	}
}

synbiota.prototype.global_init = function () {
	if ( undefined === gentle.url_vars.token ) {
		return ; // No token, no joy!
	}

	if ( plugins.registerPlugin ( { className : 'synbiota' , url : 'plugins/synbiota.js' } ) ) {
		plugins.addSection ( 'dna' , 'synbiota' ) ;
		plugins.addSection ( 'designer' , 'synbiota' ) ;
		plugins.registerAsTool ( { className : 'synbiota' , module : 'dna' , section : 'synbiota' , call : 'saveToSynbiota' , linkTitle : 'Save to Synbiota' } ) ;
		plugins.registerAsTool ( { className : 'synbiota' , module : 'dna' , section : 'synbiota' , call : 'findParts' , linkTitle : 'Find parts' } ) ;
		plugins.registerAsTool ( { className : 'synbiota' , module : 'designer' , section : 'synbiota' , call : 'findParts' , linkTitle : 'Find parts' } ) ;
	} else {
		return ; // Plugin registry failed. Abort, abort!!
	}

	if ( undefined === gentle_config.synbiota ) gentle_config.synbiota = {} ;
	synbiota_data.use_proxy = ( gentle_config.synbiota.use_proxy || 1 ) > 0 ;
	synbiota_data.api_version = gentle_config.synbiota.api_version || 1 ;
	synbiota_data.api_url = gentle_config.synbiota.api_url || 'https://synbiota-test.herokuapp.com' ;
	
	
	synbiota_data.token = gentle.url_vars.token ;
	if ( undefined === synbiota_data.token ) return ;
	synbiota_data.project_id = gentle.url_vars.project_id ;
	
	if ( gentle.url_vars.id == -1 ) {
		gentle.startNewSequenceDialog() ;
	} else {
		while ( gentle.sequences.length > 0 ) gentle.closeCurrentSequence() ;
		synbiota_data.sequence_id = gentle.url_vars.id ;
		synbiota_load_sequence_from_project ( gentle.url_vars.project_id , gentle.url_vars.id ) ;
	}
}

function synbiota () {
	this.name = 'synbiota' ;
}


function synbiota_load_sequence_from_project ( project_id , sequence_id ) {
	var url = synbiota_data.api_url + '/api/' ;
	if ( synbiota_data.api_version > 0 ) url += synbiota_data.api_version + '/' ;
	url += 'projects/'+project_id+'/gentle_files/'+sequence_id+'?token='+synbiota_data.token ;
	synbiota_load_sequence ( url ) ;
}

function synbiota_load_sequence_part ( part_id ) {
	var url = synbiota_data.api_url + '/api/' ;
	if ( synbiota_data.api_version > 0 ) url += synbiota_data.api_version + '/' ;
	url += 'parts/' + part_id + '?token='+synbiota_data.token ;
	synbiota_load_sequence ( url ) ;
}

function synbiota_load_sequence ( url ) {
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

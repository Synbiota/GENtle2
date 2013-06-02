// An external tool that can help in the initial phase with feedback.
var use_bugmuncher = true ;

var bugmuncher_options = {
	language:'en',
	position:'right',
	show_intro:true,
	show_preview:true,
	label_text:'Feedback',
	api_key:'3ce92ba3439e62465ecdf9d56c02cad63b2172a6'
}

var synbiota_data = {} ;
console.log("synbiota.js processing")
synbiota.prototype = new Plugin() ;
synbiota.prototype.constructor = synbiota ;

synbiota.prototype.saveToSynbiota = function () {
	// Init
	var me = this ;
	var sc = this.getCurrentSequenceCanvas() ;
	console.log("sc: " + sc);
	if ( sc === undefined ) return ; // Paranoia
	if ( sc.sequence.synbiota === undefined ) sc.sequence.synbiota = {
		project_id : synbiota_data.project_id ,
		sequence_id : -1 ,
		kind : 'Misc'
	} ;

	if (sc.sequence.synbiota.read_only==true)
	{
		alert("Sorry, this sequence is read-only. You may wish to save this file locally from the File menu.")
		return;
	}
	
	var file = new FT_sybil();
	var sybil = file.getExportString ( sc.sequence ) ;
	var use_put = false;

	if ( sc.sequence.synbiota.sequence_id > -1 ) {
		console.log ( "UPDATE" ) ;
		var url = synbiota_data.api_url + '/api/' + synbiota_data.api_version + '/projects/' + sc.sequence.synbiota.project_id + '/gentle_files/' + sc.sequence.synbiota.sequence_id ;
		
		var params = {
			token : synbiota_data.token ,
			id : sc.sequence.synbiota.sequence_id ,
			'gentle_file[name]' : ( sc.sequence.name || '' ) ,
			'gentle_file[kind]' : sc.sequence.synbiota.kind ,
			'gentle_file[description]' : ( sc.sequence.desc || '' ) ,
			'gentle_file[sybil]' : sybil ,
			
		}

		use_put = true;

	} else {
		console.log ( "SAVE" ) ;
		var url = synbiota_data.api_url + '/api/' + synbiota_data.api_version + '/projects/' + sc.sequence.synbiota.project_id + '/gentle_files' ;
		var params = {
			token : synbiota_data.token ,
			'gentle_file[name]' : ( sc.sequence.name || '' ) ,
			'gentle_file[kind]' : sc.sequence.synbiota.kind ,
			'gentle_file[description]' : ( sc.sequence.desc || '' ) ,
			'gentle_file[sybil]' : sybil
		} ;
		if ( sc.sequence.synbiota.sequence_id > -1 ) params.id = sc.sequence.synbiota.sequence_id ;
		use_put = false;
	}
	ajax_type = "POST"
	

	if(synbiota_data.use_proxy)
	{
		if (use_put) // Use 'PUT' when updating a file, and 'POST' when saving a new file
		{
			params.use_put = true;
		}
		params.url = url 
		url = './data/synbiota_proxy.php';
	}
	else
	{
		if(use_put)
		{
			ajax_type = "PUT"
		}
	}

	$.ajax({
		url: url,
		data: params,
		type: ajax_type,
		datatype: "JSON",
		success: function(data) { 
			if(data && data!=null)
			{
				sc = gentle.main_sequence_canvas;

				if(typeof(data)=="string")
				{
					data = $.parseJSON(data);
				}
				
				if(sc.sequence.synbiota.sequence_id == -1)
				{
					sc.sequence.synbiota.sequence_id = data.id
				}

				//update last saved notification.
				sc.sequence.synbiota.updated_at = data.updated_at ;
				sc.updateTitleBar() ;

			}
			
		} // success
		,
		error: function(jqXHR, textStatus, errorThrown) {
				//update last saved notification.
				sc.sequence.synbiota.updated_at = "save failed." ;
				sc.updateTitleBar() ;
		}

	});

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
		setTimeout ( function () { $('#fpd_results').html( '<div class="alert alert-info">Querying database...</div>' ) ; } , 1 ) ;
		var query = $('#fpd_query').val() ;
		
		var url = synbiota_data.api_url + '/api/' ;
		if ( synbiota_data.api_version > 0 ) url += synbiota_data.api_version + '/' ;
		url += 'gentle_files?token=' + synbiota_data.token + '&any=' + escape( query ) ;

		if(synbiota_data.use_proxy)
		{
			params = { url: url}
			url = gentle_config.proxy 

		}
		else 
		{
			params = ""
		}

		$.ajax({
			url: url,
			data: params,
			datatype: "json",
			type: "GET",
			success: function(data) {
				if(typeof(data)=="string")
				{
					// Chrome appears to be parsing the return data as a JSON object, firefox keeps it as a string
					data = $.parseJSON(data);
				}
				me.fpd_results = data;
				me.show_fpd_results();
			}
		})
		
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

	} ) ;
}



synbiota.prototype.fpd_load_part = function ( num ) {
	var me = this ;
	var o = me.fpd_results[num] ;

	if ( undefined === o.completed_part_id || null === o.completed_part_id ) { // Load part from project/id
		synbiota_load_sequence_from_project ( o.project_id , o.id ) ;
	} else { // Load completed part
		synbiota_load_sequence_part ( o.completed_part_id ) ;
	}
}

synbiota.prototype.global_init = function () {

	if ( use_bugmuncher ) { // BugMuncher
		var node = document.createElement("script"); 
		node.setAttribute("type", "text/javascript"); 
		node.setAttribute("src", "https://app.bugmuncher.com/js/bugMuncher.min.js"); 
		document.getElementsByTagName("head")[0].appendChild(node); 
	}
	
	if ( undefined === gentle_config.synbiota ) gentle_config.synbiota = {} ;
	//synbiota_data.use_proxy = ( gentle_config.synbiota.use_proxy || 1 ) > 0 ;

	if(gentle_config.synbiota.use_proxy == 0)
	{
		synbiota_data.use_proxy = false;
	}
	else
	{
		synbiota_data.use_proxy = true;
	}

	console.log("proxy setting: " + gentle_config.synbiota.use_proxy + ", use proxy? " + synbiota_data.use_proxy)
	synbiota_data.api_version = gentle_config.synbiota.api_version || 1 ;
	synbiota_data.api_url = gentle_config.synbiota.api_url || 'https://synbiota-test.herokuapp.com' ;
	
	
	synbiota_data.token = gentle.url_vars.token ;
	if ( undefined === synbiota_data.token ) {
/*		// No Synbiota token, therefore remove all Synbiota sequences, so that the user does not edit them with no way to save them to the site later. Better safe than wasted time.
		var tmpseq = [] ;
		$.each ( gentle.sequences , function ( k , v ) { // Get all synbiota sequences
			if ( undefined !== v.synbiota ) tmpseq.push ( k ) ;
		} ) ;

		while ( tmpseq.length > 0 ) {
			gentle.current_sequence_entry = tmpseq.pop() ;
			gentle.closeCurrentSequence() ;
		}*/
		return ;
	}
	console.log("attempting to register synbiota plugin")
	if ( plugins.registerPlugin ( { className : 'synbiota' , url : 'plugins/synbiota.js' } ) ) {
		plugins.addSection ( 'dna' , 'synbiota' ) ;
		plugins.addSection ( 'designer' , 'synbiota' ) ;
		plugins.registerAsTool ( { className : 'synbiota' , module : 'dna' , section : 'synbiota' , call : 'saveToSynbiota' , linkTitle : 'Save to Synbiota' } ) ;
		plugins.registerAsTool ( { className : 'synbiota' , module : 'dna' , section : 'synbiota' , call : 'findParts' , linkTitle : 'Find parts' } ) ;
		plugins.registerAsTool ( { className : 'synbiota' , module : 'designer' , section : 'synbiota' , call : 'findParts' , linkTitle : 'Find parts' } ) ;
	} else {
		console.log("Synbiota plugin couldn't load")
		return ; // Plugin registry failed. Abort, abort!!
	}

	
	synbiota_data.project_id = gentle.url_vars.project_id ;

	if ( undefined === gentle.url_vars.id ) gentle.url_vars.id = -1 ;
	if ( undefined === gentle.url_vars.ro || gentle.url_vars.ro == "") gentle.url_vars.ro = -1 ;

	if (gentle.url_vars.id == -1 && gentle.url_vars.ro == -1) {
		gentle.startNewSequenceDialog();
	} else {
		while ( gentle.sequences.length > 0 ) gentle.closeCurrentSequence() ;
		if ( gentle.url_vars.id != -1 ) {
//			synbiota_data.sequence_id = gentle.url_vars.id ;
			$.each ( gentle.url_vars.id.split(',') , function ( k , id ) {
				synbiota_load_sequence_from_project ( gentle.url_vars.project_id , id ) ;
			} ) ;
		}
		if ( gentle.url_vars.ro != -1 ) {
//			synbiota_data.sequence_id = gentle.url_vars.id ;
			$.each ( gentle.url_vars.ro.split(',') , function ( k , id ) {
				synbiota_load_sequence_from_project ( gentle.url_vars.project_id , id ) ;
			} ) ;
		}
	}

}

function synbiota () {
	this.name = 'synbiota' ;
}


function synbiota_load_sequence_from_project ( project_id , sequence_id ) {
	console.log("synbiota_load_sequence_from_project: " + project_id + " , " + sequence_id)
	var url = synbiota_data.api_url + '/api/' ;
	if ( synbiota_data.api_version > 0 ) url += synbiota_data.api_version + '/' ;
	url += 'projects/'+project_id+'/gentle_files/'+sequence_id+'?token='+synbiota_data.token ;
	synbiota_load_sequence ( url ) ;
}

function synbiota_load_sequence_part ( part_id ) {
	//console.log("synbiota_load_sequence_part: " + part_id)
	var url = synbiota_data.api_url + '/api/' ;
	if ( synbiota_data.api_version > 0 ) url += synbiota_data.api_version + '/' ;
	url += 'parts/' + part_id + '?token='+synbiota_data.token ;
	synbiota_load_sequence ( url ) ;
}

function synbiota_load_sequence ( url ) {
	//console.log("synbiota_load_sequence: " +url)

	if(synbiota_data.use_proxy)
	{
		//console.log("using proxy")
		params = {
			url: url
		} 
		url = gentle_config.proxy
	}
	else
	{
		params= "";
	}


	$.ajax({
		url: url,
		datatype: "json",
		data: params,
		error: function (jqXHR, textStatus, errorThrown) {console.log(errorThrown)},
		crossDomain: true,
		
		success: function (data, textStatus, jqXHR ) {
			
			if(typeof(data)=="string")
			{
				// Chrome appears to be parsing the return data as a JSON object, firefox keeps it as a string
				data = $.parseJSON(data);
			}
			
			
			var sybil = new FT_sybil ();			
			sybil.text = data.sybil;
			
			var seqids = sybil.parseFile() ;
			if ( seqids.length != 1 ) {
				alert ( "There was a problem opening Synbiota sequence " + sequence_id + " in project " + project_id ) ;
				return ;
			}


			read_only = true;
			// Determine if sequence is editable
			if(data.state=="wip")
			{
				read_only = false;
			}
			else
			{
				// hack to add 'read-only' tag to nav bar - can't be done automatically in first instance as nav bar is configured
				// by sybil.parseFile() first. Subsequent calls are done automatically.
				$("#sequence_canvas_title_bar").append("&nbsp;<span class='label label-warning'>read-only</span>")
			}
			

			// Add synbiota data to sequence object
			
			gentle.sequences[seqids[0]].data_keys.push ( 'synbiota' ) ;
			gentle.sequences[seqids[0]].synbiota = {
				project_id : data.project_id , 
				sequence_id : data.id ,
				created_at : data.created_at ,
				creator_id : data.creator_id ,
				updated_at : data.updated_at ,
				kind : data.kind ,
				last_editor_id : data.last_editor_id,
				read_only: read_only
			} ;


			//same hack as above, for updated_at flag...
			//TODO is there a better way?
			var lastsave = moment(data.updated_at);
			$("#sequence_canvas_title_bar").append("&nbsp;<span class='label label-info' style='font-weight: normal;'> Last Saved: " + lastsave.calendar() + "</span> " )
			
		} // success

	}); // $.ajax
}
var dummy = new synbiota() ;
dummy.global_init () ;

// HACK add newsletter signup
$(document).ready ( function () {

	$('#help_menu').append ( "<li><a target='_blank' href='#' onclick='aweber();return false'>Sign up for mailing list</a></li>" ) ;
	gentle.sortMenu ( 'help_menu_wrapper' ) ;
	
} ) ;

function aweber () {
	var h = '' ;
	h += '<div class="modal" id="aweber">' ;
	h += '<div class="modal-header"><a class="close" data-dismiss="modal"></a><h3>Subscribe to mailing list</h3></div>' ;
	h += '<div class="modal-body">' ;
	h += '<form method="post"   action="https://www.aweber.com/scripts/addlead.pl"  > <div style="display: none;"> <input type="hidden" name="meta_web_form_id" value="2100967401" /> <input type="hidden" name="meta_split_id" value="" /> <input type="hidden" name="listname" value="gentle2" /> <input type="hidden" name="redirect" value="https://www.aweber.com/thankyou-coi.htm?m=text" id="redirect_2e177b0a40e15a7557410215c2b3dd21" />  <input type="hidden" name="meta_adtracking" value="GENtle2_Signup" /> <input type="hidden" name="meta_message" value="1" /> <input type="hidden" name="meta_required" value="name,email" />  <input type="hidden" name="meta_tooltip" value="" /> </div> <div id="af-form-2100967401"  ><div id="af-header-2100967401"  ><div  ><p>&nbsp;</p></div></div> <div id="af-body-2100967401"   > <div  > <label   for="awf_field-36650604">Name: </label> <div  > <input id="awf_field-36650604" type="text" name="name"   value=""  tabindex="500" /> </div> <div  ></div></div> <div  > <label   for="awf_field-36650605">Email: </label> <div  ><input   id="awf_field-36650605" type="text" name="email" value="" tabindex="501"  /> </div><div  ></div> </div> <div  > <input name="submit"   type="submit" value="Submit" tabindex="502" /> <div  ></div> </div> <div   style="text-align: center"><p>We respect your <a title="Privacy Policy" href="https://www.aweber.com/permission.htm" target="_blank">email privacy</a></p> <div  ></div> </div> </div> <div id="af-footer-2100967401"  ><div  ><p>&nbsp;</p></div></div> </div> <div style="display: none;"></div> </form>' ;
	h += '</div>' ; // modal-body
	h += '</div>' ; // modal

	$('body').append ( h ) ;
	$('#aweber').modal();
}
// END HACK

/*
 */

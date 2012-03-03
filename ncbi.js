function start_nbci_dialog () {
	$('#ncbi_dialog').remove() ;
	
	var h = '' ;
	h += '<div class="modal" id="ncbi_dialog" style="display:none">' ;
	h += '<div class="modal-header">' ;
	h += '<a class="close" data-dismiss="modal">×</a>' ;
	h += '<h3>Query NCBI</h3>' ;
	h += '</div>' ;
	h += '<div class="modal-body">' ;
	h += '<p>' ;
	h += "<form id='nbci_form' action='x.html'>" ;
	h += "<table>" ;
	h += "<tr><th nowrap>NBCI ID</th><td><input type='text' size='30' id='ncbi_id' value='' /><br/>" ;
	h += "<small>Example : <a href='#' onclick='$(\"#ncbi_id\").val(\"JQ033384.1\");load_ncbi();return false'>JQ033384.1</a></small>" ;
	h += "</td></tr>" ;
	h += "<tr><td /><td><input type='submit' onclick='load_ncbi()' value='Load' /></td></tr>" ;
	h += "</table>" ;
	h += "</form>" ;
	h += '</p>' ;
	h += '</div>' ;
	h += '<div class="modal-footer">' ;
	h += "<i>Note :</i> You can also drag'n'drop files directly into the browser window!" ;
	h += '</div>' ;
	h += '</div>' ;
	
	$('#all').append ( h ) ;
	$('#ncbi_dialog').modal() ;
	$('#nbci_form').submit ( function () { load_ncbi(); return false ; } ) ;
}

function load_ncbi () {
	var id = $('#ncbi_id').val() ; // XXU13852 | JQ033384.1
	if ( id == '' ) return false ;
	$('#ncbi_id').val('') ;
	$('#nbci_form').html("<i>Querying NCBI...</i>") ;
	$.getJSON ( gentle_config.proxy + '?callback=?' , 
	{ url : 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id='+id+'&rettype=gb&retmode=text' } ,
	function ( data ) {
		var text = data ;
		$('#ncbi_dialog').modal('hide') ;
		$('#ncbi_dialog').remove() ;
		var gb = new FT_genebank () ;
		gb.parseText ( text ) ;
	} ) ;
	return false ;
}

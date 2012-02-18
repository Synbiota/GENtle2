function start_nbci_dialog () {
	$('#ncbi_dialog').remove() ;
	
	var h = '' ;
	h += "<div id='ncbi_dialog'>" ;
	h += "<form id='nbci_form' action='x.html'>" ;
	h += "<table>" ;
	h += "<tr><th nowrap>NBCI ID</th><td><input type='text' size='30' id='ncbi_id' value='' /><br/><small>Example : JQ033384.1</small></td></tr>" ;
	h += "<tr><td /><td><input type='submit' onclick='load_ncbi()' value='Load' /></td></tr>" ;
	h += "</table>" ;
	h += "</form>" ;
	h += "</div>" ;
	
	$('#all').append ( h ) ;
	$('#ncbi_dialog').dialog ( { title : 'Query NCBI' } );
	$('#ncbi_dialog').css ( { 'font-size' : '10pt' } ) ;
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
		$('#ncbi_dialog').remove() ;
		var gb = new FT_genebank () ;
		gb.parseText ( text ) ;
	} ) ;
	return false ;
}

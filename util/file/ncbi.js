var ncbi = {

	db : 'nuccore' ,

	/*
	Create dialog to ask for NCBI input, 
	attempt to validate ID code, alert on bad entry.
	*/
	initializeDialog : function () {
		$('#ncbi_dialog').remove() ;

		var dialogContainer = $("<div/>");
		dialogContainer.load("public/templates/ncbi_dialog.html", function(){

			var sc = gentle.main_sequence_canvas ;
			if ( sc ) {
				/*  We no longer have a "not editing mode".
				if ( sc.edit && sc.edit.editing ) {
					sc.setEditMode ( false ) ;
					sc.show() ;
				}*/
				sc.unbindKeyboard() ;
			}

			dialogContainer.appendTo("#all");
			$('#ncbi_dialog').modal();
			$('#ncbi_query').focus();
			$('#form_ncbi_database input[name=ncbi_database]').filter('[value='+ncbi.db+']').attr('checked', true);
			$("#form_ncbi_search").submit(function(){ncbi.doSearch(); return false});
			$("#form_ncbi_go").submit(function(){ncbi.loadIDfromForm(); return false});
			$('#form_ncbi_database input[type=radio]').change(function(){ncbi.changeDatabase();return false});
			$('#ncbi_demo_link').click ( function() { ncbi.loadID("JQ033384.1"); return false } ) ;

		});
		return false ;
	} ,
	
	changeDatabase : function () {
		ncbi.db = $('input[name=ncbi_database]:checked','#form_ncbi_database').val() ;
		var query = $('#ncbi_query').val() ;
		if ( query != '' ) ncbi.doSearch() ; // Re-do search on changed database
	} ,


	/*

	*/
	loadIDfromForm : function () {
		var ncbiID = $('#ncbi_form input[name=ncbiID]').val();

		//TODO: better check for ncbi codes, better way to deal with user errors.
		if (ncbiID !== "") {
			$('#ncbi_form').html("<i>Querying NCBI...</i>");
			ncbi.loadID(ncbiID);
		} else {
			alert("Bad ID provided");
		}
	} ,


	/*
	Function searches NCBI database
	*/
	doSearch : function () {
		var query = $('#ncbi_query').val() ;
		$('#ncbi_results').html('<i>Searching NCBI...</i>') ;

		$.ajax({
			url: gentle_config.proxy + '?callback=?',
			data: { 'url' : 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db='+ncbi.db+'&term='+escape(query) },
			dataType: 'json',
			success:  function ( NCBIResponse ) {
				var d = $.parseXML ( NCBIResponse ) ;
				var ids = [] ;
				$($($(d).find('IdList')).find('Id')).each ( function ( k , v ) {
					if ( ids.length >= 50 ) return false ;
					var id = $(v).text() ;
					ids.push ( id ) ;
				} ) ;
				ncbi.showResults ( ids ) ;
			}
		});
  
		return false ;
	} ,

	/*
	Function queries and shows ncbi search results
	*/
	showResults : function ( ids ) {
	  $.ajax({
		url: gentle_config.proxy + '?callback=?',
		data: { 'url' : 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db='+ncbi.db+'&id='+ids.join(',') },
		dataType: 'json',
		success:  function ( NCBIResponse ) {
			var hasResults = false ;
			var d = $.parseXML ( NCBIResponse ) ;
			var h = "<table class='table table-condensed table-striped'>" ;
			h += "<thead><tr><th>Caption</th><th>Title</th><th>Length</th></tr></thead><tbody>" ;
			$($(d).find('DocSum')).each ( function ( k , v ) {
				hasResults = true ;
				var id = $($(v).find('Id')).text() ;
				var caption = $($(v).find('Item[Name=Caption]')).text() ;
				var title = $($(v).find('Item[Name=Title]')).text() ;
				var length = $($(v).find('Item[Name=Length]')).text() ;
				h += "<tr>" ;
				h += "<th><a href='#' onclick='ncbi.loadID(\"" + id + "\");return false'>" + caption + "</a></th>" ;
				h += "<td><a href='#' onclick='ncbi.loadID(\"" + id + "\");return false'>" + title + "</a></td>" ;
				h += "<td>" + length + "</td>" ;
				h += "</tr>" ;
			} ) ;
			h += "</tbody></table>" ;
			if ( !hasResults ) h = "No matches found" ;
			$('#ncbi_results').html(h) ;
		}
	  });

	} ,


	/*
	Function queries NCBI database and 
	runs text pareser to open the file.
	*/
	loadID : function (ncbiID) {
		$.ajax({
			url: gentle_config.proxy + '?callback=?',
			data: {
				'url' : 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db='+ncbi.db+'&id='+ncbiID+'&rettype=gb&retmode=text' 
			},
			dataType: 'json',
			success:  function ( NCBIResponse ) {
				var gb = new FT_genebank () ;
				$('#ncbi_dialog').modal('hide') ;
				$('#ncbi_dialog').remove() ;
				gb.parseText ( NCBIResponse ) ;
			}
		});
		return false ;
	}

}
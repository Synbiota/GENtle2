// TODO :
// ??? Maybe register API key for NCBI ajax access here : https://entrezajax.appspot.com/

/* Global variables :
* gentle (main.js)
* plugins (plugins.js)
*/

//________________________________________________________________________________________
// gentle object containing core methods
var gentle = {
	fileTypeList : [ 'fasta' , 'genebank' , 'plaintext' ] ,
	sequences : [] ,
	current_sequence_entry : undefined ,
	main_sequence_canvas : undefined ,

	init : function () {
		if ( undefined === gentle_config ) {
			gentle_config = { default_plugins : [] , deactivated_plugins : [] } ;
		}
		gentle.url_vars = {} ;
		gentle.url_vars = gentle.getUrlVars ( gentle.url_vars ) ;
		gentle.plugins = plugins ;
		loadBaseData() ;
		this.showDefaultBlurb() ;
	
		if (window.File && window.FileReader && window.FileList && window.Blob) {
		} else {
			$('#load_local_files').html ( "This browser does not support reading local files. Try FireFox 4+, Google Chrome, or similar." ) ;
		}
	
		$(window).bind('beforeunload', function(){
		  gentle.saveLocally () ;
		});
		
		$('#main').height ( $('body').height()-50 ) ;
	
		
		$('#files').change ( gentle.handleFileSelect ) ;
		$('#drop_zone') .bind('dragover',function(evt){gentle.markDropArea(evt,true)})
						.bind('dragleave',function(evt){gentle.markDropArea(evt,false)})
						.bind('drop',gentle.handleFileDrop) ;
//		$('#sb_sequences').css ( { 'width' : '100%' , 'max-width' : $('#sidebar').width() } ) ;
		
		$('#sb_log').append ( '<p>Supported file formats:<br/>' + gentle.fileTypeList.join(', ') + '</p>' ) ;
		$('#sb_sequences').change ( function() { gentle.handleSelectSequenceEntry ( $("#sb_sequences").val() ) } ) ;
		
		gentle.loadLocally() ;
		plugins.loadPlugins() ;
	} ,
	
	showDefaultBlurb : function () {
		var h = "<iframe id='main_blurb' src='default_main.html' style='border:none;position:relative;overflow-y:auto' />" ;
		$('#main').html ( h ) ;
		$('#main_blurb').css ( { 'left' : $('#main').width()/4 } ) ;
		$('#main_blurb').width ( $('#main').width()/2 ) ;
		$('#main_blurb').height ( $('#main').height() ) ;
		$('#main_blurb').css ( { 'max-height' : $('#main').height() } ) ;
	} ,
	
	loadLocally : function () {
		if ( !localStorage.getItem('saved') ) {
			gentle.loadLocalPlugins() ;
			return ;
		}
	
		// We cannot just assign the stored item, because of missing class methods
		// Each sequence object needs to be reconstructed individually
		var tmpseq = JSON.parse ( localStorage.getItem('sequences') ) ;
		gentle.sequences = [] ;
		$.each ( tmpseq , function ( k , v ) {
			if ( v.typeName == 'dna' ) {
				var seq = new SequenceDNA () ;
				$.each ( v , function ( k2 , v2 ) {
					seq[k2] = v2 ;
				} ) ;
				gentle.sequences[k] = seq ;
			} else {
				console.log ( 'UNKNOWN LOCAL STORAGE SEQUENCE TYPENAME ' + v.typeName ) ;
			}
		} ) ;
		
		// Now show last sequence, if any
		gentle.current_sequence_entry === undefined ;

		if ( gentle.sequences.length > 0 ) {
			
			var cse = localStorage.getItem('last_entry')*1 ;
			$('#sb_sequences').html ( '' ) ;
			$.each ( gentle.sequences , function ( seqid , seq ) {
				$('#sb_sequences').append ( '<option value="' + seqid + '">' + seq.name + '</option>' ) ;
			} ) ;
			$('#sb_sequences').val(cse) ;
		
			gentle.handleSelectSequenceEntry ( cse ) ;
		}
		
		gentle.loadLocalPlugins() ;
	} ,
	
	loadLocalPlugins : function () {
		var plugin_list = localStorage.getItem('plugins') ;
		if ( plugin_list ) {
			plugins.load_on_start = JSON.parse ( plugin_list ) ;
			plugins.loadPlugins() ;
		} else {
			plugins.load_on_start = gentle_config.default_plugins ;
		}
	} ,

	saveLocally : function () {
		gentle.updateCurrentSequenceSettings () ;
		if ( gentle.sequences.length == 0 ) {
			gentle.clearLocalStorage () ;
			return ;
		}

		var s = JSON.stringify ( gentle.sequences ) ;
		try {
			localStorage.setItem ( 'sequences' , s ) ;
		}  catch (e) {
			alert ( 'Local storage quota exceeded. Changes since last page load will not be stored. Sorry about that.' ) ;
			return ;
		}
		localStorage.setItem ( 'last_entry' , gentle.current_sequence_entry ) ;
		localStorage.setItem ( 'saved' , 'true' ) ;
		
		var plugin_list = [] ;
		$.each ( plugins.all , function ( k , v ) {
			if ( v.url !== undefined ) plugin_list.push ( v.url ) ;
		} ) ;
		localStorage.setItem ( 'plugins' , JSON.stringify(plugin_list) ) ;
	} ,


	closeCurrentSequence : function () {
		if ( gentle.current_sequence_entry === undefined ) return ;
		var entry = gentle.current_sequence_entry ;
		
		gentle.sequences.splice ( entry , 1 ) ;
		$('#sb_sequences').html ( '' ) ;
		$.each ( gentle.sequences , function ( seqid , seq ) {
			$('#sb_sequences').append ( '<option value="' + seqid + '">' + seq.name + '</option>' ) ;
		} ) ;
		
		gentle.current_sequence_entry = undefined ;
		if ( gentle.sequences.length == 0 ) {
			gentle.clearLocalStorage () ;
			$('#seq_functions_seq_only').hide() ;
			$('#topbox').html ( '' ) ;
			$('#main').html ( '' ) ;
			$('#sb_display_options').html ( '' ) ;
			$('#position').html ( '&nbsp;' ) ;
			$('#right').html ( '' ) ;
			gentle.showDefaultBlurb() ;
			return ;
		}
		
		if ( entry >= gentle.sequences.length ) entry = gentle.sequences.length-1 ;
		$('#sb_sequences').val(entry) ;
		gentle.handleSelectSequenceEntry ( entry ) ;
	} ,
	
	clearLocalStorage : function () {
//		localStorage.clear() ; // Don't use, would nuke plugins
		localStorage.removeItem('saved') ;
		localStorage.removeItem('last_entry') ;
		localStorage.removeItem('sequences') ;
	} ,
	
	updateCurrentSequenceSettings : function () {
		if ( gentle.current_sequence_entry === undefined ) return ;
		gentle.sequences[gentle.current_sequence_entry].settings = gentle.main_sequence_canvas.getSettings() ;
	//	console.log ( "STORING : " + JSON.stringify ( gentle.sequences[gentle.current_sequence_entry].settings ) ) ;
	} ,
	
	handleSelectSequenceEntry : function ( entry ) {
		gentle.updateCurrentSequenceSettings () ;
		$('#seq_functions_seq_only').show() ;
	
		gentle.current_sequence_entry = entry ;
		
		var html = "<div id='canvas_wrapper'>" ;
		html += "<canvas id='sequence_canvas'></canvas>" ;
		html += "<div id='main_slider'></div>" ;
		html += "</div>" ;
		$('#main').html ( html ) ;
		
		$('#canvas_wrapper').height ( $('#main').height() ) ;
		
		// Set up new top display
		top_display = new TopDisplayDNA () ;
		top_display.init() ;
		
		// Set up new sequence canvas
		gentle.main_sequence_canvas = new SequenceCanvasDNA ( gentle.sequences[entry] , 'sequence_canvas' ) ;
	
	} ,

	getUrlVars : function ( def ) {
		var vars = def , hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		$.each ( hashes , function ( i , j ) {
			var hash = j.split('=');
			hash[1] += '' ;
			vars[hash[0]] = decodeURI(hash[1]).replace(/_/g,' ');
		} ) ;
		return vars;
	} ,
		

	// File open/drop handlers
	handleFileSelect : function ( evt ) {
		$.each ( evt.target.files , function ( k , f ) { gentle.addLocalFile ( f ) } ) ;
	} ,
	handleFileDrop : function (evt) {
		evt.originalEvent.stopPropagation();
		evt.originalEvent.preventDefault();
		$.each ( evt.originalEvent.dataTransfer.files , function ( k , f ) { gentle.addLocalFile ( f ) } ) ;
		gentle.markDropArea(evt,false);
	} ,
	markDropArea : function ( evt , mode ) {
		evt.originalEvent.stopPropagation();
		evt.originalEvent.preventDefault();
		evt.originalEvent.dataTransfer.dropEffect = 'copy';
		$('#drop_zone').css({'background-color':(mode?'#CCCCCC':'white')}) ;
	} ,
	fileLoaded : function ( f ) {
		$('#sb_log').append ( '<p>' + f.file.name + ' is ' + f.typeName + '</p>' ) ;
	} ,
	addLocalFile : function ( f ) {
		$('#sb_log').append ( '<p>Loading ' + f.name + '</p>' ) ;
		
		// Determine file type
		f.isIdentified = false ;
		
		$.each ( gentle.fileTypeList , function ( k , v ) {
			var file = new window['FT_'+v]();
			file.checkFile ( f ) ;
		} ) ;
	
	}

} ;


//________________________________________________________________________________________
// Init when page has loaded
$(document).ready ( function () {
	gentle.init () ;
} ) ;

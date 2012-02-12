//________________________________________________________________________________________
// Plugin class

function Plugin () {
	this.name = 'empty plugin' ;
}

Plugin.prototype.getCurrentSequenceCanvas = function () { return gentle.main_sequence_canvas ; }

//________________________________________________________________________________________
// Plugin list object

var plugins = {
	verbose : true ,
	initial_plugins_loaded : false ,
	all : {} ,
	load_on_start : [] ,
	default_plugins : [
		'plugins/find_in_sequence.js' ,
		'plugins/export_as_file.js'
	] ,
	tools : {
		dna : {
			sequence : {} ,
			external : {}
		}
	} ,


// Methods functions

	registerAsTool : function ( o ) {
	
		// BEGIN PARANOIA SECTION
		if ( undefined === o ) {
			console.log ( 'plugin.registerAsTool needs a data object as parameter' ) ;
			return ;
		}
		if ( undefined === o.module ) {
			console.log ( 'plugin.registerAsTool object needs "module" member' ) ;
			return ;
		}
		if ( undefined === plugins.tools[o.module] ) {
			console.log ( 'plugin.registerAsTool object member "member" is not valid (' + o.module + ')' ) ;
			return ;
		}
		if ( undefined === o.section ) {
			console.log ( 'plugin.registerAsTool object needs "section" member' ) ;
			return ;
		}
		if ( undefined === plugins.tools[o.module][o.section] ) {
			console.log ( 'plugin.registerAsTool object member "section" is not valid (' + o.section + ')' ) ;
			return ;
		}
		if ( undefined === o.className ) {
			console.log ( 'plugin.registerAsTool object needs "className" member' ) ;
			return ;
		}
		if ( undefined === o.call ) {
			console.log ( 'plugin.registerAsTool object needs "call" member' ) ;
			return ;
		}
		if ( undefined === o.linkTitle ) {
			console.log ( 'plugin.registerAsTool object needs "linkTitle" member' ) ;
			return ;
		}
		// END PARANOIA SECTION
		
		plugins.registerPlugin ( o ) ;
	
		plugins.tools[o.module][o.section][o.name] = o ;
		if ( plugins.verbose ) console.log ( 'registered ' + o.name ) ;
		
		// Try to add to live canvas if possible
		var sc = gentle.main_sequence_canvas ;
		if ( sc === undefined ) return ;
		if ( sc.type != o.module ) return ;
		sc.registerTool ( o ) ;
	} ,
	
	registerPlugin : function ( o ) {
		if ( o === undefined ) return ;
		if ( o.name === undefined ) {
			if ( o.className === undefined ) return ;
			var x = new window[o.className](); // Class instance to get the name
			o.name = x.name ;
		}
		
		if ( plugins.all[o.name] === undefined ) {
			plugins.all[o.name] = o ;
		} else {
			$.each ( [ 'url' , 'className' ] , function ( k , v ) {
				if ( o[v] === undefined ) return ;
				if ( plugins.all[o.name][v] === undefined ) plugins.all[o.name][v] = o[v] ;
			} ) ;
		}

		plugins.setManagePluginDialogHTML() ;
	} ,
	
	loadPluginFromURL : function ( url ) {
		var fileref=document.createElement('script') ;
		fileref.setAttribute("type","text/javascript") ;
		fileref.setAttribute("src", url) ;
		var first = document.getElementsByTagName('script')[0];
		first.parentNode.insertBefore(fileref, first);
	} ,
	
	loadPlugins : function () {
		if ( plugins.initial_plugins_loaded ) return ; // Only once, my dear
		plugins.initial_plugins_loaded = true ;
		if ( undefined === plugins.load_on_start ) return ;
		$.each ( plugins.load_on_start , function ( k , url ) {
			plugins.loadPluginFromURL ( url ) ;
		} ) ;
	} ,
	
	removePlugin : function ( name ) {
		if ( undefined === plugins.all[name] ) return ;
		
		// TODO remove from sequences
		var sc = gentle.main_sequence_canvas ;
		if ( undefined !== sc ) sc.removePlugin ( name ) ;
		delete plugins.all[name] ;
		
		plugins.setManagePluginDialogHTML() ;
	} ,

	// INTERFACE METHODS

	setManagePluginDialogHTML : function () {
		if ( $('#manage_plugins_dialog').length == 0 ) return ; // Only if there actually is a dialog open
		
		var h = '' ;

		h += "<div>" ;
		h += "<h3>Registered plugins</h3>" ;

		h += "<table border=1 cellspacing=0 cellpadding=2 border='#DDDDDD'>" ;
		h += "<tr><th>Plugin</th><th>Action</th><th>Note</th></tr>" ;
		
		// Active plugins
		var hadthat = {} ;
		$.each ( plugins.all , function ( name , o ) {
			h += "<tr>" ;
			h += "<td>" + ucFirst ( o.name.replace(/_/g,' ') ) + "</td>" ;
			
			h += "<td>" ;
			h += "<a href='#' onclick='gentle.plugins.removePlugin(\"" + name + "\");return false'>Remove</a>" ;
			h += "</td>" ;
			
			h += "<td>" ;
			if ( o.url === undefined ) h += "Registered without URL, can not load again for next start" ;
			else hadthat[o.url] = 1 ;
			h += "</td>" ;
			h += "</tr>" ;
			
		} ) ;
		
		// Show all built-in but deactivated plugins
		$.each ( plugins.default_plugins , function ( k , url ) {
			if ( undefined !== hadthat[url] ) return ; // Already listed
			
			var n = url.replace ( /^.*\//g , '' ) ;
			n = n.replace ( /\.js$/ , '' ) ;
			h += "<tr>" ;
			h += "<td>" + ucFirst ( n.replace(/_/g,' ') ) + "</td>" ;
			
			h += "<td>" ;
			h += "<a href='#' onclick='gentle.plugins.loadPluginFromURL(\"" + url + "\");return false'>Activate</a>" ;
			h += "</td>" ;
			
			h += "<td>" ;
			h += "Build-in but deactivated" ;
			h += "</td>" ;
			h += "</tr>" ;
				
			} ) ;
		h += "</table>" ;

		h += "</div>" ;
		
		h += "<div>" ;
		h += "<h3>Add plugin</h3>" ;
		h += "<form id='add_plugin_url_form' action='#'>" ;
		h += "<input type='text' id='plugin_url' size='40' /><input type='submit' value='Add plugin' />" ;
		h += "</form>" ;
		h += "</div>" ;
		
		h += "<div><a target='_blank' href='help.html#plugins'>About plugins</a></div>" ;
		
		$('#manage_plugins_dialog').html ( h ) ;
		$('#manage_plugins_dialog').dialog('option', 'position', 'center');
		$('#plugin_url').focus() ;
		
		$('#add_plugin_url_form').submit ( function () {
			var url = $('#plugin_url').val() ;
			plugins.loadPluginFromURL ( url ) ;
			return false ;
		} ) ;
	} ,
	
	managePlugins : function () {
		var h = "<div id='manage_plugins_dialog'>" ;
		h += "</div>" ;
	
		$('#manage_plugins_dialog').remove() ;
		$('#all').append ( h ) ;
		$('#manage_plugins_dialog').dialog ( {
			title : 'Manage plugins' , 
			close : function () {
				$('#manage_plugins_dialog').remove() ;
			} ,
			width:"auto"
		} );
		$('#manage_plugins_dialog').css ( { 'font-size' : '10pt' } ) ;
		plugins.setManagePluginDialogHTML();
	}

} ;

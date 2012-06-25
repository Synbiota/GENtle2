//________________________________________________________________________________________
/**
	Plugin class
	@class
	@classdesc This is the base class for all plugins.
*/
function Plugin () {
	this.name = 'empty plugin' ;
}

/**
	@return {object} The current sequence canvas object.
*/
Plugin.prototype.getCurrentSequenceCanvas = function () { return gentle.main_sequence_canvas ; }

//________________________________________________________________________________________

/**
	Plugin list and maintenance object
	@namespace
*/
var plugins = {
	verbose : false ,
	initial_plugins_loaded : false ,
	all : {} ,
	load_on_start : [] ,
	tools : {
		dna : {
			file : {} ,
			sequence : {} ,
			external : {}
		} ,
		designer : {
		}
	} ,
	search : {} ,
	deactivated : {} ,
	
	/**
		Constructor
	*/
	init : function () {
		this.search = jQuery.extend(true, {}, this.tools);
	} ,


	/**
		Adds a section to a module, unless the section exists.
		@param {string} module The module to which to add the section
		@param {string} section The section to add to the module
	*/
	addSection : function ( module , section ) {
		if ( undefined !== plugins.tools[module][section] ) return ;
		plugins.tools[module][section] = {} ;
	} ,


	/**
		Checks a plugin parameter object is it is sane.
		@param {object} o The plugin parameter object.
		@return {bool} True if object passed all tests, false if not.
	*/
	registrationParanoia : function ( o ) {
	
		// BEGIN PARANOIA SECTION
		if ( undefined === o ) {
			console.log ( 'plugin.registerAsTool needs a data object as parameter' ) ;
			return false ;
		}
		if ( undefined === o.module ) {
			console.log ( 'plugin.registerAsTool object needs "module" member' ) ;
			return false ;
		}
		if ( undefined === plugins.tools[o.module] ) {
			console.log ( 'plugin.registerAsTool object member "member" is not valid (' + o.module + ')' ) ;
			return false ;
		}
		if ( undefined === o.section ) {
			console.log ( 'plugin.registerAsTool object needs "section" member' ) ;
			return false ;
		}
		if ( undefined === plugins.tools[o.module][o.section] ) {
			console.log ( 'plugin.registerAsTool object member "section" is not valid (' + o.section + ')' ) ;
			return false ;
		}
		if ( undefined === o.className ) {
			console.log ( 'plugin.registerAsTool object needs "className" member' ) ;
			return false ;
		}
		if ( undefined === o.call ) {
			console.log ( 'plugin.registerAsTool object needs "call" member' ) ;
			return false ;
		}
		if ( undefined === o.linkTitle ) {
			console.log ( 'plugin.registerAsTool object needs "linkTitle" member' ) ;
			return false ;
		}
		// END PARANOIA SECTION
		
		return true ;
	} ,
	

	/**
		Registers a plugin as a tool.
		@param {object} o The plugin parameter object.
	*/
	registerAsTool : function ( o ) {
		if ( !this.registrationParanoia ( o ) ) return ; // BAAAD TOOL!

		plugins.registerPlugin ( o ) ;
		
		var name2 = o.name + '.' + o.call ;
	
		plugins.tools[o.module][o.section][name2] = o ;
		if ( plugins.verbose ) console.log ( 'registered tool ' + name2 ) ;
		
		// Try to add to live canvas if possible
		var sc = gentle.main_sequence_canvas ;
		if ( sc === undefined ) return ;
		if ( sc.type != o.module ) return ;
		sc.registerTool ( o ) ;
	} ,
	
	
	/**
		Registers a plugin as the search handler.
		@param {object} o The plugin parameter object.
	*/
	registerAsSearch : function ( o ) {
		if ( !this.registrationParanoia ( o ) ) return ; // BAAAD TOOL!
		
		plugins.registerPlugin ( o ) ;
	
		plugins.search[o.module][o.section][o.name] = o ;
		if ( plugins.verbose ) console.log ( 'registered search ' + o.name ) ;
		
		// Try to add to live canvas if possible
		var sc = gentle.main_sequence_canvas ;
		if ( sc === undefined ) return ;
		if ( sc.type != o.module ) return ;
		sc.registerSearch ( o ) ;
	} ,
	
	
	/**
		Registers a plugin. Must be done before registering it as a tool or search handler.
		@param {object} o The plugin parameter object.
		@return {bool} True if the plugin was registered, false if not.
	*/
	registerPlugin : function ( o ) {
		if ( o === undefined ) return false ;
		
		if ( o.name === undefined ) {
			if ( o.className === undefined ) return false ;
			var x = new window[o.className](); // Class instance to get the name
			o.name = x.name ;
		}
		
		if ( plugins.all[o.name] === undefined ) {
			plugins.all[o.name] = o ;
		} else {
			$.each ( [ 'url' , 'className' ] , function ( k , v ) {
				if ( o[v] === undefined ) return false ;
				if ( plugins.all[o.name][v] === undefined ) plugins.all[o.name][v] = o[v] ;
			} ) ;
		}
//		if ( undefined !== this.deactivated[o.name] ) delete ( this.deactivated[o.name] ) ;
		plugins.setManagePluginDialogHTML() ;
		if ( undefined !== this.deactivated[o.name] ) return false ;
		return true ;
	} ,
	
	
	/**
		Loads a plugin from a URL.
		@param {string} url The URL of the plugin.
	*/
	loadPluginFromURL : function ( url ) {
		var fileref=document.createElement('script') ;
		fileref.setAttribute("type","text/javascript") ;
		fileref.setAttribute("src", url) ;
		var first = document.getElementsByTagName('script')[0];
		first.parentNode.insertBefore(fileref, first);
	} ,
	
	
	/**
		Loads the initial plugins on GENtle launch.
	*/
	loadPlugins : function () {
		if ( plugins.initial_plugins_loaded ) return ; // Only once, my dear
		plugins.initial_plugins_loaded = true ;
		if ( undefined === plugins.load_on_start ) return ;
		$.each ( plugins.load_on_start , function ( k , url ) {
			if ( undefined !== plugins.deactivated[k] ) return ;
			plugins.loadPluginFromURL ( url ) ;
		} ) ;
	} ,
	

	/**
		Removes a plugin.
		@param {string} name The name of the plugin.
	*/
	removePlugin : function ( name ) { // Currently not used
		if ( undefined === plugins.all[name] ) return ;
		
		var sc = gentle.main_sequence_canvas ;
		if ( undefined !== sc ) sc.removePlugin ( name ) ;
		delete plugins.all[name] ;
		
		plugins.setManagePluginDialogHTML() ;
	} ,


	/**
		Deactivates a plugin, without removing it.
		@param {string} name The name of the plugin.
	*/
	deactivatePlugin : function ( name ) {
		if ( undefined === plugins.all[name] ) return ;
		
		var sc = gentle.main_sequence_canvas ;
		if ( undefined !== sc ) sc.removePlugin ( name ) ;
		plugins.deactivated[name] = true ;
		
		plugins.setManagePluginDialogHTML() ;
	} ,

	// INTERFACE METHODS

	/**
		Initializes or updates the plugin dialog box.
	*/
	setManagePluginDialogHTML : function () {
		if ( $('#manage_plugins_dialog').length == 0 ) return ; // Only if there actually is a dialog open
		
		var me = this ;
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
			
			if ( undefined !== me.deactivated[name] ) {
				h += "<td>" ;
				h += "<a href='#' onclick='delete(gentle.plugins.deactivated[\"" + name + "\"]);gentle.plugins.loadPluginFromURL(\"" + o.url + "\");return false'>Activate</a>" ;
				h += "</td>" ;
			} else {
				h += "<td>" ;
				h += "<a href='#' onclick='gentle.plugins.deactivatePlugin(\"" + name + "\");return false'>Deactivate</a>" ;
				h += "</td>" ;
			}
			
			h += "<td>" ;
			if ( o.url === undefined ) h += "Registered without URL, can not load again for next start" ;
			else hadthat[o.url] = 1 ;
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
		
		h += "<div><a target='_blank' href='public/templates/help.html#plugins'>About plugins</a></div>" ;
		
		$('#manage_plugins_dialog').html ( h ) ;
		$('#manage_plugins_dialog').dialog('option', 'position', 'center');
		$('#plugin_url').focus() ;
		
		$('#add_plugin_url_form').submit ( function () {
			var url = $('#plugin_url').val() ;
			plugins.loadPluginFromURL ( url ) ;
			return false ;
		} ) ;
	} ,
	

	/**
		Starts the plugin dialog.
	*/
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

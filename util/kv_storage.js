//________________________________________________________________________________________
/**
	KeyValueStorage class
	@class
	@classdesc This class abstracts localStorage.
*/
function KeyValueStorage ( callback ) {
	this.dbname = 'GENtle' ; // Default : Key-Value-Storage
	this.sname = 'kvps' ; // Default : Key-Value-Pair Storage
}

KeyValueStorage.prototype.hasItem = function ( key , callback ) {
	var me = this ;
	
	if ( undefined === callback ) {
		console.log ( "Missing callback function in KeyValueStorage.getItem for key : " + key ) ;
		return ;
	}

	if ( me.type == 'indexeddb' ) {
		var request = me.indexedDB.db.transaction([me.sname], 'readonly' ).objectStore(me.sname).get(key); // IDBTransaction.READ_ONLY
		
		request.onsuccess = function(event) {
			callback ( undefined !== event.target.result ) ;
//			var row = event.target.result;
//			console.log(row.name + ' is ' + row.years + 'old');
		}
		return ;
	}

	if ( me.type == 'localstorage' ) {
		callback ( undefined !== localStorage.getItem ( key ) ) ;
		return ;
	}
	
	console.log ( "KeyValueStorage not initialized" ) ;
}

KeyValueStorage.prototype.getItem = function ( key , callback ) {
	var me = this ;
	
	if ( undefined === callback ) {
		console.log ( "Missing callback function in KeyValueStorage.getItem for key : " + key ) ;
		return ;
	}

	if ( me.type == 'indexeddb' ) {
		var request = me.indexedDB.db.transaction([me.sname], 'readonly' ).objectStore(me.sname).get(key); // IDBTransaction.READ_ONLY
		
		request.onsuccess = function(event) {
			if ( undefined === event.target.result ) callback ( undefined ) ;
			else callback ( event.target.result.value ) ;
//			console.log ( event.target.result ) ;
		}
		return ;
	}

	if ( me.type == 'localstorage' ) {
		callback ( localStorage.getItem ( key ) ) ;
		return ;
	}

	console.log ( "KeyValueStorage not initialized" ) ;
}

KeyValueStorage.prototype.setItem = function ( key , v , callback ) {
	var me = this ;


	if ( me.type == 'indexeddb' ) {
//		console.log ( "Trying to store " + key + " = " + v ) ;
		var objectStore = me.indexedDB.db.transaction([me.sname], 'readwrite').objectStore(me.sname); // IDBTransaction.READ_WRITE
//		var request = me.indexedDB.db.transaction([me.sname], 'readonly' ).objectStore(me.sname).get(key); // IDBTransaction.READ_ONLY
		var request = objectStore.put({key:key+'', value:v+''});
		
		request.onerror = function () {
			console.log ( "Error while setItem : " + k + " <= " + v ) ;
			if ( undefined !== callback ) callback ( false ) ;
		}
		request.onsuccess = function() {
//		console.log ( "Storage OK!");
			if ( undefined !== callback ) callback ( true ) ;
		}
		return ;
	}


	if ( me.type == 'localstorage' ) {
	console.log ( "OH NO! LOCALSTORAGE!" ) ;
		try {
			localStorage.setItem ( key , v ) ;
		} catch ( e ) {
			alert ( 'Local storage quota exceeded. Changes since last page load will not be stored. Sorry about that.' ) ;
			if ( undefined !== callback ) callback ( false ) ;
			return ;
		}
		if ( undefined !== callback ) callback ( true ) ;
		return ;
	}

	console.log ( "KeyValueStorage not initialized" ) ;
}

KeyValueStorage.prototype.removeItem = function ( key , callback ) {
	var me = this ;
	
	
	if ( me.type == 'indexeddb' ) {
		var request = me.indexedDB.db.transaction([me.sname], 'readwrite' ).objectStore(me.sname).delete(key); // IDBTransaction.READ_WRITE
		request.onsuccess = function () {
			console.log("REMOVE OK!");
			if ( undefined !== callback ) callback() ;
		}
		return ;
	}

	if ( me.type == 'localstorage' ) {
		localStorage.removeItem ( key ) ;
		if ( undefined !== callback ) callback() ;
		return ;
	}
	
	console.log ( "KeyValueStorage not initialized" ) ;
}

KeyValueStorage.prototype.isAvailable = function () {
	return undefined !== me.type ;
}

KeyValueStorage.prototype.initialize = function ( callback ) {
	var me = this ;
	
	// Premium : indexedDB
	var idb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;  
	if ( undefined !== idb ) {
	
		if ('webkitIndexedDB' in window) {
			window.IDBTransaction = window.webkitIDBTransaction;
			window.IDBKeyRange = window.webkitIDBKeyRange;
		}
		me.type = 'indexeddb' ;
		me.indexedDB = { version:1 };
		me.indexedDB.db = null ;
		me.indexedDB.onError = function ( e ) {
			console.log('IndexedDB exception logged: ' + e.value );
		} ;


		var request = idb.open(me.dbname);
		
		request.onupgradeneeded = function(e) {
			console.log("!!");
			var db = e.target.result;
			db.createObjectStore(me.sname, {keyPath: "key"});
		} ;

		request.onsuccess = function(e) {
			var db = me.indexedDB.db = e.target.result;
			console.log("1");

			// set object store if version undefined or changed
			if(me.indexedDB.version != db.version) {
				// set the new version
				console.log("2");
				console.log ( ":" + me.indexedDB.version ) ;
				var verRequest= db.setVersion(me.indexedDB.version);
				
				
				// register failure callback
				verRequest.onfailure = function (e3) { //me.indexedDB.onError;
					console.log ( "ERROR SETVERSION" ) ;
					console.log ( e3 ) ;
				} ;
				
				// create object store in success callback
				verRequest.onsuccess = function(e2) {
					console.log("3");
					console.log ( e2 ) ;
					var x = db.createObjectStore(me.sname, {keyPath: "key"});
					console.log("4");
					console.log ( x ) ;
					console.log ( db ) ;
					
					callback() ;
				};
			} else callback() ;
			

		} ;



		return ;
		
	}
	
	// Common : WebDB
	var webdb = window.openDatabase ;
	if ( undefined !== webdb ) {
	}
	
	// LocalStorage (fallback)
	if ( typeof window.localStorage != 'undefined' ) {
		me.type = 'localstorage' ;
		if ( undefined !== callback ) callback() ;
	}
}

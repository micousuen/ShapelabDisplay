/**
 * @author mrdoob / http://mrdoob.com/
 */

var Config = function () {

	var name = 'threejs-editor';

	var storage = {
		'language': 'en',

		'autosave': true,
		'theme': 'css/light.css',

		'project/title': '',
		'project/editable': false,

		'project/renderer': 'WebGLRenderer',
		'project/renderer/antialias': true,
		'project/renderer/shadows': true,

		'project/vr': false,

		'settings/history': false,

		'settings/shortcuts/translate': 't',
		'settings/shortcuts/rotate': 'r',
		'settings/shortcuts/scale': 's',
		'settings/shortcuts/undo': 'z',
		'settings/shortcuts/focus': 'f',
		'settings/shortcuts/screenshot': 'p',
		'settings/shortcuts/visible': 'v',

		'settings/liveupdate/defaultGroupName': 'fileEntry'
	};

	if ( window.localStorage[ name ] === undefined ) {

		window.localStorage[ name ] = JSON.stringify( storage );

	} else {

		var data = JSON.parse( window.localStorage[ name ] );

		for ( var key in data ) {

			storage[ key ] = data[ key ];

		}

	}

	return {

		getKey: function ( key ) {

			return storage[ key ];

		},

		setKey: function () { // key, value, key, value ...

			for ( var i = 0, l = arguments.length; i < l; i += 2 ) {

				storage[ arguments[ i ] ] = arguments[ i + 1 ];

			}

			window.localStorage[ name ] = JSON.stringify( storage );

			console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved config to LocalStorage.' );

		},

		clear: function () {

			delete window.localStorage[ name ];

		}

	};

};

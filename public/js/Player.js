/**
 * @author mrdoob / http://mrdoob.com/
 */

var Player = function ( editor ) {

	var signals = editor.signals;

	var container = new UI.Panel();
	var VideoRecorder = null;
	container.setId( 'player' );
	container.setPosition( 'absolute' );
	container.setDisplay( 'none' );

	//

	var player = new APP.Player();
	container.dom.appendChild( player.dom );

	window.addEventListener( 'resize', function () {

		player.setSize( container.dom.clientWidth, container.dom.clientHeight );

	} );

	signals.startPlayer.add( function () {

		container.setDisplay( '' );

		player.load( editor.toJSON() );
		player.setSize( container.dom.clientWidth, container.dom.clientHeight );
		player.play();

	} );

	signals.startSceneRecord.add(function() {

		// Create a video recorder
		VideoRecorder = new Whammy.Video(30, 1);
		// Set up scene animation loop. Record current scene at each round, recording speed is around 5 frames/second
		signals.StartSceneAnimation.dispatch(function(renderer){

			// Function get executed in animationLoop, renderer defined in Viewport. 
			VideoRecorder.add(renderer.domElement.toDataURL("image/webp"));
		});

	});

	signals.stopSceneRecord.add(function() {

		// Stop execution of Scene animation loop
		signals.StopSceneAnimation.dispatch();
		// Extract VideoRecorder result and download it if possible
		if (! (VideoRecorder === null)){
			var startTime = new Date().getTime();
			VideoRecorder.compile(false, function(output){
				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', "Finished animation generation, cost time: ", new Date().getTime()-startTime, " ms");
				let download = document.getElementById("animationDownload");
				download.setAttribute('download', 'CanvasAnimation.webm');
				download.setAttribute('href', (window.webkitURL || window.URL).createObjectURL(output));
				VideoRecorder = null;
				download.click();
			});
		}

	});

	signals.startPlayerAndRecord.add( function () {

		container.setDisplay( '' );

		player.load( editor.toJSON() );
		player.setSize( container.dom.clientWidth, container.dom.clientHeight );
		player.playAndRecord();

	} );

	signals.stopPlayer.add( function () {

		container.setDisplay( 'none' );

		player.stop();
		player.dispose();

	} );

	return container;

};

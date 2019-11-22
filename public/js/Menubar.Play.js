/**
 * @author mrdoob / http://mrdoob.com/
 * edited by micousuen
 */

Menubar.Play = function ( editor ) {

	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UI.Panel();
	container.setClass( 'menu' );

	var isPlaying = false;

	var title = new UI.Panel();
	title.setClass( 'title' );
	title.setTextContent( strings.getKey( 'menubar/play' ) );
	container.add(title);
	let titleOnClickEvent = undefined;

	var options = new UI.Panel();
	options.setClass('options');
	container.add(options);


	// Record Scene Option
	var recordSceneOption = new UI.Row();
	recordSceneOption.setClass('option');
	recordSceneOption.setTextContent(strings.getKey('menubar/play/recordScene'));
	recordSceneOption.onClick(function(){
		isPlaying = true;
		signals.startSceneRecord.dispatch();
		console.log("started scene record");
		container.remove(options);

		// Set title text to stop, and bind stop event to it
		title.setTextContent(strings.getKey('menubar/play/stop'));

		// Remove previous onclick event, define new event and then do binding
		if (typeof(titleOnClickEvent) !== "undefined"){
			title.dom.removeEventListener('click', titleOnClickEvent);
		}

		titleOnClickEvent = function(){
			console.log("in record scene stop");
			if (isPlaying === true) {
				isPlaying = false;
				title.setTextContent(strings.getKey('menubar/play/play'));
				signals.stopSceneRecord.dispatch();
				container.add(options);
				title.dom.removeAttribute("onclick")
			}
		};

		title.dom.addEventListener('click', titleOnClickEvent);
	});
	options.add(recordSceneOption);


	// Play Option
	var playOption = new UI.Row();
	playOption.setClass('option');
	playOption.setTextContent(strings.getKey('menubar/play/play'));
	playOption.onClick(function(){
		isPlaying = true;
		signals.startPlayer.dispatch();
		container.remove(options);

		// Set title text to stop, and bind stop event to it
		title.setTextContent(strings.getKey('menubar/play/stop'));

		// Remove previous onclick event, define new event and then do binding
		if (typeof(titleOnClickEvent) !== "undefined"){
			title.dom.removeEventListener('click', titleOnClickEvent);
		}

		titleOnClickEvent = function(){
			console.log("in play stop");
			if (isPlaying === true) {
				isPlaying = false;
				title.setTextContent(strings.getKey('menubar/play/play'));
				signals.stopPlayer.dispatch();
				container.add(options);
				title.dom.removeAttribute("onclick")
			}
		};

		title.dom.addEventListener('click', titleOnClickEvent);
	});
	options.add(playOption);


	// Play and Record option
	var recordOption = new UI.Row();
	recordOption.setClass('option');
	recordOption.setTextContent(strings.getKey('menubar/play/playAndRecord'));
	recordOption.onClick(function(){
		isPlaying = true;
		title.setTextContent(strings.getKey('menubar/play/stop'));
		signals.startPlayerAndRecord.dispatch();
		container.remove(options);

		// Set title text to stop, and bind stop event to it
		title.setTextContent(strings.getKey('menubar/play/stop'));

		// Remove previous onclick event, define new event and then do binding
		if (typeof(titleOnClickEvent) !== "undefined"){
			title.dom.removeEventListener('click', titleOnClickEvent);
		}

		titleOnClickEvent = function(){
			console.log("in play record stop");
			if (isPlaying === true) {
				isPlaying = false;
				title.setTextContent(strings.getKey('menubar/play/play'));
				signals.stopPlayer.dispatch();
				container.add(options);
				title.dom.removeAttribute("onclick")
			}
		};

		title.dom.addEventListener('click', titleOnClickEvent);
	});
	options.add(recordOption);


	return container;

};

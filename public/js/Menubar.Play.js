/**
 * @author mrdoob / http://mrdoob.com/
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

	var options = new UI.Panel();
	options.setClass('options');
	container.add(options);

	var recordSceneOption = new UI.Row();
	recordSceneOption.setClass('option');
	recordSceneOption.setTextContent(strings.getKey('menubar/play/recordScene'));
	recordSceneOption.onClick(function(){
		isPlaying = true;
		title.setTextContent(strings.getKey('menubar/play/stop'));
		signals.startSceneRecord.dispatch();
		container.remove(options);
		title.onClick( function () {
			if (isPlaying === true) {
				isPlaying = false;
				title.setTextContent(strings.getKey('menubar/play/play'));
				signals.stopSceneRecord.dispatch();
				container.add(options);
				title.dom.removeAttribute("onclick")
			}
		} );
	});
	options.add(recordSceneOption);

	var playOption = new UI.Row();
	playOption.setClass('option');
	playOption.setTextContent(strings.getKey('menubar/play/play'));
	playOption.onClick(function(){
		isPlaying = true;
		title.setTextContent(strings.getKey('menubar/play/stop'));
		signals.startPlayer.dispatch();
		container.remove(options);
		title.onClick( function () {
			if (isPlaying === true) {
				isPlaying = false;
				title.setTextContent(strings.getKey('menubar/play/play'));
				signals.stopPlayer.dispatch();
				container.add(options);
				title.dom.removeAttribute("onclick")
			}
		} );
	});
	options.add(playOption);

	var recordOption = new UI.Row();
	recordOption.setClass('option');
	recordOption.setTextContent(strings.getKey('menubar/play/playAndRecord'));
	recordOption.onClick(function(){
		isPlaying = true;
		title.setTextContent(strings.getKey('menubar/play/stop'));
		signals.startPlayerAndRecord.dispatch();
		container.remove(options);
		title.onClick( function () {
			if (isPlaying === true) {
				isPlaying = false;
				title.setTextContent(strings.getKey('menubar/play/play'));
				signals.stopPlayer.dispatch();
				container.add(options);
				title.dom.removeAttribute("onclick")
			}
		} );
	});
	options.add(recordOption);



	return container;

};

// r110

const assets = [
	'./',

	'../images/favicon.ico',

	'/socket.io/socket.io.js',
	'./js/libs/whammy.js',
	'./js/libs/jquery-3.3.1.min.js',
	'./js/libs/threejs/build/three.js',

	'./js/libs/threejs/examples/js/controls/TransformControls.js',

	'./js/libs/threejs/examples/js/libs/chevrotain.min.js',
	'./js/libs/threejs/examples/js/libs/jszip.min.js',
	'./js/libs/threejs/examples/js/libs/inflate.min.js',

	'./js/libs/threejs/examples/js/loaders/AMFLoader.js',
	'./js/libs/threejs/examples/js/loaders/ColladaLoader.js',
	'./js/libs/threejs/examples/js/loaders/DRACOLoader.js',
	'./js/libs/threejs/examples/js/loaders/FBXLoader.js',
	'./js/libs/threejs/examples/js/loaders/GLTFLoader.js',
	'./js/libs/threejs/examples/js/loaders/deprecated/LegacyGLTFLoader.js',
	'./js/libs/threejs/examples/js/loaders/KMZLoader.js',
	'./js/libs/threejs/examples/js/loaders/MD2Loader.js',
	'./js/libs/threejs/examples/js/loaders/OBJLoader.js',
	'./js/libs/threejs/examples/js/loaders/MTLLoader.js',
	'./js/libs/threejs/examples/js/loaders/PLYLoader.js',
	'./js/libs/threejs/examples/js/loaders/STLLoader.js',
	'./js/libs/threejs/examples/js/loaders/SVGLoader.js',
	'./js/libs/threejs/examples/js/loaders/TGALoader.js',
	'./js/libs/threejs/examples/js/loaders/TDSLoader.js',
	'./js/libs/threejs/examples/js/loaders/VRMLLoader.js',
	'./js/libs/threejs/examples/js/loaders/VTKLoader.js',

	'./js/libs/threejs/examples/js/exporters/ColladaExporter.js',
	'./js/libs/threejs/examples/js/exporters/GLTFExporter.js',
	'./js/libs/threejs/examples/js/exporters/OBJExporter.js',
	'./js/libs/threejs/examples/js/exporters/STLExporter.js',

	'./js/libs/threejs/examples/js/renderers/Projector.js',
	'./js/libs/threejs/examples/js/renderers/RaytracingRenderer.js',
	'./js/libs/threejs/examples/js/renderers/SVGRenderer.js',

	'./manifest.json',
	'./images/icon.png',

	'./js/libs/codemirror/codemirror.css',
	'./js/libs/codemirror/theme/monokai.css',

	'./js/libs/codemirror/codemirror.js',
	'./js/libs/codemirror/mode/javascript.js',
	'./js/libs/codemirror/mode/glsl.js',

	'./js/libs/system.min.js',
	'./js/libs/esprima.js',
	'./js/libs/jsonlint.js',
	'./js/libs/glslprep.min.js',

	'./js/libs/codemirror/addon/dialog.css',
	'./js/libs/codemirror/addon/show-hint.css',
	'./js/libs/codemirror/addon/tern.css',

	'./js/libs/codemirror/addon/dialog.js',
	'./js/libs/codemirror/addon/show-hint.js',
	'./js/libs/codemirror/addon/tern.js',
	'./js/libs/acorn/acorn.js',
	'./js/libs/acorn/acorn_loose.js',
	'./js/libs/acorn/walk.js',
	'./js/libs/ternjs/polyfill.js',
	'./js/libs/ternjs/signal.js',
	'./js/libs/ternjs/tern.js',
	'./js/libs/ternjs/def.js',
	'./js/libs/ternjs/comment.js',
	'./js/libs/ternjs/infer.js',
	'./js/libs/ternjs/doc_comment.js',
	'./js/libs/tern-threejs/threejs.js',

	'./js/libs/signals.min.js',
	'./js/libs/ui.js',
	'./js/libs/ui.three.js',

	'./js/libs/html2canvas.js',
	'./js/libs/three.html.js',

	'./js/libs/app.js',
	'./js/Player.js',
	'./js/Script.js',

	'./js/libs/threejs/examples/js/vr/WebVR.js',

	//

	'./css/main.css',

	'./js/EditorControls.js',
	'./js/Storage.js',

	'./js/Editor.js',
	'./js/Communication.js',
	'./js/Config.js',
	'./js/History.js',
	'./js/Loader.js',
	'./js/Menubar.js',
	'./js/Menubar.File.js',
	'./js/Menubar.Edit.js',
	'./js/Menubar.Add.js',
	'./js/Menubar.Play.js',
	// './js/Menubar.View.js',
	'./js/Menubar.Examples.js',
	'./js/Menubar.Help.js',
	'./js/Menubar.Status.js',
	'./js/Sidebar.js',
	'./js/Sidebar.Scene.js',
	'./js/Sidebar.Project.js',
	'./js/Sidebar.Settings.js',
	'./js/Sidebar.Settings.Shortcuts.js',
	'./js/Sidebar.Settings.Viewport.js',
	'./js/Sidebar.Properties.js',
	'./js/Sidebar.Object.js',
	'./js/Sidebar.Geometry.js',
	'./js/Sidebar.Geometry.Geometry.js',
	'./js/Sidebar.Geometry.BufferGeometry.js',
	'./js/Sidebar.Geometry.Modifiers.js',
	'./js/Sidebar.Geometry.BoxGeometry.js',
	'./js/Sidebar.Geometry.CircleGeometry.js',
	'./js/Sidebar.Geometry.CylinderGeometry.js',
	'./js/Sidebar.Geometry.DodecahedronGeometry.js',
	'./js/Sidebar.Geometry.ExtrudeGeometry.js',
	'./js/Sidebar.Geometry.IcosahedronGeometry.js',
	'./js/Sidebar.Geometry.OctahedronGeometry.js',
	'./js/Sidebar.Geometry.PlaneGeometry.js',
	'./js/Sidebar.Geometry.RingGeometry.js',
	'./js/Sidebar.Geometry.SphereGeometry.js',
	'./js/Sidebar.Geometry.ShapeGeometry.js',
	'./js/Sidebar.Geometry.TetrahedronGeometry.js',
	'./js/Sidebar.Geometry.TorusGeometry.js',
	'./js/Sidebar.Geometry.TorusKnotGeometry.js',
	'./js/Sidebar.Geometry.TubeGeometry.js',
	'./js/libs/threejs/examples/js/geometries/TeapotBufferGeometry.js',
	'./js/Sidebar.Geometry.TeapotBufferGeometry.js',
	'./js/Sidebar.Geometry.LatheGeometry.js',
	'./js/Sidebar.Material.js',
	'./js/Sidebar.Animation.js',
	'./js/Sidebar.Script.js',
	'./js/Sidebar.History.js',
	'./js/Strings.js',
	'./js/Toolbar.js',
	'./js/Viewport.js',
	'./js/Viewport.Camera.js',
	'./js/Viewport.Info.js',

	'./js/Command.js',
	'./js/commands/AddObjectCommand.js',
	'./js/commands/RemoveObjectCommand.js',
	'./js/commands/MoveObjectCommand.js',
	'./js/commands/SetPositionCommand.js',
	'./js/commands/SetRotationCommand.js',
	'./js/commands/SetScaleCommand.js',
	'./js/commands/SetValueCommand.js',
	'./js/commands/SetUuidCommand.js',
	'./js/commands/SetColorCommand.js',
	'./js/commands/SetGeometryCommand.js',
	'./js/commands/SetGeometryValueCommand.js',
	'./js/commands/MultiCmdsCommand.js',
	'./js/commands/AddScriptCommand.js',
	'./js/commands/RemoveScriptCommand.js',
	'./js/commands/SetScriptValueCommand.js',
	'./js/commands/SetMaterialCommand.js',
	'./js/commands/SetMaterialColorCommand.js',
	'./js/commands/SetMaterialMapCommand.js',
	'./js/commands/SetMaterialValueCommand.js',
	'./js/commands/SetMaterialVectorCommand.js',
	'./js/commands/SetSceneCommand.js',

	//

	'./examples/arkanoid.app.json',
	'./examples/camera.app.json',
	'./examples/particles.app.json',
	'./examples/pong.app.json',
	'./examples/shaders.app.json'

];

self.addEventListener( 'install', async function () {

	const cache = await caches.open( 'threejs-editor' );

	assets.forEach( function ( asset ) {

		cache.add( asset ).catch( function () {

			console.error( '[SW] Cound\'t cache:', asset );

		} );

	} );

} );

self.addEventListener( 'fetch', async function ( event ) {

	const request = event.request;
	event.respondWith( cacheFirst( request ) );

} );

async function cacheFirst( request ) {

	const cachedResponse = await caches.match( request );

	if ( cachedResponse === undefined ) {

		console.error( '[SW] Not cached:', request.url );
		return fetch( request );

	}

	return cachedResponse;

}

const username = "admin";
const password = "admin";

const DEFAULT_LINE_COLOR = 0x000000;
const DEFAULT_MESH_COLOR = 0x0055ff;
const DEFAULT_POINT_COLOR = 0xff0000;

var Communication = function(editor){

    this.meshParse = new Communication.Mesh(editor);

    // Create new connection to server
    var that = this;
    if (typeof(this.socket) !== "undefined" && "disconnect" in this.socket){
        this.socket.disconnect();
    }
    this.socket = io({'forceNew': true});
    var reconnectOperation = function(){
        if (that.reconnectTimes > 0) {
            setTimeout(function () {
                that.socketConnect()
            }, that.reconnectDelay);
            that.reconnectTimes = that.reconnectTimes - 1;
            console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Info: '+that.reconnectTimes.toString()+' reconnection chance left');
            if (that.reconnectDelay < 60000)
                that.reconnectDelay = that.reconnectDelay * 2;
        }
        else{
            if(that.reconnectTimes === 0)
                if(! alert("Cannot connect to server, click OK to in offline mode..."))
                    console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']',"Info: work in offline mode");
        }
    };
    let wrappedContainer = undefined;


    this.socket.on("authentication", function(callBack){
        callBack({"username":username, "password":password});
    });
    this.socket.on("authenticationSucceed", function(callBack){
        console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', "Info: Connected to server");
        that.reconnectTimes = that.reconnectTimesLimit;
        that.reconnectDelay = 5000; // reset reconnection if succeed in authentication
    });
    this.socket.on("disconnect", function(reason){
        console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', "Warning: Disconnected with server because <",reason,">, reconnecting...");
    });
    this.socket.on("authenticationFailed", function(callBack){
        console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', "Error: Failed in socket authentication, retrying...");
        reconnectOperation();
    });
    this.socket.on("fileEntryModelUpdate", function(data, callBack){that.processFileEntryUpdate(editor, data, callBack)});

    // Bind signal events
    var timeout;
    editor.signals.sendScene.add(function(scene){
        clearTimeout(timeout);
        timeout = setTimeout(function(){
							        editor.signals.sendSceneStarted.dispatch();
							        timeout = setTimeout(function(){
							            communication.sendScene( editor );
							        	editor.signals.sendSceneFinished.dispatch();
									}, 100);
								}, 1000);
    });
    editor.signals.loadScene.add(function(){that.loadScene(editor)});
    editor.signals.clearScene.add(function(){editor.clear()});
};

Communication.prototype = {
    socket: undefined,
    reconnectDelay:  5000,
    reconnectTimesLimit:  10,
    reconenctTimes: 10,
    fileEntryContainer: undefined,
    log: function(...log){
        log_strings = new Array(log.length).fill("").map((x, i) => String(log[i]));
        console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', log_strings.join(""))
    },
    sendScene: function(editor){
        var start = performance.now();
        let editorJSONstring = JSON.stringify(editor.toJSON());
        let dataToSend = {
            editor: editorJSONstring,
            username: username,
            password: password};
        $.ajax({url: "api/save_data/editor", method: "POST", dataType:"text",
            data: dataToSend,
            success: function(result){
                console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Sent data to Server. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
                },
            error: function(result){
                console.log(result);
            }});
    },
    loadScene: function(editor, failureCallBack, successCallBack){
        let that = this;
        var start = performance.now();
        var editorRequest = $.ajax({url: "api/load_data/editor", method: "GET",
            data: {
                username: username,
                password: password
            }});
        editorRequest.done(function(msg){
            console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Load editor data from Server. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
            // Clear editor scene and load editor from result
            editor.clear();
            editor.fromJSON(JSON.parse(msg));
            if (typeof(successCallBack) === "function"){
                successCallBack();
            }
        });
        editorRequest.fail(function(jqXHR, textStatus){
            console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', "Error: Cannot load data from server "+textStatus);
            if (typeof(failureCallBack) === "function"){
                failureCallBack();
            }
        });
    },

    loadLatestLiveupdate: function(editor, failureCallBack, successCallBack){
        let that = this;
        let start = performance.now();
        var editorRequest = $.ajax({url: "api/load_data/liveupdate", method: "GET",
            data: {
                username: username,
                password: password
            }});
        editorRequest.done(function(msg){
            console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Load editor data from Server. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
            // load live update
            that.processFileEntryUpdate(editor, msg);
            if (typeof(successCallBack) === "function"){
                successCallBack();
            }
        });
        editorRequest.fail(function(jqXHR, textStatus){
            console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', "Error: Cannot load data from server "+textStatus);
            if (typeof(failureCallBack) === "function"){
                failureCallBack();
            }
        });
    },
    applyTransformToContainer : function(container, transformList){
        let that = this;
        for (let index in transformList){
            let transformDict = transformList[index];
            if ("translate" in transformDict){
                let translate_coord = transformDict["translate"];
                if (translate_coord.length == 3){
                    container.position.x += translate_coord[0];
                    container.position.y += translate_coord[1];
                    container.position.z += translate_coord[2];
                }
                else{
                    that.log("Incorrect translate format")
                }
            }
            // Order of rotation is controlled by rotation.order, has nothing related to these three orders
            if ("rotateX" in transformDict){
                container.rotation.x = transformDict["rotateX"];
            }
            if ("rotateY" in transformDict){
                container.rotation.y = transformDict["rotateY"];
            }
            if ("rotateZ" in transformDict){
                container.rotation.z = transformDict["rotateZ"];
            }
            container.rotation.order = "ZYX";
        }
        return container
    },
    processFileEntryUpdate: function(editor, data, callBack){
        let that = this;
        let modelFiles = undefined;
        let groupName = editor.config.getKey("settings/liveupdate/defaultGroupName");
        let wrappedContainer = new THREE.Group();

        // Parse fileEntryModel
        try{
            modelFiles = JSON.parse(data);
            console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']',"Info: Received models size: ", data.length, ", patches: ", modelFiles.length);
        }
        catch(err){
            console.log("Error: cannot parse fileEntryModelUpdate, data or format error: ", err);
            throw "Error!";
        }

        // Based on file type (get from fileName), parse it and add to scene
        for (let modelFileIndex in modelFiles){
            let modelFile = modelFiles[modelFileIndex];
            if ("geometryType" in modelFile){
                let container = that.meshParse.addGeometryObjects(modelFile);
                if (typeof(container) !== "undefined"){
                    wrappedContainer.add(container);
                }
            }
            else if ("fileName" in modelFile) {
                let container = that.meshParse.addModelFile(modelFile);
                if (typeof(container) !== "undefined"){
                    wrappedContainer.add(container);
                }
            }

            // Set up group properties if exist
            // Won't handle multiple group properties
            if ("GroupProperties" in modelFile){
                if ("GroupName" in modelFile["GroupProperties"]){
                    groupName = modelFile["GroupProperties"]["GroupName"];
                }
            }
        }

        wrappedContainer.name = groupName;
        // Only one group name allowed in scene, so remove old one if already defined
        // editor.removeObjectByName(editor.config.getKey("settings/liveupdate/defaultGroupName")); // Old version, didn't support history
        let object_to_remove = editor.scene.getObjectByName(groupName);
        if (typeof(object_to_remove) !== "undefined"){
            editor.execute(new RemoveObjectCommand(editor, object_to_remove));
        }

        // Add wrappedContainer to scene
        that.fileEntryContainer = wrappedContainer;
        editor.execute(new AddObjectCommand(editor, wrappedContainer));

    }
};

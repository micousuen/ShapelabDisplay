const username = "admin";
const password = "admin";

var Communication = function(){
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
    sendStatus: function(editor){
        var start = performance.now();
        let editorJSONstring = JSON.stringify(editor.toJSON());
        let dataToSend = {
            editor: editorJSONstring,
            username: username,
            password: password};
        $.ajax({url: "api/save_data", method: "POST", dataType:"text",
            data: dataToSend,
            success: function(result){
                console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Sent data to Server. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
                },
            error: function(result){
                console.log(result);
            }});
    },
    loadScene: function(editor, failureCallBack, successCallBack){
        var start = performance.now();
        var request = $.ajax({url: "api/load_data", method: "GET",
            data: {
                username: username,
                password: password
            }});
        request.done(function(msg){
            console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Load data from Server. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
            editor.clear();
            editor.fromJSON(JSON.parse(msg));
            if (typeof(successCallBack) === "function"){
                successCallBack();
            }
        });
        request.fail(function(jqXHR, textStatus){
           console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', "Error: Cannot load data from server "+textStatus);
           if (typeof(failureCallBack) === "function"){
               failureCallBack();
           }
        });
    },
    applyTransformToContainer : function(container, transformList){
        for (let index in transformList){
            let transformDict = transformList[index];
            if ("translate" in transformDict){
                let translate_coord = transformDict["translate"];
                if (translate_coord.length == 3){
                    container.translateX(translate_coord[0]);
                    container.translateY(translate_coord[1]);
                    container.translateZ(translate_coord[2]);
                }
                else{
                    that.log("Incorrect translate format")
                }
            }
            if ("rotateX" in transformDict){
                container.rotateX(transformDict["rotateX"])
            }
            if ("rotateY" in transformDict){
                container.rotateY(transformDict["rotateY"])
            }
            if ("rotateZ" in transformDict){
                container.rotateZ(transformDict["rotateZ"])
            }
        }
        return container
    },
    socketConnect : function(editor){
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
        this.socket.on("fileEntryModelUpdate", function(data, callBack){
            let modelFiles = undefined;
            wrappedContainer = new THREE.Group();
            wrappedContainer.name = "fileEntry";

            // Parse fileEntryModel, and check validation
            try{
                modelFiles = JSON.parse(data);
                // Traverse modelFiles, check validation
                for (let modelFileIndex in modelFiles){
                    let modelFile = modelFiles[modelFileIndex];
                    if ((! "fileName" in modelFile) || (! "fileData" in modelFile)){
                        throw "fileEntryModeUpdate format error"
                    }
                }
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']',"Info: Received models size: ", data.length, ", patches: ", modelFiles.length);
            }
            catch(err){
                console.log("Error: cannot parse fileEntryModelUpdate data or format error: ", err);
                throw "Error!";
            }


            // Only one fileEntry allowed in scene, so remove old one if already defined
            editor.removeObjectByName("fileEntry", editor.scene); // This will remove all object with name fileEntry under scene, be careful.
            // Based on file type (get from fileName), parse it and add to scene
            for (let modelFileIndex in modelFiles){
                let modelFile = modelFiles[modelFileIndex];
                let container = null;
                switch (modelFile.fileName.slice((modelFile.fileName.lastIndexOf(".")-1 >>> 0) + 2)){
                    case "obj":
                        // Load model to container
                        container = new THREE.OBJLoader().parse(modelFile.fileData);
                        container.name = modelFile.fileName;

                        // If configuration exist, set model to that configuration
                        if ("fileConfiguration" in modelFile){
                            container = that.applyTransformToContainer(container, modelFile.fileConfiguration)
                        }
                        wrappedContainer.add(container);
                        break;
                    case "ply":
                        // Load model to container
                        let loadTimeBefore = new Date().getTime();
                        let geometry = new THREE.PLYLoader().parse(modelFile.fileData);
                        var material = new THREE.MeshStandardMaterial({color: 0x0055ff, flatShading: true});
                        geometry.computeVertexNormals();
                        container = new THREE.Mesh(geometry, material);
                        console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']',"Info: cost: ", new Date().getTime() - loadTimeBefore, " ms in loading PLY model");
                        container.name = modelFile.fileName;

                        // If configuration exist, set model to that configuration
                        if ("fileConfiguration" in modelFile){
                            container = that.applyTransformToContainer(container, modelFile.fileConfiguration)
                        }
                        wrappedContainer.add(container);
                        break;
                    default:
                        console.log("Error: fileEntryFormat not implemented or error")
                }
            }
            // Add wrappedContainer to scene
            that.fileEntryContainer = wrappedContainer;
            editor.addObject(wrappedContainer);
        });
    }
};

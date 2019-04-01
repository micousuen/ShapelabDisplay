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
        $.ajax({url: "api/save_data/editor", method: "POST", dataType:"text",
            data: dataToSend,
            success: function(result){
                console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Sent data to Server. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
                },
            error: function(result){
                console.log(result);
            }});
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
    applyTransformToContainer : function(container, transformList){
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
        this.socket.on("fileEntryModelUpdate", function(data, callBack){that.processFileEntryUpdate(editor, data, callBack)});
    },
    processFileEntryUpdate: function(editor, data, callBack){
        let that = this;
        let modelFiles = undefined;
        wrappedContainer = new THREE.Group();
        wrappedContainer.name = editor.config.getKey("settings/liveupdate/defaultGroupName");

        // Parse fileEntryModel
        try{
            modelFiles = JSON.parse(data);
            console.log('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']',"Info: Received models size: ", data.length, ", patches: ", modelFiles.length);
        }
        catch(err){
            console.log("Error: cannot parse fileEntryModelUpdate, data or format error: ", err);
            throw "Error!";
        }


        // Only one fileEntry allowed in scene, so remove old one if already defined
        editor.removeObjectByName(editor.config.getKey("settings/liveupdate/defaultGroupName"), editor.scene); // This will remove all object with name fileEntry under scene, be careful.
        // Based on file type (get from fileName), parse it and add to scene
        for (let modelFileIndex in modelFiles){
            let modelFile = modelFiles[modelFileIndex];
            if ("geometryType" in modelFile){
                let container = that.addGeometryObjects(modelFile);
                if (typeof(container) !== "undefined"){
                    wrappedContainer.add(container);
                }
            }
            if ("fileName" in modelFile) {
                let container = that.addModelFile(modelFile);
                if (typeof(container) !== "undefined"){
                    wrappedContainer.add(container);
                }
            }
        }
        // Add wrappedContainer to scene
        that.fileEntryContainer = wrappedContainer;
        editor.addObject(wrappedContainer);
    },
    addModelFile: function(modelFile){
        let that = this;

        if ((! "fileName" in modelFile) || (! "fileData" in modelFile)){
            console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', "Error: fileEntry modelFile format error");
            return undefined;
        }

        let container = null, defaultMeshColor = 0x0055ff, material=null;
        switch (modelFile.fileName.slice((modelFile.fileName.lastIndexOf(".") - 1 >>> 0) + 2)) {
            case "obj":
                // Load model to container
                container = new THREE.OBJLoader().parse(modelFile.fileData);
                container.name = modelFile.fileName;
                if ("color" in modelFile){
                    defaultMeshColor = modelFile["color"];
                }
                material = new THREE.MeshPhongMaterial({color: defaultMeshColor});


                // If configuration exist, set model to that configuration
                if ("configuration" in modelFile) {
                    container = that.applyTransformToContainer(container, modelFile.configuration)
                }
                else if ("fileConfiguration" in modelFile){
                    container = that.applyTransformToContainer(container, modelFile.configuration)
                }

                // Set material for all objs
                for (let index in container.children){
                    container.children[index].material = material;
                }
                return container;
                break;
            case "ply":
                // Load model to container
                let loadTimeBefore = new Date().getTime();
                let geometry = new THREE.PLYLoader().parse(modelFile.fileData);
                if ("color" in modelFile){
                    defaultMeshColor = modelFile["color"];
                }
                material = new THREE.MeshPhongMaterial({color: defaultMeshColor});

                // Set up geometry and compute normals for display
                geometry.computeVertexNormals();
                container = new THREE.Mesh(geometry, material);
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', "Info: cost: ", new Date().getTime() - loadTimeBefore, " ms in loading PLY model");
                container.name = modelFile.fileName;

                // If configuration exist, set model to that configuration
                if ("configuration" in modelFile) {
                    container = that.applyTransformToContainer(container, modelFile.configuration)
                }
                else if ("fileConfiguration" in modelFile){
                    container = that.applyTransformToContainer(container, modelFile.configuration)
                }
                return container;
                break;
            default:
                console.log("Error: fileEntryFormat not implemented or wrong data");
                return undefined;
        }
    },
    addGeometryObjects: function(modelFile){
        let that = this;
        if ((! "geometryType" in modelFile) || (! "geometryData" in modelFile)){
            console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', "Error: fileEntry modelFile format error");
            return undefined;
        }

        function geometryDataValidation(geometryData){
            let vd = geometryData;
            for (let index in vd){
                if (vd[index].length !== 3 && vd[index].length !== 2){
                    console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', "Error: geometryData error, illegal vertex length");
                    return false;
                }
            }
            return true;
        }

        let container=null, vd=null, material=null, geometry=null, vertices=null;
        let defaultLineColor = 0x000000;
        switch (true){
            case ["lines", "lineSegments", "lineSegmentPairs"].includes(modelFile["geometryType"]):
                // Validation checking
                vd = modelFile["geometryData"];
                if (! geometryDataValidation(vd)){
                    return undefined;
                }

                // Create line geometry between consecutive pair of vertices, won't draw from last point to first point
                geometry = new THREE.BufferGeometry();
                vertices = [];
                for (let index in vd){
                    switch(modelFile["geometryType"]){
                        case "lines":
                        case "lineSegments":
                            vertices.push(vd[index][0], vd[index][1], typeof(vd[index][2]) !== "undefined" ? vd[index][2] : 0);
                            break;
                        case "lineSegmentPairs":
                            vertices.push(vd[index][0][0], vd[index][0][1], typeof(vd[index][0][2]) !== "undefined" ? vd[index][0][2] : 0);
                            vertices.push(vd[index][1][0], vd[index][1][1], typeof(vd[index][1][2]) !== "undefined" ? vd[index][1][2] : 0);
                            break;
                    }
                }
                geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

                // Set up Line Color and material
                if ("color" in modelFile){
                    defaultLineColor = modelFile["color"];
                }
                material = new THREE.LineBasicMaterial({color: defaultLineColor});


                // Create container for lines
                switch(modelFile["geometryType"]){
                    case "lines":
                        container = new THREE.Line(geometry, material);
                        break;
                    case "lineSegments":
                    case "lineSegmentPairs":
                        container = new THREE.LineSegments(geometry, material);
                        break;
                }

                if ("geometryName" in modelFile){
                    container.name = modelFile["geometryName"];
                }
                else{
                    container.name = modelFile["geometryType"];
                }

                // If configuration exist, set model to that configuration
                if ("configuration" in modelFile) {
                    container = that.applyTransformToContainer(container, modelFile.configuration)
                }

                return container;
                break;
            case true:
            default:
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', "Error: GeometryFormat not implemented or wrong data");
                console.log(modelFile);
                return undefined;
        }
    }
};

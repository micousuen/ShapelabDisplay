const username = "admin";
const password = "admin";

const DEFAULT_LINE_COLOR = 0x000000;
const DEFAULT_MESH_COLOR = 0x0055ff;
const DEFAULT_POINT_COLOR = 0xff0000;

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
        let wrappedContainer = new THREE.Group();
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
        // editor.removeObjectByName(editor.config.getKey("settings/liveupdate/defaultGroupName")); // Old version, didn't support history
        editor.execute(new RemoveObjectCommand(editor.scene.getObjectByName(editor.config.getKey("settings/liveupdate/defaultGroupName"))));


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
        editor.execute(new AddObjectCommand(wrappedContainer));
    },
    create_material: function(materialSettings, default_color, default_opacity, enable_vertex_color, material_type){
        // Set up color to default color or color in modelSettings
        let gcolor = 0x0055ff;
        if (typeof(default_color) !== "undefined"){
            gcolor = default_color;
        }
        if ("color" in materialSettings && (! isNaN(materialSettings["color"]))){
            gcolor = materialSettings["color"];
        }

        // Set up opacity
        let opacity = 1.0;
        if (! isNaN(default_opacity)){
            opacity = Math.min(1, Math.max(0, default_opacity));
        }
        if ("opacity" in materialSettings && (! isNaN(materialSettings["opacity"]))){
            opacity = Math.min(1, Math.max(0, materialSettings["opacity"]));
        }

        // Set up attributes for new materials
        let material_dict = {};
        material_dict["side"]=THREE.DoubleSide;
        if (enable_vertex_color){
            material_dict["vertexColors"]=THREE.VertexColors;
        }
        else{
            material_dict["color"]=gcolor;
        }
        if ("opacity" in materialSettings && (! isNaN(materialSettings["opacity"]))) {
            material_dict["opacity"]=opacity;
            material_dict["transparent"]=true;
        }

        // create new material
        if (typeof(material_type) !== "undefined"){
            return new material_type(material_dict);
        }
        else{
            return new THREE.MeshBasicMaterial(material_dict);
        }
    },
    addModelFile: function(modelFile){
        let that = this;

        if ((! "fileName" in modelFile) || (! "fileData" in modelFile)){
            console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', "Error: fileEntry modelFile format error");
            return undefined;
        }

        let container = null, material=null;

        // Create material for mesh
        material = that.create_material(modelFile, DEFAULT_MESH_COLOR, 1.0, false, THREE.MeshPhongMaterial);

        // Load model data based on model type
        switch (modelFile.fileName.slice((modelFile.fileName.lastIndexOf(".") - 1 >>> 0) + 2)) {
            case "obj":
                // Load model to container
                container = new THREE.OBJLoader().parse(modelFile.fileData);
                container.name = modelFile.fileName;
                break;
            case "ply":
                // Load model to container
                let loadTimeBefore = new Date().getTime();
                let geometry = new THREE.PLYLoader().parse(modelFile.fileData);

                // Set up geometry and compute normals for display
                geometry.computeVertexNormals();
                container = new THREE.Mesh(geometry, material);
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', "Info: cost: ", new Date().getTime() - loadTimeBefore, " ms in loading PLY model");
                container.name = modelFile.fileName;
                break;
            default:
                console.log("Error: fileEntryFormat not implemented or wrong data");
                return undefined;
        }
        // If configuration exist, set model to that configuration
        if ("configuration" in modelFile) {
            container = that.applyTransformToContainer(container, modelFile.configuration)
        }

        // Set material for all objs
        container.material = material;
        for (let index in container.children){
            container.children[index].material = material;
        }

        return container;
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

        let container=null, vd=null, material=null, geometry=null, vertices=null, colors=null;
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
                colors = [];
                for (let index=0; index < vd.length; index++){
                    switch(modelFile["geometryType"]){
                        case "lines":
                            vertices.push(vd[index][0], vd[index][1], typeof(vd[index][2]) !== "undefined" ? vd[index][2] : 0);
                            // If line gradient color given, then use this color
                            if (Array.isArray(modelFile["color"])){
                                if (modelFile["color"].length === 2){
                                    let c0 = new THREE.Color();
                                    c0.set(modelFile["color"][0]);
                                    let c1 = new THREE.Color();
                                    c1.set(modelFile["color"][1]);
                                    let colorDiff = [c1.r-c0.r, c1.g-c0.g, c1.b-c0.b].map(x => x / (vd.length - 1));
                                    colors.push(c0.r+colorDiff[0]*index, c0.g+colorDiff[1]*index, c0.b+colorDiff[2]*index);
                                }
                                else{
                                    let pc = new THREE.Color();
                                    pc.set(modelFile["color"][index % modelFile["color"].length]);
                                    colors.push(pc.r, pc.g, pc.b);
                                }
                            }
                            break;
                        case "lineSegments":
                            vertices.push(vd[index][0], vd[index][1], typeof(vd[index][2]) !== "undefined" ? vd[index][2] : 0);
                            // If line gradient color given, then use this color
                            if (Array.isArray(modelFile["color"])){
                                if (modelFile["color"].length === 2 && (! (isNaN(modelFile["color"][0]))) && (! (isNaN(modelFile["color"][1])))){
                                        let p1c = new THREE.Color();
                                        p1c.set(modelFile["color"][index % 2]);
                                        colors.push(p1c.r, p1c.g, p1c.b);
                                }
                                else{
                                    let pc = new THREE.Color();
                                    pc.set(modelFile["color"][index % modelFile["color"].length]);
                                    colors.push(pc.r, pc.g, pc.b);
                                }
                            }
                            break;
                        case "lineSegmentPairs":
                            vertices.push(vd[index][0][0], vd[index][0][1], typeof(vd[index][0][2]) !== "undefined" ? vd[index][0][2] : 0);
                            vertices.push(vd[index][1][0], vd[index][1][1], typeof(vd[index][1][2]) !== "undefined" ? vd[index][1][2] : 0);
                            // If line gradient color given, then use this color
                            if (Array.isArray(modelFile["color"])){
                                if (modelFile["color"].length === 2 && (! (isNaN(modelFile["color"][0]))) && (! (isNaN(modelFile["color"][1])))){
                                    let p0c = new THREE.Color(), p1c = new THREE.Color();
                                    p0c.set(modelFile["color"][0]);
                                    p1c.set(modelFile["color"][1]);
                                    colors.push(p0c.r, p0c.g, p0c.b, p1c.r, p1c.g, p1c.b);
                                }
                                else {
                                    if (Array.isArray(modelFile["color"][index % modelFile["color"].length])){
                                        let p0c = new THREE.Color();
                                        p0c.set(modelFile["color"][index % modelFile["color"].length][0]);
                                        let p1c = new THREE.Color();
                                        p1c.set(modelFile["color"][index % modelFile["color"].length][1]);
                                        colors.push(p0c.r, p0c.g, p0c.b, p1c.r, p1c.g, p1c.b);
                                    }
                                    else{
                                        throw "Error: color and line segment pairs don't match"
                                    }
                                }

                            }
                            break;
                    }
                }
                geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
                if (colors.length === vertices.length){
                    geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                }

                // Set up Line Color and material
                material = that.create_material(modelFile, DEFAULT_LINE_COLOR, 1.0, Array.isArray(modelFile["color"]), THREE.LineBasicMaterial);

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

                break;
            case ["triangles", "triangleOnesides", "trianglePairs"].includes(modelFile["geometryType"]):
                // Validation checking
                vd = modelFile["geometryData"];
                if ((! geometryDataValidation(vd))){
                    return undefined;
                }

                // Create triangles
                geometry = new THREE.BufferGeometry();
                vertices = [];
                colors = [];
                // Set up triangle position and vertex color
                switch (modelFile["geometryType"]){
                    case "triangles":
                        for (let index = 0; index < vd.length ; index++){
                            vertices.push(vd[index][0], vd[index][1], typeof(vd[index][2]) !== "undefined" ? vd[index][2] : 0);
                            if (Array.isArray(modelFile["color"])){
                                let pc = new THREE.Color();
                                pc.set(modelFile["color"][index % modelFile["color"].length]);
                                colors.push(pc.r, pc.g, pc.b);
                            }
                        }
                        break;
                    case "triangleOnesides":
                        for (let index = 0; index < vd.length ; index++){
                            vertices.push(vd[index][0], vd[index][1], typeof(vd[index][2]) !== "undefined" ? vd[index][2] : 0);
                            if (Array.isArray(modelFile["color"])){
                                let pc = new THREE.Color();
                                pc.set(modelFile["color"][index % modelFile["color"].length]);
                                colors.push(pc.r, pc.g, pc.b);
                            }
                        }
                        break;
                    case "trianglePairs":
                        for (let index=0; index < vd.length; index++){
                            vertices.push(vd[index][0][0], vd[index][0][1], typeof(vd[index][0][2]) !== "undefined" ? vd[index][0][2] : 0);
                            vertices.push(vd[index][1][0], vd[index][1][1], typeof(vd[index][1][2]) !== "undefined" ? vd[index][1][2] : 0);
                            vertices.push(vd[index][2][0], vd[index][2][1], typeof(vd[index][2][2]) !== "undefined" ? vd[index][2][2] : 0);
                            if (Array.isArray(modelFile["color"]) && modelFile["color"].length === vd.length){
                                if (! Array.isArray(modelFile["color"][index])){
                                    console.log("Error: Incorrect color format, use default black");
                                    let pc = new THREE.Color();
                                    pc.set(0x000000);
                                    let c = [pc.r, pc.g, pc.b];
                                    colors.push(...c, ...c, ...c, ...c, ...c, ...c);
                                }
                                let p0c = new THREE.Color(), p1c = new THREE.Color(), p2c = new THREE.Color();
                                p0c.set(modelFile["color"][index][0]); let p0cA = [p0c.r, p0c.g, p0c.b];
                                p1c.set(modelFile["color"][index][1]); let p1cA = [p1c.r, p1c.g, p1c.b];
                                p2c.set(modelFile["color"][index][2]); let p2cA = [p2c.r, p2c.g, p2c.b];
                                colors.push(...p0cA, ...p1cA, ...p2cA);
                            }
                        }
                        break;
                    default:
                        break;
                }
                geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

                material = that.create_material(modelFile, DEFAULT_MESH_COLOR, 1.0, Array.isArray(modelFile["color"]), THREE.MeshBasicMaterial);

                container = new THREE.Mesh(geometry, material);

                break;
            case ["point"].includes(modelFile["geometryType"]):
                geometry = new THREE.SphereGeometry(typeof(modelFile["geometryData"][3]) === "undefined" ? 0.1 : modelFile["geometryData"][3], 8, 6);

                // Set up Line Color and material
                material = that.create_material(modelFile, DEFAULT_POINT_COLOR, 1.0, Array.isArray(modelFile["color"]), THREE.MeshBasicMaterial);

                container = new THREE.Mesh(geometry, material);

                // Set up point position
                container.position.set(modelFile["geometryData"][0], modelFile["geometryData"][1], typeof(modelFile["geometryData"][2]) === "undefined" ? 0 : modelFile["geometryData"][2]);

                break;
            case ["polygon"].includes(modelFile["geometryType"]):
                let temp_geometry = new THREE.Geometry();
                vertices = [];
                let holes = [];

                if ("geometryData" in modelFile){
                    let polygonData = modelFile["geometryData"];
                    for (let p_index in polygonData){
                        // Only 2D data will be allowed to push into vertices.
                        // If we have 3D data, then check if they are on same plane, and apply rotation to make it lie on xy plane
                        if(polygonData[p_index].length === 2){
                            vertices.push(new THREE.Vector2(polygonData[p_index][0], polygonData[p_index][1]));
                            temp_geometry.vertices.push(new THREE.Vector3(polygonData[p_index][0], polygonData[p_index][1], 0));
                        }
                        else if (polygonData[p_index].length === 3){
                            console.log("Polygon 3D not implemented yet. ")
                        }
                    }
                }
                // holes part not finished, need to learn more about holes type.
                // if ("holes" in modelFile){
                //     let holesData = modelFile["holes"];
                //     for (let p_index in holesData){
                //         // Only 2D data will be allowed to push into holes.
                //         // If we have 3D data, then check if they are on same plane, and apply rotation to make it lie on xy plane
                //         if(holesData[p_index].length === 2){
                //             holes.push(new THREE.Vector2(holesData[p_index][0], holesData[p_index][1]));
                //         }
                //     }
                // }

                let triangle_faces = THREE.ShapeUtils.triangulateShape(vertices, holes);
                for (let i = 0 ; i < triangle_faces.length; i++){
                    // Set up vertices positions
                    let face = new THREE.Face3(triangle_faces[i][0], triangle_faces[i][1], triangle_faces[i][2]);
                    // Set up vertices colors
                    if (Array.isArray(modelFile["color"])) {
                        let pc1 = new THREE.Color(), pc2 = new THREE.Color(), pc3 = new THREE.Color();
                        pc1.set(modelFile["color"][triangle_faces[i][0] % modelFile["color"].length]);
                        pc2.set(modelFile["color"][triangle_faces[i][1] % modelFile["color"].length]);
                        pc3.set(modelFile["color"][triangle_faces[i][2] % modelFile["color"].length]);
                        face.vertexColors = [pc1, pc2, pc3];
                    }
                    // Add face to geometry
                    temp_geometry.faces.push(face);
                }

                material = that.create_material(modelFile, DEFAULT_MESH_COLOR, 1.0, Array.isArray(modelFile["color"]), THREE.MeshBasicMaterial);

                geometry = new THREE.BufferGeometry().fromGeometry(temp_geometry);

                container = new THREE.Mesh(geometry, material);

                break;
            case true:
            default:
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', "Error: GeometryFormat not implemented or wrong data");
                console.log(modelFile);
                return undefined;
        }
        // Set up name
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
    }
};

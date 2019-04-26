var mongoose = require("mongoose");

// Database username and password, if not given, then these are used by default
var DBusername = "shapelab";
var DBpassword = "shapelab";
var DBaddress = "localhost";
var DBport = 27017;
var DBname = "shapelab";
var DBauthenticationdb = "shapelab";

// The database uri
var DBurl = 'mongodb://'+DBusername.toString()+':'+DBpassword.toString()+'@'+DBaddress.toString()+':'+DBport.toString()+'/'+DBname.toString()+'?authSource='+DBauthenticationdb;

// Create Schema, for database connection
var userListSchema = new mongoose.Schema({
    "username" : String,
    "password" : String,
    "role" : String
});
var dataIndexSchema = new mongoose.Schema({
    "epochTime": Number,
    "dataType": String,
    "dataPatches": Number
});
var dataSchema = new mongoose.Schema({
    "epochTime": Number, // get from ((new Date()).getTime()), with milliseconds
    "dataType": String, // "editor" or others
    "data": String, // Data slice
    "dataIndex": Number
});

module.exports = {
    // Some public parameters
    schema: {
        'userList': userListSchema,
        'dataIndex': dataIndexSchema,
        'data': dataSchema
    },
    databaseReconnectTime : 1000,
    databaseCollectionMaximumRecords: 1000,
    conns : {},
    models: {},

    // Chunk long string
    chunkLongString: function(str, size){
        // Return: Array of strings with each not exceeding size
        const numChunks = Math.ceil(str.length/size);
        const chunks = new Array(numChunks);
        for(let i = 0, o=0; i<numChunks; i++, o=o+size){
            chunks[i] = str.substr(o, size);
        }
        return chunks;
    },

    // Get called when successfully connected to database
    dbConnectCallback: function(that, forWhat){
        that.databaseReconnectTime = 1000;
        console.log("Info: <", forWhat, "> database Connected");
    },

    // Executed when error occur in connecting database. Keep callback itself if keeps failing
    dbReconnectCallback: function(that, forWhat){
        console.log("Error: <", forWhat, "> Cannot connect to database, retry in "+(that.databaseReconnectTime/1000).toString(10)+" seconds");
        setTimeout(function(){
            if (that.databaseReconnectTime < 64000) {
                that.databaseReconnectTime = that.databaseReconnectTime * 2;
            }
            that.conns["base"].close();
            that.conns["base"] = mongoose.createConnection(DBurl, {useNewUrlParser: true});
            that.conns["base"].on('error', function(err){console.log("Warning: Cannot connect to database because ",err); that.dbReconnectCallback(that, forWhat)});
            that.conns["base"].on('connected', function(){that.dbConnectCallback(that, forWhat)});
        }, that.databaseReconnectTime)
    },

    // The base connection to our database. This should be done first before all other operation
    connect: function(forWhat, mongoServer = DBaddress, mongoPort = DBport, mongoAuthDB = DBauthenticationdb, mongoUsername = DBusername, mongoPassword = DBpassword){
        DBurl = 'mongodb://'+mongoUsername.toString()+':'+mongoPassword.toString()+'@'+mongoServer.toString()+':'+mongoPort.toString()+'/'+DBname.toString()+'?authSource='+mongoAuthDB;
        var that = this; // Used to transfer current owner object
        var buildBaseConnection = function(){
            // Connect to database, mangoose will automatically reconnect if disconnected. Handle reconnection if error occur here
            // When using createConnection to build connection, replace mongoose.model with conn.model (conn is the return value of createConnection)
            that.conns["base"] = mongoose.createConnection(DBurl, {useNewUrlParser: true});
            that.conns["base"].on('error', function(err){console.log("Warning: Cannot connect to database because ",err); that.dbReconnectCallback(that, forWhat)});
            that.conns["base"].on('connected', function(){that.dbConnectCallback(that, forWhat)});
            // Connect to userList collection and save model. This is required
            that.models["base"] = that.conns["base"].model('userList', that.schema.userList, 'userList'); // Build model for collection 'userList'
        };

        // If this connection been called multiple times, only reconnect base connection when base not connected
        if (typeof(this.conns) !== "undefined" && typeof(this.conns["base"]) !== "undefined"){
            if (this.conns["base"].readyState !== 1 && this.conns["base"].readyState !== 2){
                buildBaseConnection();
            }
        }
        else{
            buildBaseConnection();
        }

    },
    // Basic checking to make sure connection built
    baseChecking: function(){
        if ( ! this.conns.hasOwnProperty("base") || typeof(this.conns["base"]) === "undefined" || this.conns['base'].readyState !== 1 ){
            return false;
        }
        else{
            return true;
        }
    },
    userAuthenticate: function(username, password, errorCallBack, successCallBack){
        if (! this.baseChecking()){
            errorCallBack("Server cannot build connection to database");
            return;
        }
        this.models["base"].find({"username": username}, function(err, docs) {
            if (err) {
                errorCallBack(err);
                return;
            }
            if (docs.length > 1) {
                console.log("Warning: more than 1 record found with username <" + username + ">, will use the first one by default");
            }
            var userRecord = docs[0];
            if (docs.length < 1 || password !== userRecord.password) {
                errorCallBack("Incorrect username or password");
                return;
            }
            else {
                // Passed checking, start to load data
                successCallBack();
                return;
            }
        });
    },

    // Used to save live update data
    saveLiveupdateData: function(username, password, liveupdateData, errorCallBack, successCallBack){
        if (! this.baseChecking()){
            errorCallBack("Server didn't build connection to database");
            return;
        }
        let that = this;

        let authSuccessCallBack = function(){
            that.saveDataCallBack(username, liveupdateData, "liveupdate", errorCallBack, successCallBack);
        };

        // Start to run userAuthentication and save data
        that.userAuthenticate(username, password, errorCallBack, authSuccessCallBack);

    },

    // Used to get Liveupdate data
    loadLiveupdateData: function(username, password, errorCallBack, successCallBack){
        if (! this.baseChecking()){
            errorCallBack("Server cannot connect to database");
            return;
        }
        let that = this;

        let authSuccessCallBack = function(){
            that.loadLatestDataCallBack(username, "liveupdate", errorCallBack, successCallBack);
        };

        // Start to auth and load liveupdate data
        that.userAuthenticate(username, password, errorCallBack, authSuccessCallBack)
    },

    // Used to get editor data
    loadEditorData: function(username, password, errorCallBack, successCallBack){
        if (! this.baseChecking()){
            errorCallBack("Server cannot connect to database");
            return;
        }
        let that = this;

        let authSuccessCallBack = function(){
            that.loadLatestDataCallBack(username,"editor", errorCallBack, successCallBack);
        };

        // Start to auth and load liveupdate data
        that.userAuthenticate(username, password, errorCallBack, authSuccessCallBack)
    },

    // Used to process and save editor Data
    saveEditorData: function(username, password, editorData, errorCallBack, successCallBack){
        if (! this.baseChecking()){
            errorCallBack("Server didn't build connection to database");
            return;
        }
        let that = this;

        let authSuccessCallBack = function(){
            that.saveDataCallBack(username, editorData, "editor", errorCallBack, successCallBack);
        };

        // Start to run userAuthentication and save data
        that.userAuthenticate(username, password, errorCallBack, authSuccessCallBack);
    },
    loadLatestDataCallBack(username, dataType, errorCallBack, successCallBack){
        // Load latest data from database

        let that = this;

        // Step 1: Create or find Model for this user (bind model to user's corresponding collection)
        if ( ! that.models.hasOwnProperty(username) || typeof(that.models[username]) === "undefined"){
            // Create model for this user if not created yet
            that.models[username] = that.conns["base"].model(username, that.schema.data, username);
        }
        if ( (! that.models.hasOwnProperty(username+".index")) || typeof(that.models[username+".index"]) === "undefined" ){
            // Create model for this user if not created yet
            that.models[username+".index"] = that.conns["base"].model(username+".index", that.schema.dataIndex, username+".index");
        }

        // Step 2: Create Callback to load data. Will be called at Step 3
        let loadCallBack = function(){
            that.models[username+".index"].find({"dataType":dataType}).sort({epochTime: -1}).limit(1).exec(function(err, docs){
                if (err || typeof(docs[0]) === "undefined" || (! ("epochTime" in docs[0]))) {
                    errorCallBack("Cannot get data from database, record don't exist or broken");
                    return;
                }
                else {
                    // documents may consist of many chunks, search again by using epoch time and combine them
                    that.models[username].find({epochTime: docs[0].epochTime, "dataType":dataType}).exec(function(err, docs){
                        // not using sort here, to avoid hit the mongo sort memory limit
                        let editorDataChunkNum = docs.length;
                        let editorDataChunks = new Array(editorDataChunkNum);
                        for (let i = 0; i < editorDataChunkNum; i++){
                            for (let j = 0; j < editorDataChunkNum; j++){
                                if (docs[j]["dataIndex"] === i){
                                    editorDataChunks[i] = docs[i].data;
                                    break;
                                }
                            }
                        }
                        successCallBack(editorDataChunks.join("")); // Concatenate editorDataChunks and return it to client
                        return;
                    });
                }
            });
        };

        // Step 3: load data and reply
        loadCallBack();
    },
    saveDataCallBack(username, data, dataType, errorCallBack, successCallBack){
        // Save data to database after authentication
        let that = this;

        // Step 1: Create or find Model for this user (bind model to user's corresponding collection)
        if ( (! that.models.hasOwnProperty(username)) || typeof(that.models[username]) === "undefined" ){
            // Create model for this user if not created yet
            that.models[username] = that.conns["base"].model(username, that.schema.data, username);
        }
        if ( (! that.models.hasOwnProperty(username+".index")) || typeof(that.models[username+".index"]) === "undefined" ){
            // Create model for this user if not created yet
            that.models[username+".index"] = that.conns["base"].model(username+".index", that.schema.dataIndex, username+".index");
        }

        // Step 2: Create Callback to save data. Will be called at Step 3
        let saveCallBack = function(){
            let currentTime = new Date().getTime();
            let dataChunks = that.chunkLongString(data, 15*1000*1000);
            const dataChunkNum = dataChunks.length;
            let recordChunks = new Array(dataChunkNum);
            for (let i = 0; i < dataChunkNum; i++){
                recordChunks[i] = {"epochTime": currentTime, "dataType": dataType, "data": dataChunks[i], "dataIndex": i};
            }
            let recordIndex = new Array(1);
            recordIndex[0] = {"epochTime": currentTime, "dataType": dataType, "dataPatches": dataChunkNum};
            that.models[username+".index"].insertMany(recordIndex, function(err, docs){
                if(err) {
                    errorCallBack("database cannot save dataIndex now: "+erro.toString());
                    return;
                }
                else{
                    that.models[username].insertMany(recordChunks, function(err, docs){
                        if(err) {
                            errorCallBack("database cannot save data now"+err.toString());
                            return;
                        }
                        else{
                            successCallBack();
                            return;
                        }
                    });
                }
            });
        };

        // Step 3: Check database validation, make sure every collection won't over load. If not over load then insert data (use saveCallBack created in step 2)
        that.models[username].estimatedDocumentCount(function(err, num){
            // If error occur, return error to client
            if (err) { errorCallBack(err); return;}
            // If too many records in collection, remove oldest records
            if (num >= that.databaseCollectionMaximumRecords) {
                // Remove oldest 10% data
                let percentageToRemove = 0.1;
                let dataTypes = ["editor", "liveupdate"];
                for (let dataTypeIndex = 0; dataTypeIndex < dataTypes.length; dataTypeIndex ++){
                    that.models[username+".index"].find({"dataType": dataTypes[dataTypeIndex]}).countDocuments(function(err, typeNum) {
                        if (typeNum >= Math.ceil(1 / percentageToRemove)) {
                            that.models[username + ".index"].find({"dataType": dataTypes[dataTypeIndex]}).sort({epochTime: 1}).limit(Math.max(Math.ceil(percentageToRemove * typeNum), 1)).exec(function (err, result) {
                                if (result.length < 1){
                                    return;
                                }
                                let last_epochTime = result[result.length - 1].epochTime;
                                that.models[username].deleteMany({"dataType": dataTypes[dataTypeIndex], epochTime: {$lte: last_epochTime}, }, function (err) {
                                    // If error in deleting, return error to client
                                    if (err) {
                                        errorCallBack("Failed in removing user's oldest history");
                                        return;
                                    }
                                    // If succeed then remove index
                                    that.models[username + ".index"].deleteMany({"dataType": dataTypes[dataTypeIndex], epochTime: {$lte: last_epochTime}}, function (err) {
                                        // If error in deleting, return error to client
                                        if (err) {
                                            errorCallBack("Failed in removing user's oldest history");
                                            return;
                                        }
                                    });
                                });
                            })
                        }
                        if (dataTypeIndex >= dataTypes.length - 1){
                            saveCallBack();
                        }
                    })
                }
            }
            else{
                // User Collection haven't meet maximum limit, insert data directly
                saveCallBack();
            }
        });
    }
};

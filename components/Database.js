var mongoose = require("mongoose");

// Database username and password
var DBusername = "shapelab";
var DBpassword = "shapelab";
var DBaddress = "localhost";
var DBport = 27017;
var DBname = "shapelab";


// Database root address
var DBurl = 'mongodb://'+DBusername.toString()+':'+DBpassword.toString()+'@'+DBaddress.toString()+':'+DBport.toString()+'/'+DBname.toString();

// Create Schema, for database connection
var userListSchema = new mongoose.Schema({
    "username" : String,
    "password" : String,
    "role" : String
});
var editorDataSchema = new mongoose.Schema({
    "epochtime": Number, // get from ((new Date()).getTime()), with milliseconds
    "editorData": String
});

module.exports = {
    // Some public parameters
    schema: {
        'userList': userListSchema,
        'editorData': editorDataSchema
    },
    databaseReconnectTime : 1000,
    databaseCollectionMaximumRecords: 1000,
    conns : {},
    models: {},

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
            that.conns["base"].on('error', function(){that.dbReconnectCallback(that, forWhat)});
            that.conns["base"].on('connected', function(){that.dbConnectCallback(that, forWhat)});
        }, that.databaseReconnectTime)
    },

    // The base connection to our database. This should be done first before all other operation
    connect: function(forWhat){
        var that = this; // Used to transfer current owner object
        var buildBaseConnection = function(){
            // Connect to database, mangoose will automatically reconnect if disconnected. Handle reconnection if error occur here
            // When using createConnection to build connection, replace mongoose.model with conn.model (conn is the return value of createConnection)
            that.conns["base"] = mongoose.createConnection(DBurl, {useNewUrlParser: true});
            that.conns["base"].on('error', function(){that.dbReconnectCallback(that, forWhat)});
            that.conns["base"].on('connected', function(){that.dbConnectCallback(that, forWhat)});
            // Connect to userList collection and save model. This is required
            that.models["base"] = that.conns["base"].model('userList', that.schema.userList, 'userList'); // Build model for collection 'userList'
        };

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
    // Used to get editor data
    loadEditorData: function(username, password, errorCallBack, successCallBack){
        if (! this.baseChecking()){
            errorCallBack("Server cannot connect to database");
            return;
        }
        var that = this;
        this.models["base"].find({"username": username}, function(err, docs){
            if (err) {
                errorCallBack(err);
                return;
            }
            if(docs.length > 1) {
                console.log("Warning: more than 1 record found with username <" + username + ">, will use the first one by default");
            }
            var userRecord = docs[0];
            if (docs.length < 1 || password !== userRecord.password){
                errorCallBack("Incorrect username or password");
                return;
            }
            else{
                // Passed checking, start to load data

                // Step 1: Create or find Model for this user (bind model to user's corresponding collection)
                if ( ! that.models.hasOwnProperty(username) || typeof(that.models[username]) === "undefined"){
                    // Create model for this user if not created yet
                    that.models[username] = that.conns["base"].model(username, that.schema.editorData, username);
                }

                // Step 2: Create Callback to load data. Will be called at Step 3
                var loadCallBack = function(){
                    that.models[username].find().sort({epochtime: -1}).limit(1).exec(function(err, docs){
                        if (err || typeof(docs[0]) === "undefined" || (! "editorData" in docs[0])) {
                            errorCallBack("Cannot get data from database, record don't exist");
                            return;
                        }
                        else {
                            successCallBack(docs[0].editorData);
                            return;
                        }
                    });
                };

                // Step 3: load data and reply
                loadCallBack();
            }
        });
    },

    // Used to process and save editor Data
    saveEditorData: function(username, password, editorData, errorCallBack, successCallBack){
        if (! this.baseChecking()){
            errorCallBack("Server didn't build connection to database");
            return;
        }
        var that = this;
        this.models["base"].find({"username": username}, function(err, docs){
            if (err) {
                errorCallBack(err);
                return;
            }
            if(docs.length > 1) {
                console.log("Warning: more than 1 record found with username <" + username + ">, will use the first one by default");
            }
            var userRecord = docs[0];
            if (docs.length < 1 || password !== userRecord.password){
                errorCallBack("Incorrect username or password");
                return;
            }
            else{
                // Passed checking, start to save data

                // Step 1: Create or find Model for this user (bind model to user's corresponding collection)
                if ( ! that.models.hasOwnProperty(username) || typeof(that.models[username]) === "undefined"){
                    // Create model for this user if not created yet
                    that.models[username] = that.conns["base"].model(username, that.schema.editorData, username);
                }

                // Step 2: Create Callback to save data. Will be called at Step 3
                var saveCallBack = function(){
                    var currentTime = new Date().getTime();
                    var newRecord = new that.models[username]({"epochtime": currentTime, "editorData": editorData});
                    newRecord.save(function(err, record){
                        if(err) {
                            errorCallBack("database cannot save editor data now");
                            return;
                        }
                        else{
                            successCallBack();
                            return;
                        }
                    });
                };

                // Step 3: Check database validation, make sure every collection won't over load. If not over load then insert data (use saveCallBack created in step 2)
                that.models[username].estimatedDocumentCount(function(err, num){
                    // If error occur, return error to client
                    if (err) { errorCallBack(err); return;}
                    // If too many records in collection, remove oldest records
                    if (num >= that.databaseCollectionMaximumRecords) {
                        that.models[username].find().sort({epochtime: 1}).limit(num - that.databaseCollectionMaximumRecords + 1).exec(function (err, result) {
                            that.models[username].deleteMany({epochtime: { $lte: result[result.length - 1].epochtime} }, function(err){
                                // If error in deleting, return error to client
                                if (err) {errorCallBack("Failed in removing user's oldest history");return;}
                                // If no error, then start to insert data
                                saveCallBack();
                            });
                        });
                    }
                    else{
                        // User Collection haven't meet maximum limit, insert data directly
                        saveCallBack();
                    }
                });
            }
        });
    }
};


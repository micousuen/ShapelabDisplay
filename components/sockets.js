var socketIO = require('socket.io');
var zmq = require('zeromq');
var db = require('./Database');

module.exports = {
    toClientIO: null, // base socket to accept connection from clients, used to broadcast to users. Using socket.io
    entryio: null, // zmq io to accept files from other programs, used to accept data from other programs. Using zmq
    socketsPool: {},
    getClientNumInRoom: function(roomID){
        if (typeof(this.toClientIO.sockets.adapter.rooms[roomID]) !== "undefined")
            return this.toClientIO.sockets.adapter.rooms[roomID].length;
        else
            return 0;
    },
    connect_io: function(httpServer, options){
        this.toClientIO = new socketIO(httpServer, options);
    },
    set_io: function(){
        var that = this;
        this.toClientIO.on('connection', function(socket){
            socket.emit('authentication', function(data){
                socket.on('disconnect', (reason) => {
                    socket.leave(data.username);
                    console.log("Info: user leaving group <", data.username, ">, there are ", that.getClientNumInRoom(data.username), " clients in room now");
                });
                db.userAuthenticate(data.username, data.password,
                    function(errorReason){
                        // Failed in authentication, won't let it connect to our server socket
                        console.log("Warning: Incorrect socket authentication, disconnect socket ", data);
                        socket.emit("authenticationFailed");
                        socket.disconnect(true);
                    },
                    function(){
                        // Succeed in authentication, bind user socket to username
                        socket.join(data.username);
                        socket.emit("authenticationSucceed");
                        console.log("Info: user added to group <", data.username, ">, there are ", that.getClientNumInRoom(data.username) , " clients in room now");
                    });
            });
        });
    },
    connect_entryio: function(fileEntryBindAddr, fileEntryPort, options){
        // if fileEntryPort is not given, skip fileEntryIO creation
        if (typeof(fileEntryBindAddr) !== "undefined" && typeof(fileEntryPort) !== "undefined" && fileEntryPort !== 0){
            this.entryio = zmq.socket('rep');
            var zmq_bind_addr = "tcp://"+fileEntryBindAddr.toString()+":"+fileEntryPort.toString();
            this.entryio.bindSync(zmq_bind_addr); // Because zeromq will use a default context, so we don't need to create one
            console.log("zmq bind to "+zmq_bind_addr);
        }
    },
    set_entryio: function(){
        var that = this;
        if (typeof(this.entryio) !== "undefined" && typeof(this.entryio) !== "null") {
            this.entryio.on('message', function (request) {
                let messageProcessed = 0;
                let messageTotal = -1;
                let requestStr = "";
                let requestJson = undefined;
                let userData = {};
                let processor = function(processStatus, data){ // processor is a function used to reply async query
                    // If processStatus === 1, data should have field "username" and "userdata". And in "userdata", "fileName" and "fileData" field should be there.
                    //                         Data will stored and send out when all of them are ready
                    // If processStatus === 0, data will be turned to string and give to user as failed reason
                    if (processStatus === 1){
                        // Succeed.
                        messageProcessed = messageProcessed + 1;
                        if ((! "username" in data) || (! "userdata" in data)){
                            throw "Error in server code! Didn't get userData or userName in fileEntryProcessor";
                        }
                        if (data.username in userData){
                            userData[data.username].push(data.userdata);
                        }
                        else{
                            userData[data.username] = [data.userdata];
                        }
                        if (messageTotal > 0 && messageProcessed === messageTotal){
                            // traverse stored data, and send data to every client
                            for (let user in userData){
                                if (user in userData){
                                    that.toClientIO.to(user).emit("fileEntryModelUpdate", JSON.stringify(userData[user]));
                                }
                            }
                            // Send out reply here
                            that.entryio.send("OK");
                        }
                    }
                    else{
                        // Failed.Set messageTotal to -1 and don't send message anymore
                        if (messageTotal > 0){
                            messageTotal = -1;
                            that.entryio.send('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']'+' Error: '+data.toString());
                        }
                    }
                };
                let messageProcess = function(ele){
                    // Check username and password exist
                    if ((! "username" in ele) || (! "password" in ele)){
                        processor(0, "username or password field missing in some message(s)");
                    }
                    else{
                        if ((! "fileName" in ele) || (! "fileData" in ele)){
                            processor(0, "fileName or fileData field missing in some message(s)");
                        }
                        else{
                            // Authenticate
                            db.userAuthenticate(ele.username, ele.password,
                                function(){
                                    processor(0, "failed in some message(s) authentication");
                                },
                                function(){
                                    // Process message, broadcast to corresponding users
                                    processor(1, {"username":ele.username, "userdata":{"fileName":ele.fileName, "fileData":ele.fileData}});
                                })
                        }
                    }
                };


                try {
                    requestStr = request.toString();
                    requestJson = JSON.parse(requestStr); // requestJson is the request we received. Process it and reply process result to client
                }
                catch(err){
                    that.entryio.send('[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']'+' Error: in decoding json');
                    return;
                }
                if (typeof(requestJson) !== "undefined"){
                    if (Array.isArray(requestJson)){
                        messageTotal = requestJson.length;
                        // We will process message in async way, so we need to use forEach to process every message
                        // Simple for loop won't work here
                        requestJson.forEach(function(ele){messageProcess(ele)});
                    }
                    else{
                        messageTotal = 1;
                        // Check username and password exist.
                        messageProcess(requestJson);
                    }
                }
            });
        }
    },
    bind: function(httpServer, options, fileEntryBindAddr, fileEntryPort, fileEntryOptions){
        this.connect_io(httpServer, options);
        this.connect_entryio(fileEntryBindAddr, fileEntryPort, fileEntryOptions);
        this.set_io();
        this.set_entryio();
    }
};
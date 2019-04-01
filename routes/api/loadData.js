var db = require('../../components/database');

// save our data operation
module.exports = {
    loadEditorData: function(req, res){
        var username = req.query.username;
        var password = req.query.password;
        db.loadEditorData(username, password,
            function(errInfo) {
                res.status(404);
                res.send(errInfo);
            }, // errorCallBack
            function(editorData){
                res.status(200);
                res.send(editorData);
            }); // successCallBack
    },
    loadLivaupdateData: function(req, res){
        var username = req.query.username;
        var password = req.query.password;
        db.loadLiveupdateData(username, password,
            function(errInfo) {
                res.status(404);
                res.send(errInfo);
            }, // errorCallBack
            function(liveupdateData){
                res.status(200);
                res.send(liveupdateData);
            }); // successCallBack
    }
};
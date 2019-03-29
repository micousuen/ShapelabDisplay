var db = require('../../components/database');

// save our data operation
module.exports = {
    load_data: function(req, res){
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
    }
};
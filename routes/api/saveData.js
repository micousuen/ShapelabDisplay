var db = require('../../components/Database');

// Connect to our database
db.connect("API/saveData");

// save our data operation
module.exports = {
    save_data: function(req, res){
        var editorData = req.body['editor'];
        var username = req.body['username'];
        var password = req.body['password'];
        db.saveEditorData(username, password, editorData,
            function(errInfo) {
                res.status(404);
                res.send(errInfo);
            }, // errorCallBack
            function(){
                res.status(200);
                res.send("");
            }); // successCallBack
    }
};
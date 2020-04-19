var express = require('express');
var router = express.Router();

var loadData = require('./loadData');
var saveData = require('./saveData');

// save our data
router.post('/save_data/editor', saveData.saveEditorData);
router.get('/load_data/editor', loadData.loadEditorData);
router.get('/load_data/liveupdate', loadData.loadLivaupdateData);

module.exports = router;
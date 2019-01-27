var express = require('express');
var router = express.Router();

var loadData = require('./loadData');
var saveData = require('./saveData');

// save our data
router.post('/save_data', saveData.save_data);
router.get('/load_data', loadData.load_data);

module.exports = router;
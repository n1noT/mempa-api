const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Mempa API');
});

router.head('/healthcheck', function(req, res, next) {
  res.status(200).end();
});

module.exports = router;

var express = require('express');
var read = require('node-readability')

var app = express();

app.get("/", function(req, res) {
  var url = req.query.url;
  console.log(req);

  read(url, function(err, article, meta) {
		res.send(article.content)
	});

}).listen(8000, '127.0.0.1');
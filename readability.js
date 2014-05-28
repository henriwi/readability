var express = require('express');
var request = require('request');
var FeedParser = require('feedparser');
var read = require('node-readability')

var urls = ["http://www.vg.no/rss/create.php?categories=20&keywords=&limit=10", "http://www.nrk.no/toppsaker.rss"];
var articles = [];

urls.forEach(function(url) {

	var feedparser = new FeedParser();
	
	feedparser.on("readable", function() {
		var post;
		while (post = this.read()) {
			console.log(post.link);
			read(post.link, function(err, article, meta) {
				if (err) {
					console.log(err);
				} else {
					articles.push(article.content);
				}
			});
		} 
	});

	var req = request(url, {timeout: 5000, pool: false});
	req.setMaxListeners(50);
	req.setHeader("accept", "text/html,application/xhtml+xml");

	req.on("response", function(res) {
		if (res.statusCode != 200) {
			return this.emit("error", new Error("Bad status code: " + res.statusCode));
		}

		var stream = this;
		stream.pipe(feedparser);
	});
});

function done(err) {
	if (err) {
		console.log("Error in readability.js: " + err, err.stack);
		return process.exit(1);
	}
}

/** Server */
var app = express();

app.get("/", function(req, res) {
  var url = req.query.url;
  res.set('Content-Type', 'text/html');
  res.send(articles);

}).listen(8000, '127.0.0.1');
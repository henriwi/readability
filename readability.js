var express = require('express');
var request = require('request');
var FeedParser = require('feedparser');
var read = require('node-readability')
var nodemailer = require("nodemailer");

var urls = ["http://www.dn.no/rss/dagensutgave/"];
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
					articles.push(article);
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

function mail(content) {
	// create reusable transport method (opens pool of SMTP connections)
	var smtpTransport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
	        user: "",
	        pass: ""
	    }
	});

	// setup e-mail data with unicode symbols
	var mailOptions = {
	    from: "", // sender address
	    to: "", // list of receivers
	    subject: "Readability-test", // Subject line
	    attachments: {
	    	fileName: "Readability-test.html",
	    	contents: content,
	    	contentType: "text/html"
	    }
	}

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
	    if(error){
	        console.log(error);
	    }else{
	        console.log("Message sent: " + response.message);
	    }

	    // if you don't want to use this transport object anymore, uncomment following line
	    //smtpTransport.close(); // shut down the connection pool, no more messages
	});
}

/** Server */
var app = express();

app.get("/", function(req, res) {
	var content = "<html><head><META http-equiv='Content-Type' content='text/html; charset=utf-8'></head><body>"
	articles.forEach(function(article) {
		content += "<h1>" + article.title + "</h1>"
		content += "<div>" + article.content + "</div>"
	});
	content += "</body></html>"
	// mail(content)
 	res.send(content);

}).listen(8000, '127.0.0.1');

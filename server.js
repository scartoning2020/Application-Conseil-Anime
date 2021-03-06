const http = require('http');
const myanimelists = require('myanimelists');
const mc = require('mongodb');
const uri = "mongodb+srv://Loris:Plouf11@cluster0-c0qzl.gcp.mongodb.net/test?retryWrites=true";
const mClient = mc.MongoClient(uri, { useNewUrlParser: true });
const restify = require('restify');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cryptoJS = require("crypto-js");



/**
 * Initialize Server
 */
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.get('/', function(req, res, err) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    console.log("We got a connection !");
    res.write("Hello World !");
    res.end();
});
server.get('/bdd/users', (req,res, next) => {
    mClient.connect()
        .then(function (connection) {
            const bdd = connection.db("ApplicationAnime");
            const collection = bdd.collection("Users");
            console.log(collection);
            // Finding documents
            collection.find({}).toArray( function( err, data ) {
                if (err) res.send(500, "Error while trying to find documents in mongodb :" + err);
                console.log(data);
                res.send(200, data);
            });
            // Closing the connection
            mClient.close()
                .then(success => console.log("Succesfully closing the connection"))
                .catch(err => console.log("Error while trying to close the connection :" + err));
        })
        .catch( function (err) {
            console.log(err);
            res.send(500, err);
        });
    next();
});
server.get('/newusers', function (req, res, next) {
    const conn = mongoose.createConnection("mongodb+srv://Loris:Plouf11@cluster0-c0qzl.gcp.mongodb.net/ApplicationAnime?retryWrites=true", {useNewUrlParser: true});
    console.log("connection created");
    const UserSchema = new Schema({
        mail: String,
        pass: String,
        genres: {
            type: Map,
            of: Number
        }
    }, { collection: 'Users' });
    var u = conn.model('User', UserSchema);
    u.find({}, function (err, docs) {
        if (err) {
            console.log(err);
            res.send(500, "ERROR" + err);
        } else {
            res.send(200, docs);
        }
    });
});
server.get('/newlogs', function (req, res, next) {
    const conn = mongoose.createConnection("mongodb+srv://Loris:Plouf11@cluster0-c0qzl.gcp.mongodb.net/ApplicationAnime?retryWrites=true", {useNewUrlParser: true});
    console.log("connection created");
    const CherchLogSchema = new Schema({
        nomAnime: String,
        genres: [String]
    }, { collection: 'CherchLogs' });
    var Log = conn.model('CherchLog', CherchLogSchema);
    Log.find({}, function (err, docs) {
        if (err) {
            console.log(err);
            res.send(500, "ERROR" + err);
        } else {
            var data = JSON.stringify(docs);
            String.prototype.replaceAll = function(search, replacement) {
                var target = this;
                return target.split(search).join(replacement);
            };
            data = data.replaceAll("Hentai", "Ecchi");
            res.send(200, JSON.parse(data));
        }
    });
});
server.get('/anime/byTitle/:title', function( req, res, next) {
    const promiseAnime = myanimelists.getInfoFromName(req.params.title);
    promiseAnime.then(function (result) {
        res.contentType = 'json';
        const conn = mongoose.createConnection("mongodb+srv://Loris:Plouf11@cluster0-c0qzl.gcp.mongodb.net/ApplicationAnime?retryWrites=true", {useNewUrlParser: true});
        console.log("connection created");
        const CherchLogSchema = new Schema({
            nomAnime: String,
            genres: [String]
        }, { collection: 'CherchLogs' });
        var Log = conn.model('CherchLog', CherchLogSchema);
        console.log(result.tags);
        var toStore = new Log({nomAnime: result.title, genres: result.genres});
        toStore.save(function (err) {
            if (err) {
                console.log(err)
            } else {
                console.log("Success databasing");
            }
            res.send(result);
            next();
        });
    });
});
server.get('/toAuth', function( req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<html>" +
        "<body>" +
        "<form action='auth' method='POST'>" +
        "<input type='text' name='login' placeholder='login'>" +
        "<input type='password' name='pass' placeholder='password'>" +
        "<label> Shounen </label><input type='checkbox' name='genres[shounen]'>" +
        "<label> Seinen </label><input type='checkbox' name='genres[seinen]'>" +
        "<input type='submit' value='Submit'>" +
        "</form>" +
        "</body>" +
        "</html>");
    res.end();
});
server.get('/newToAuth', function ( req, response) {
    console.log('Conected on the new auth');
    var request = require('request');

    var requestData = JSON.parse('{"login": "xxx", "pass": "yyy"}');

    // Configure the request
    var options = {
        host: 'localhost',
        port: '8888',
        path: '/auth',
        method: 'POST',
        json: requestData
    };

    // Start the request
    console.log("Start");
    var x = http.request(options,function(res){
        console.log("Connected");
        res.on('data',function(data){
            response.write(data);
            response.end();
        });
    });

    x.end();
});
server.post('/auth', function (req, res) {
    console.log('Auth processing ... Hold on');
    console.log("Login sent : " + req.body.login);
    console.log("Mdp sent : " + req.body.pass);
    var hashedpass = cryptoJS.SHA512(req.body.pass);
    console.log("Mdp hashed : " + hashedpass);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("login = " + req.body.login + "</br>");
    res.write("Clear pass = " + req.body.pass + "</br>");
    res.write("Hashed pass = " + hashedpass + "</br>");
    console.log("Genres :");
    for ( var genre in req.body.genres){
        console.log(genre + " : " + req.body.genres[genre]);
        res.write(genre + " " + req.body.genres[genre] + "</br>");
    }
    console.log("\ RAW");
    for(var key in req.body) {
        if(req.body.hasOwnProperty(key)){
            console.log(req.body[key]);
        }
    }
    res.end();
});
server.get('/auth/:login/:pass/:genres', function (req, res, next) {
    var login = req.params.login;
    console.log("Login : " + login);
    var passwd = req.params.pass
    console.log("Pass : " + passwd);
    var hashedpass = cryptoJS.SHA512(passwd);
    console.log("Mdp hashed : " + hashedpass);
    var genres =  ["Shonen", "Shojo", "Seinen", "Josei"];
    var genreScores = req.params.genres.split('');
    console.log("Genres :");
    for ( var i = 0; i < genres.length; i ++ ){
        console.log(genres[i] + " : " + genreScores[i]);
    }
    var mapGenres = {};
    for ( var i = 0; i < genres.length; i ++ ){
        mapGenres[genres[i]] = genreScores[i];
    }

    const conn = mongoose.createConnection("mongodb+srv://Loris:Plouf11@cluster0-c0qzl.gcp.mongodb.net/ApplicationAnime?retryWrites=true", {useNewUrlParser: true});
    console.log("connection created");
    const UserSchema = new Schema({
        mail: String,
        pass: String,
        genres: {
            type: Map,
            of: String
        }
    }, { collection: 'Users' });
    var User = conn.model('User', UserSchema);
    var toStore = new User({mail: login, pass: hashedpass,genres: mapGenres});
    toStore.save(function (err) {
        if (err) {
            console.log(err)
        } else {
            console.log("Success databasing");
        }
        res.end();
    });
});
server.listen(process.env.PORT || 8888, function() {
    console.log('%s listening at %s', server.name, server.url);
});

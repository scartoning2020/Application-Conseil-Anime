const http = require('http');
const dt = require('./firstmodule');
const url = require('url');
const myanimelists = require('myanimelists');
const restify = require('restify');
const crypto = require('crypto'), algorithm = 'aes-256-ctr', password = 'C0ns3ils';
const ivPseudo = 'Pc0ns31l';
const mc = require('mongodb');
const uri = "mongodb+srv://Loris:Plouf11@cluster0-c0qzl.gcp.mongodb.net/test?retryWrites=true";
const client = new mc.MongoClient(uri, { useNewUrlParser: true });
const assert = require('asert');

// http.createServer(function (request, response){
//
//     const route = url.parse(request.url, true).pathname;
//     switch ( route  ){
//
//         case "/home": {
//             response.writeHead( 200, {'Content-Type': 'text/html'});
//             response.write("<!DOCTYPE HTML>" +
//                 "<html>" +
//                 "<head>" +
//                 "<title> Acceuil </title>" +
//                 "</head>" +
//                 "<body>" +
//                 "<h1> Hello World ! </h1>" +
//                 "<p> You are on " + route + "</p>" +
//                 "</body>" +
//                 "</html>" +
//                 "");
//             response.end();
//             break;
//         }
//         case "/logging": {
//             var toLog = " --- Log " + dt.myDateTime() + " ---\n" +
//                 "A connection has been made : IP = " + request.connection.remoteAddress + "/\n";
//             fs.appendFile('../Logs/logs.txt', toLog, function (err) {
//                 if (err) throw err;
//                 console.log('We got a connection');
//             });
//             response.writeHead(200, {'Content-Type': 'Souriez vous êtes filmés'});
//             response.write("<!DOCTYPE HTML>" +
//                 "<html>" +
//                 "<head>" +
//                 "<title> Logging .... </title>" +
//                 "</head>" +
//                 "<body>" +
//                 "<h1> Haha </h1>" +
//                 "<p> You are on " + route + " and I took your IP </p>" +
//                 "</body>" +
//                 "</html>" +
//                 "");
//             response.end();
//             break;
//         }
//         case "/logs": {
//             console.log("Someone tried to read the logs ... ");
//             response.writeHead(200, {'Content-Type': 'text/html'});
//             response.write("<!DOCTYPE HTML>" +
//                 "<html>" +
//                 "<head>" +
//                 "<title> Logs </title>" +
//                 "</head>" +
//                 "<body>" +
//                 "<h1> The sacred Logs </h1>" +
//                 "<p> You are on " + route + " </p>" +
//                 "<p id =\"logs\"></p>"
//             );
//             /*readingAFile( '../Logs/logs.txt', function(data) {
//                 response.write("</body>" +
//                     "<p>" + data + "</p>" +
//                     "</html>")
//                 response.end; } )
//             console.log("Someone read the logs !");*/
//             fs.readFile("../Logs/logs.txt", 'utf8', function(err, data){
//                 if(err) {
//                     console.log("... and failed probably");
//                     throw err;
//                 }
//                 console.log(" ... and succeed !");
//                 data.split("/").forEach( function(element) {
//                     response.write("<p>" + element + "</p>");
//                 });
//                 // response.write(data);
//                 response.end();
//             });
//             break;
//         }
//         case "/animes" : {
//             response.writeHead(200, {'Content-Type': 'text/html'});
//             var promiseAnime = myanimelists.getInfoFromName('Golden Wind', 'anime');
//             promiseAnime.then(function(result){
//                 var keys = Object.keys(result);
//                 console.log(keys);
//                 response.write(keys.join() + "</br>");
//                 response.write(result.title + "</br>");
//                 response.write(result.synopsis + "</br>");
//                 var imgLink = result.picture;
//                 response.write("<img src=\"" + imgLink + "\">");
//                 response.write(JSON.stringify(result));
//                 response.end();
//             }).catch(error => console.log(error));
//             break;
//         }
//         case "/auth": {
//
//             break;
//         }
//         default :{
//             response.writeHead( 404, {'Content-Type': 'text/html'});
//             response.write("<!DOCTYPE HTML>" +
//                 "<html>" +
//                 "<head>" +
//                 "<title> 404 Error </title>" +
//                 "</head>" +
//                 "<body>" +
//                 "<h1> This page doesn't exist </h1>" +
//                 "<p> You are on " + route + " </p>" +
//                 "</body>" +
//                 "</html>" +
//                 "");
//             response.end();
//         }
//     }
// }).listen(8888);

/*
function readingAFile(filePath, callback) {
    var str = '';
    fs.readFile(filePath, 'utf8', function(err, data){
        if(err) throw err;
        callback(data);
    });
}*/


const server = restify.createServer();
server.use(restify.plugins.bodyParser());



server.get('/anime/byTitle/:title', function( req, res, next) {
    const promiseAnime = myanimelists.getInfoFromName(req.params.title, 'anime');
    promiseAnime.then(function(result){
        res.contentType = 'json';
        client.connect(err => {
            const logs = client.db("ApplicationAnime").collection("CherchLog");
            // perform actions on the collection object
            // Inserting some documents
            logs.insertMany([
                {nomAnime: result.title, tags: result.genres}
            ], function(err, result) {
                console.log("Inserted a document into the collection");
            });
            client.close();
        });
        res.send(result);
        return next();
        }).catch(error => console.log(error));
    }
);

server.get('/', function(req, res, err) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    console.log("We got a connection !")
    res.write("Hi");
    res.end();
});

server.post('/auth', function(req, res) {
    var cipherPseudo = crypto.createCipheriv(algorithm, password, ivPseudo);
    var ivPass = "";
    var cipherPass = crypto.createCipheriv(algorithm, password);

    var cryptedPseudo = cipherPseudo.update(req.body.pseudo, 'utf8', 'hex');
    var cryptedPass = cipherPass.update(req.body.pass, 'utf8', 'hex');

    cryptedPseudo += cipherPseudo.final('hex');
    cryptedPass += cipherPass.final('hex');
    console.log("Crypted pseudo = " + cryptedPseudo + ", Tag = " + cipherPseudo.getAuthTag() + ", IV = " + ivPseudo);
    console.log("Crypted Password = " + cryptedPass + ", Tag = " + cipherPass.getAuthTag() + ", IV" + ivPass);


    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("Here's what you submitted : Pseudo = " + req.body.pseudo + ", Password = " + req.body.pass);
    res.end();
});

server.get('/toAuth', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<!DOCTYPE html><html>" +
        "<head>" +
        "<title> Authentifiez vous ! </title>" +
        "<body>" +
        "<form action=\"/auth\" method=\"post\">" +
        "<div>" +
        "<label for=\"pseudo\"> Your pseudo </label>" +
        "<input name=\"pseudo\" id=\"pseudo\" type=\"text\" />" +
        "<label for=\"pass\"> Your password </label>" +
        "<input name=\"pass\" id=\"pass\" type=\"password\" />" +
        "<input name=\"submit\" id=\"submit\" type=\"submit\" value=\"Valider\"/>" +
        "</div>" +
        "</form>" +
        "</body>" +
        "</head>");
    res.end();
});

server.get('/bdd', function(req,res) {
    const dbName = "ApplicationAnime";
    res.writeHead(200, {'Content-Type': 'text/html'});
    client.connect(uri, function(err, client) {
        assert.strictEqual(null, err);
        console.log("Connected correctly to server");

        const db = client.db(dbName);
        findDocuments(db, function() {
            client.close();
        });
    });
    res.end();
});


const findDocuments = function(db, callback) {
    // Get the documents collection
    const collection = db.collection('CherchLog');
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
        assert.strictEqual(err, null);
        console.log("Found the following records");
        console.log(docs);
        callback(docs);
    });
}

server.listen(process.env.PORT || 8888, function() {
    console.log('%s listening at %s', server.name, server.url);
});

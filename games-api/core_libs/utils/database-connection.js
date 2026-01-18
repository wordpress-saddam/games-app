const Mongoose = require('mongoose');
const Config = require('../../config/config');
const uriFormat = require('mongodb-uri');

function encodeMongoURI (urlString) {
    if (urlString) {
      let parsed = uriFormat.parse(urlString)
      urlString = uriFormat.format(parsed);
    }
    return urlString;
}


let connectionString = 'mongodb://';
if ( Config.database.username && Config.database.password ) {
	connectionString += Config.database.username + ':' + Config.database.password + '@';
}

connectionString += Config.database.host + ':' + Config.database.port + '/' + Config.database.db; 

if ( Config.database.authSource ) {

	connectionString += '?authSource='+Config.database.authSource;
}

Mongoose.connect( encodeMongoURI(connectionString), { 
	useNewUrlParser: true, 
	useUnifiedTopology: true,
	useCreateIndex: true,
	useFindAndModify: false
}).catch((err) => {
	console.log("Error in initial MongoDB connection attempt");
	console.log(err.message || err);
	// Don't crash the process, just log the error
});

const db = Mongoose.connection;
db.on('error', function(err){
	console.log("Error in connecting with MongoDB");
	console.log(err.message || err);
	// Don't crash the process, just log the error
});
db.once('open', function callback() {
    console.log("Connection with database succeeded.");
});

// module.exports = {
//     db,
//     Mongoose
// }
exports.Mongoose = Mongoose;
exports.db = db;
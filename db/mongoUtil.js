const { MongoClient } = require("mongodb");

// const env = process.env.NODE_ENV || 'development'
// const mongoDbUrl = require('../config/mongodb.json')[env];
const mongoDbUrl = "mongodb://localhost:27017";
let client;

module.exports = async () => {
  // Mongoclient.connect returns promise if no callback is passed
  try {
    client = await MongoClient.connect(mongoDbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("client in util: ", client);
  } catch (e) {
    console.log("Could not connect to mongodb");
  }
};

module.exports.getClient = () => client;

module.exports.close = () => client.close();

// const { MongoClient } = require("mongodb");

// const uri = "mongodb://localhost:27017"
// // const client = new MongoClient(uri, );

// let _db;

// module.exports = {
//   connectToServer(callback) {
//     MongoClient.connect( uri, { useNewUrlParser: true, useUnifiedTopology: true }, ( err, client ) => {
//       _db  = client.db('hannah');
//       // console.log(_db.collection('users'));
//       return callback(err, client);
//     } );
//   },
//   getDb() {
//     console.log("voláno GET DBBBBB!!!!");
//     console.log("inner", _db);
//     return _db;
//   }
// };

const { MongoClient } = require('mongodb');
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: './config/.env' });

const mongoURL =
  env === 'development' || env === "test"
    ? process.env.MONGO_URI_LOCAL
    : process.env.MONGO_URI_ATLAS;
// const mongoURL = 'mongodb://localhost:27017';
let _db;

module.exports = {
  initDb(callback) {
    if (_db) {
      console.log('Database is already initialized!');
      return callback(null, _db);
    }
    MongoClient.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
      .then((client) => {
        // console.log('Database was connected successfully');
        _db = client.db('hannah');
        callback(null, _db);
      })
      .catch((err) => {
        callback(err);
      });
  },
  getDb() {
    if (!_db) {
      throw Error('Database not initialized');
    }
    return _db;
  },
};

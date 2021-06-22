const { MongoClient } = require('mongodb');
// const env = process.env.NODE_ENV || 'development'
// const mongoConfig = require('../config/mongodb.json')[env];
const mongoConfig = { url: 'mongodb://localhost:27017' };

let _db;

module.exports = {
  initDb(callback) {
    if (_db) {
      console.log('Database is already initialized!');
      return callback(null, _db);
    }
    MongoClient.connect(mongoConfig.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
      .then((client) => {
        console.log('Database was connected successfully');
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

const { initDb } = require('../db');

exports.mochaHooks = {
  beforeAll(done) {
    initDb((err, db) => {
      if (err) {
        console.log('Could not connect to mongodb: ', err);
        done(err);
      } else {
        console.log('Db initialized properly');
        done();
      }
    });
  },
};

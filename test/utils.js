const app = require('../app');
const request = require('supertest');

exports.loginUser = (credentials, auth) => {
  return function (done) {
    request(app)
      .post('/auth/login')
      .send(credentials)
      .expect(200)
      .end(onResponse);

    function onResponse(err, res) {
      auth[credentials.username] = res.body.token;
      return done();
    }
  };
};

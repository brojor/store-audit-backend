const request = require('supertest');
const { expect } = require('chai');

const app = require('../app');
const { initDb } = require('../db/index');
const tests = require('./tests-data');
const { loginUser } = require('./utils');
const auth = {};

for (const testSuite in tests) {
  const { username, requests, responses } = tests[testSuite];
  before(loginUser({ username, password: 'heslo' }, auth));
  describe(testSuite, function (done) {
    requests.forEach((req, i) => {
      it(`${req.path} - ${
        req.query && req.query.detailLevel
      }`, async function () {
        const response = await request(app)
          .get(req.path)
          .set('Authorization', `Bearer ${auth[username]}`)
          .query(req.query)
          .expect(200);
        expect(response.body).to.deep.equal(responses[i]);
      });
    });
  });
}

function loginUser(credentials, auth) {
  return function (done) {
    request(app)
      .post('/auth/login')
      .send(credentials)
      .expect(210)
      .end(onResponse);

    function onResponse(err, res) {
      auth[credentials.username] = res.body.token;
      return done();
    }
  };
}

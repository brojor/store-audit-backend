const request = require('supertest');
const { expect } = require('chai');
const { initDb } = require('../db/index');

const { kaspav, loumir, zahmon } = require('./responses.json');

const app = require('../app');

describe('GET chart/store-filter-options', function () {
  before(function (done) {
    initDb((err, db) => {
      if (err) {
        console.log('Could not connect to mongodb: ', err);
        done(err);
      } else {
        console.log('Db initialized properly');
        done();
      }
    });
  });

  it('Should fail due to user not logging in', async function () {
    const response = await request(app)
      .get('/chart/store-filter-options')
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });

  const auth = {};

  before(loginUser({ username: 'kaspav', password: 'heslo' }, auth));
  it('It does not fail after the user logs in', async function () {
    const response = await request(app)
      .get('/chart/store-filter-options')
      .set('Authorization', 'Bearer ' + auth.kaspav)
      .expect(200);
    expect(response.body).to.be.an('array');

    response.body.forEach((item) => {
      expect(item).to.have.all.keys('id', 'title', 'type');
    });
  });

  it('Send right response to TopManager', async function () {
    const response = await request(app)
      .get('/chart/store-filter-options')
      .set('Authorization', 'Bearer ' + auth.kaspav)
      .expect(200);
    expect(response.body).to.deep.equal(kaspav);
  });

  before(loginUser({ username: 'loumir', password: 'heslo' }, auth));
  it('Send right response to RegionalManager', async function () {
    const response = await request(app)
      .get('/chart/store-filter-options')
      .set('Authorization', 'Bearer ' + auth.loumir)
      .expect(200);
    expect(response.body).to.deep.equal(loumir);
  });

  before(loginUser({ username: 'zahmon', password: 'heslo' }, auth));
  it('Send right response to storeManager', async function () {
    const response = await request(app)
      .get('/chart/store-filter-options')
      .set('Authorization', 'Bearer ' + auth.zahmon)
      .expect(200);
    expect(response.body).to.deep.equal(zahmon);
  });
});


function loginUser(credentials, auth) {
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
}

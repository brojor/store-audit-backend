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

describe('GET chart/aggregated/all', function () {
  // before(loginUser({ username: 'loumir', password: 'heslo' }, auth));
  it('It should fail if the user role is regionalManager', async function () {
    const response = await request(app)
      .get('/chart/aggregated/all')
      .set('Authorization', 'Bearer ' + auth.loumir)
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });
  it('It should fail if the user role is storeManager', async function () {
    const response = await request(app)
      .get('/chart/aggregated/all')
      .set('Authorization', 'Bearer ' + auth.zahmon)
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });
  it('It should respond with json data when user role is topManagement', async function () {
    const response = await request(app)
      .get('/chart/aggregated/all')
      .set('Authorization', 'Bearer ' + auth.kaspav)
      .query({
        after: '2021-09-01T00:00:00.000Z',
        before: '2022-02-28T23:59:59.999Z',
        detailLevel: 'categories',
        sortBy: 'id',
      })
      .expect(200);
    response.body.forEach((item) => {
      expect(item).to.have.all.keys('id', 'deficiencies', 'label');
    });
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

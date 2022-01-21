const request = require('supertest');
const { expect } = require('chai');
const { initDb } = require('../db/index');

const app = require('../app');
const query = {
  after: '2021-09-01T00:00:00.000Z',
  before: '2022-02-28T23:59:59.999Z',
  detailLevel: 'categories',
  sortBy: 'id',
};
const auth = {};

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

before(loginUser({ username: 'kaspav', password: 'heslo' }, auth));
before(loginUser({ username: 'loumir', password: 'heslo' }, auth));
before(loginUser({ username: 'zahmon', password: 'heslo' }, auth));

describe('GET chart/store-filter-options', function () {
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
});

describe('GET chart/aggregated/all', function () {
  it('Should fail due to user not logging in', async function () {
    const response = await request(app)
      .get('/chart/aggregated/all')
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });
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

describe('GET chart/aggregated/:regionId', function () {
  it('Should fail due to user not logging in', async function () {
    const response = await request(app)
      .get('/chart/aggregated/60c39ce6f48a0b1d51d3922d')
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });
  it('should fail when a regional manager requests data about foreign region', async function () {
    const response = await request(app)
      .get('/chart/aggregated/60c39ce6f48a0b1d51d39230')
      .set('Authorization', 'Bearer ' + auth.loumir)
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });
  it('should fail when user is storeManager', async function () {
    const response = await request(app)
      .get('/chart/aggregated/60c39ce6f48a0b1d51d3922d')
      .set('Authorization', 'Bearer ' + auth.zahmon)
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });
  it('It should respond with json data when a regional manager requests data about his region', async function () {
    const response = await request(app)
      .get('/chart/aggregated/60c39ce6f48a0b1d51d3922d')
      .set('Authorization', 'Bearer ' + auth.loumir)
      .query(query)
      .expect(200);
    response.body.forEach((item) => {
      expect(item).to.have.all.keys('id', 'deficiencies', 'label');
    });
  });
});

describe('GET chart/individual/:storeId', function () {
  it('Mělo by selhat, pokud regionalManager žádá data o cizí prodejně', async function () {
    const response = await request(app)
      .get('/chart/individual/R4105')
      .set('Authorization', 'Bearer ' + auth.loumir)
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });
  it('Mělo by selhat, pokud storeManager žádá data o cizí prodejně', async function () {
    const response = await request(app)
      .get('/chart/individual/R4216')
      .set('Authorization', 'Bearer ' + auth.zahmon)
      .expect(401);
    expect(response.body).to.have.all.keys('success', 'message');
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.equal(
      'Not authorized to access this route'
    );
  });
  it('Mělo by odpovědět JSON daty, pokud regionalManager žádá data o svojí prodejně', async function () {
    const response = await request(app)
      .get('/chart/individual/R4221')
      .set('Authorization', 'Bearer ' + auth.loumir)
      .query(query)
      .expect(200);
    response.body.forEach((item) => {
      expect(item).to.have.all.keys('id', 'deficiencies', 'label');
    });
  });
  it('Mělo by odpovědět JSON daty, pokud storeManager žádá data o svojí prodejně', async function () {
    const response = await request(app)
      .get('/chart/individual/R4105')
      .set('Authorization', 'Bearer ' + auth.zahmon)
      .query(query)
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

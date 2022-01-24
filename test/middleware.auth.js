const request = require('supertest');
const { expect } = require('chai');
const { initDb } = require('../db/index');

const app = require('../app');
const { loginUser } = require('./utils');

const auth = {};

describe('protect middleware', () => {
  it('It should fail when user is not logged id', async () => {
    await request(app).get('/protected-route').expect(401);
  });
  it('It should fail when token is malformed', async () => {
    await request(app)
      .get('/protected-route')
      .set('Authorization', `Bearer ${auth.zahmon.slice(0, -1)}`)
      .expect(401);
  });
  before(loginUser({ username: 'zahmon', password: 'heslo' }, auth));
  it('It should response with 200 OK, when user is logged in', async () => {
    const response = await request(app)
      .get('/protected-route')
      .set('Authorization', `Bearer ${auth.zahmon}`)
      .expect(200);
  });
});

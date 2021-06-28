const request = require('supertest');
const { expect } = require('chai');
const { initDb } = require('../db/index');

const app = require('../app');
// const { getDb } = require('../db/index');

// const users = db.get('users');
// const testUser = { username: 'lojzajede', password: 'heslo123' };

describe('POST /auth/login', function () {
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
  it('should respond with "success: true" and valid "token", when receives valid credentials', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'eduduf', password: "heslo" })
      .expect(200);
      expect(response.body.success).to.be.true;
      expect(response.body).to.have.all.keys('success', 'token');;
      expect(response.body.token).to.be.string
      expect(response.body.token.split(".")).to.have.lengthOf(3)
  });
  it('should failed with message "Invalid credentials", when receives invalid credentials', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'abcdefg', password: "ijklmn" })
      .expect(400);
      expect(response.body.success).to.be.false;
      expect(response.body).to.not.have.property('token');
      expect(response.body.message).to.equal('Invalid credentials');
  });
  it('should failed with message "Invalid credentials", when user is valid, but password invalid', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'eduduf', password: "ijklmn" })
      .expect(400);
      expect(response.body.success).to.be.false;
      expect(response.body).to.not.have.property('token');
      expect(response.body.message).to.equal('Invalid credentials');
  });
  it('should failed with message "Please provide an username"', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({password: "heslo"})
      .expect(400);
      expect(response.body.success).to.be.false;
      expect(response.body).to.not.have.property('token');
      expect(response.body.message).to.equal('Please provide an username');
  });
});


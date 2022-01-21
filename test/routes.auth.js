const request = require('supertest');
const { expect } = require('chai');
const { initDb } = require('../db/index');

const app = require('../app');
// const { getDb } = require('../db/index');

// const users = db.get('users');
// const testUser = { username: 'lojzajede', password: 'heslo123' };

describe('POST /auth/login', function () {
  it('should respond with "success: true" and valid token, when receives valid credentials', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'kaspav', password: 'heslo' })
      .expect(200);
    expect(response.body.success).to.be.true;
    expect(response.body).to.have.all.keys('success', 'token', 'fullName');
    expect(response.body.token).to.be.string;
    expect(response.body.token.split('.')).to.have.lengthOf(3);
  });
  it('should failed with message "Neplatné přihlašovací údaje", when receives invalid credentials', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'abcdefg', password: 'ijklmn' })
      .expect(401);
    expect(response.body.success).to.be.false;
    expect(response.body).to.not.have.property('token');
    expect(response.body.message).to.equal('Neplatné přihlašovací údaje');
  });
  it('should failed with message "Neplatné přihlašovací údaje", when user is valid, but password invalid', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'eduduf', password: 'ijklmn' })
      .expect(401);
    expect(response.body.success).to.be.false;
    expect(response.body).to.not.have.property('token');
    expect(response.body.message).to.equal('Neplatné přihlašovací údaje');
  });
  it('should failed with message "Zadejte prosím uživetelské jméno"', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({ password: 'heslo' })
      .expect(400);
    expect(response.body.success).to.be.false;
    expect(response.body).to.not.have.property('token');
    expect(response.body.message).to.equal('Zadejte prosím uživetelské jméno');
  });
  it('should failed with message "Zadejte prosím heslo"', async function () {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'Pepa' })
      .expect(400);
    expect(response.body.success).to.be.false;
    expect(response.body).to.not.have.property('token');
    expect(response.body.message).to.equal('Zadejte prosím heslo');
  });
});

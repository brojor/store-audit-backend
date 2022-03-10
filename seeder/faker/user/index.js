const names = require('./top100Names');
const {
  getRandomGender,
  createUsername,
  createEmail,
  createPassword,
  getRandomInt,
} = require('./utils');
const company = 'supercompany';

module.exports = async function createUser(role) {
  const gender = getRandomGender();
  const firstName = names.firstNames[gender][getRandomInt(0, 99)];
  const lastName = names.lastNames[gender][getRandomInt(0, 99)];
  const email = createEmail(firstName, lastName, company);
  const username = createUsername(firstName, lastName);
  const password = await createPassword('heslo');
  return {
    username,
    firstName,
    lastName,
    email,
    password,
    role,
  };
};

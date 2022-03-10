const bcrypt = require('bcrypt');

const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const normalize = (str) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const createUsername = (firstName, lastName) => {
  const username = [lastName, firstName].map((str) => str.slice(0, 3)).join('');
  return normalize(username);
};

const createEmail = (firstName, lastName, company) =>
  `${normalize(firstName)}.${normalize(lastName)}@${normalize(company)}.cz`;

const createPassword = async (str) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(str, salt);
};

const getRandomGender = () => (Math.random() < 0.5 ? 'male' : 'female');

module.exports = {
  getRandomGender,
  createUsername,
  createEmail,
  createPassword,
  getRandomInt,
};

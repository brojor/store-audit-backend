const cityNames = require('./cityNames.json');
const streetNames = require('./streetNames.json');

const brands = ['MyCompany', 'SuperBrand', 'FakeName'];

const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const getCity = () => {
  const numOfCities = cityNames.length;
  return cityNames[getRandomInt(0, numOfCities - 1)];
};

const getStreet = () => {
  const numOfStreets = cityNames.length;
  const street = streetNames[getRandomInt(0, numOfStreets - 1)];
  const number = getRandomInt(1, 300);
  return `${street} ${number}`;
};

const getZipCode = () => {
  const code = [...Array(5)].map(() => getRandomInt(1, 9));
  code.splice(3, 0, ' ');
  return code.join('');
};

const createStoreName = (city) => {
  const brand = brands[Math.floor(Math.random() * brands.length)];
  return `${brand} ${city}`;
};

const createStoreAddress = (city) => {
  const street = getStreet();
  const zipCode = getZipCode();
  return `${street}, ${zipCode} ${city}`;
};

module.exports = {
  getRandomInt,
  createStoreName,
  getCity,
  createStoreAddress,
};

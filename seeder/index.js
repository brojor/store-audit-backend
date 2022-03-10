const createUser = require('./faker/user');
const { initDb, getDb } = require('../db');
const { getListOfPointsIds, getWeights } = require('../model/points');
const fakeResults = require('./faker/results');
const {
  getListOfRegionalManagers,
  getRandomRegionalManager,
  getStoreManagers,
} = require('../model/users');
const { getStoresBelongsManager } = require('../model/stores');
const categories = require('./categories.json');
const points = require('./points.json');

const { createAudit } = require('./audit');
const { createStore } = require('./faker/store');

const roles = [
  { name: 'topManagement', count: 1 },
  { name: 'regionalManager', count: 6 },
  { name: 'storeManager', count: 40 },
];

initDb(async (err) => {
  if (err) {
    throw new Error(err);
  }
  await seedUsers();
  await seedStores();
  await seedCategories();
  await seedCategoryPoints();
  await seedAudits(12);
  console.log('Database populated successfully');
  process.exit();
});

async function seedUsers() {
  return Promise.all(
    roles
      .map((role) =>
        [...Array(role.count)].map(async () => {
          const user = await createUser(role.name);
          return getDb().collection('users').insertOne(user);
        })
      )
      .flat()
  );
}

async function seedStores() {
  const storeManagers = await getStoreManagers();
  return Promise.all(
    storeManagers.map(async (storeManager) => {
      const regionalManager = await getRandomRegionalManager();
      const store = createStore(storeManager, regionalManager);
      return getDb().collection('stores').insertOne(store);
    })
  );
}

async function seedCategories() {
  return getDb().collection('categories').insertMany(categories);
}

async function seedCategoryPoints() {
  return getDb().collection('points').insertMany(points);
}

async function seedAudits(count, type = 'new') {
  if (type === 'new') {
    const regionalManagers = await getListOfRegionalManagers();
    const categoryPointsIds = await getListOfPointsIds();
    const weights = await getWeights();

    for (const regionalManager of regionalManagers) {
      const stores = await getStoresBelongsManager(regionalManager);
      for (const store of stores) {
        const dates = generateDates(count);
        for (const date of dates) {
          const results = fakeResults(categoryPointsIds);
          const audit = await createAudit({
            weights,
            store,
            results,
            auditor: regionalManager._id,
            date,
          });
          await getDb().collection('audits').insertOne(audit);
        }
      }
    }
  } else {
    // mongorestore file
  }
}

function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateDates(count) {
  const arr = [];
  const today = new Date();
  for (let index = 0; index < count; index++) {
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = randomIntFromInterval(1, daysInMonth(month, year));
    const hour = randomIntFromInterval(8, 16);
    const minuts = randomIntFromInterval(0, 59);
    arr.push(new Date(year, month, day, hour, minuts));
    today.setMonth(today.getMonth() - 1);
  }
  return arr.reverse();
}

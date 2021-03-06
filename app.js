const express = require('express');
const app = express();
const http = require('http').createServer(app);
const authRoutes = require('./routes/auth');
const chartRoutes = require('./routes/chart');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

const { protect } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');
const {
  stores,
  results,
  audits,
  changeResult,
} = require('./controllers/audit');
const { getCategoryNames } = require('./controllers/categoryNames');

dotenv.config({ path: './config/.env' });

app.use(cors());
app.use(express.json());
// app.use(morgan('tiny'));

app.use('/auth', authRoutes);
app.use(protect);
app.get('/protected-route', (req, res) => res.sendStatus(200));
app.use('/chart', chartRoutes);

app.get('/stores', stores);
app.post('/results', results);
app.get('/audits/:storeId', audits);
app.post('/audits/:auditId', changeResult);
app.get('/category-names', getCategoryNames);

app.use(errorHandler);

module.exports = http;

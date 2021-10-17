const express = require('express');
const app = express();
const http = require('http').createServer(app);
const authRoutes = require('./routes/auth');
const dotenv = require('dotenv');
const cors = require('cors');

const { protect } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');
const {
  stores,
  results,
  audits,
  changeResult,
} = require('./controllers/audit');
const { individualy } = require('./controllers/summary');

dotenv.config({ path: './config/.env' });

app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes);

app.get('/stores', protect, stores);
app.post('/results', protect, results);
app.get('/audits/:storeId', audits);
app.post('/audits/:auditId', changeResult);
app.get('/summary/individualy', individualy);

app.use(errorHandler);

module.exports = http;

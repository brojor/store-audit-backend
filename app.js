const express = require('express');
const app = express();
const http = require('http').createServer(app);
const authRoutes = require('./routes/auth');
const dotenv = require('dotenv');
const cors = require('cors');

const { protect } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');
const { stores, results, audits } = require('./controllers/audit');

dotenv.config({ path: './config/.env' });

app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes);

app.get('/stores', protect, stores);
app.post('/results', protect, results);

// app.post('/audits', audits);

app.get('/audits/:storeId', audits);

app.use(errorHandler);

module.exports = http;

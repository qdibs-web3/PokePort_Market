const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock req.query for dynamic routes
function createMockHandler(handler, params = {}) {
  return async (req, res) => {
    // Add dynamic params to req.query
    req.query = { ...req.query, ...params };
    return handler(req, res);
  };
}

// API Routes
app.use('/api/cards', require('./cards'));
app.use('/api/users/auth', require('./users/auth'));
app.use('/api/orders', require('./orders'));

// Dynamic routes
app.get('/api/cards/:id', (req, res) => {
  const handler = require('./cards/[id]');
  req.query.id = req.params.id;
  return handler(req, res);
});

app.put('/api/cards/:id', (req, res) => {
  const handler = require('./cards/[id]');
  req.query.id = req.params.id;
  return handler(req, res);
});

app.delete('/api/cards/:id', (req, res) => {
  const handler = require('./cards/[id]');
  req.query.id = req.params.id;
  return handler(req, res);
});

app.post('/api/orders/:id/confirm', (req, res) => {
  const handler = require('./orders/[id]/confirm');
  req.query.id = req.params.id;
  return handler(req, res);
});

app.get('/api/orders/user/:wallet_address', (req, res) => {
  const handler = require('./orders/user/[wallet_address]');
  req.query.wallet_address = req.params.wallet_address;
  return handler(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Pokemon Marketplace API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  GET  /api/cards');
  console.log('  POST /api/cards');
  console.log('  GET  /api/cards/:id');
  console.log('  PUT  /api/cards/:id');
  console.log('  POST /api/users/auth');
  console.log('  GET  /api/orders');
  console.log('  POST /api/orders');
  console.log('  POST /api/orders/:id/confirm');
  console.log('  GET  /api/orders/user/:wallet_address');
});


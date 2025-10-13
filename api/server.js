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

// IMPORTANT: Specific routes MUST come BEFORE general routes
// Otherwise app.use('/api/orders') will catch everything

// Dynamic routes for cards (specific routes first)
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

// Dynamic routes for orders (specific routes BEFORE general /api/orders)
app.post('/api/orders/:id/confirm', (req, res) => {
  const handler = require('./orders/[id]/confirm');
  req.query.id = req.params.id;
  return handler(req, res);
});

// Order status update - support both PUT and PATCH
app.put('/api/orders/:id/status', (req, res) => {
  console.log('PUT /api/orders/:id/status called with params:', req.params);
  const handler = require('./orders/[id]/status');
  req.query.id = req.params.id;
  console.log('Set req.query.id to:', req.query.id);
  return handler(req, res);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const handler = require('./orders/[id]/status');
  req.query.id = req.params.id;
  return handler(req, res);
});

app.get('/api/orders/user/:wallet_address', (req, res) => {
  console.log('GET /api/orders/user/:wallet_address called with params:', req.params);
  const handler = require('./orders/user/[wallet_address]');
  req.query.wallet_address = req.params.wallet_address;
  console.log('Set req.query.wallet_address to:', req.query.wallet_address);
  return handler(req, res);
});

app.post('/api/orders/notify-admin', (req, res) => {
  const handler = require('./orders/notify-admin');
  return handler(req, res);
});

// General API Routes (MUST come AFTER specific routes)
app.use('/api/cards', require('./cards'));
app.use('/api/users/auth', require('./users/auth'));
app.use('/api/orders', require('./orders'));

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
  console.log('  DELETE /api/cards/:id');
  console.log('  POST /api/users/auth');
  console.log('  GET  /api/orders');
  console.log('  POST /api/orders');
  console.log('  POST /api/orders/:id/confirm');
  console.log('  PUT  /api/orders/:id/status');
  console.log('  PATCH /api/orders/:id/status');
  console.log('  POST /api/orders/notify-admin');
  console.log('  GET  /api/orders/user/:wallet_address');
});
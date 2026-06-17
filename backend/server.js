require('dotenv').config();
const dns = require('dns');

// Configure DNS servers to prevent querySrv ECONNREFUSED on local system
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('Failed to set DNS servers:', err);
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const conversationRoutes = require('./routes/conversations');
const folderRoutes = require('./routes/folders');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

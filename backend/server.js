
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const seedDatabase = require('./config/seedData');


dotenv.config();


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

connectDB().then(() => {
  if (process.env.NODE_ENV === 'development') {
    seedDatabase();
  }
});


const outpassRoutes = require('./routes/outpassRoutes');
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use('/api', outpassRoutes);
app.use('/api/auth', authRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Digital Outpass API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

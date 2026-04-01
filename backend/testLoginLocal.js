require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { login } = require('./src/controllers/authController');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB connected');

  const req = {
    body: {
      email: process.env.ADMIN_EMAIL || 'admin@placementtracker.dev',
      password: process.env.ADMIN_PASSWORD || 'Admidn@1234'
    }
  };

  const res = {
    status(code) {
      console.log('RES STATUS:', code);
      return this;
    },
    json(data) {
      console.log('RES JSON:', data);
      return this;
    }
  };

  const next = (err) => {
    console.log('NEXT CALLED WITH ERROR:', err);
  };

  try {
    await login(req, res, next);
  } catch (err) {
    console.log('UNCAUGHT EXCEPTION IN LOGIN:', err);
  }

  await mongoose.disconnect();
}

test().catch(console.error);

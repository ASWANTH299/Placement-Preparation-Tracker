const mongoose = require('mongoose');
require('dotenv').config();

async function dropPhoneNumberIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_tracker');
    console.log('Connected to MongoDB');

    // Get the User collection
    const collection = mongoose.connection.collection('users');

    // Drop the unique index on phoneNumber
    try {
      await collection.dropIndex('phoneNumber_1');
      console.log('✅ Successfully dropped phoneNumber_1 index');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️  phoneNumber_1 index does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    console.log('✅ Index cleanup complete. You can now register without phone number errors.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropPhoneNumberIndex();

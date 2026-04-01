#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is not set in .env\n');
  process.exit(1);
}

async function fixDatabase() {
  console.log('\n========================================');
  console.log('  Database Fix Script (phoneNumber removal)');
  console.log('========================================\n');

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check if the index exists
    const indexes = await usersCollection.indexes();
    const phoneIndex = indexes.find(i => i.name === 'phoneNumber_1' || i.key.phoneNumber === 1);

    if (phoneIndex) {
      console.log(`⚠️  Index "${phoneIndex.name}" found. Dropping it...`);
      await usersCollection.dropIndex(phoneIndex.name);
      console.log(`✅ Index "${phoneIndex.name}" dropped safely.`);
    } else {
      console.log('✅ Index "phoneNumber_1" not found. DB is already clean.');
    }

    // Remove the phoneNumber field from all documents
    console.log('🧹 Cleaning up any remaining "phoneNumber" fields in users collection...');
    const updateResult = await usersCollection.updateMany(
      { phoneNumber: { $exists: true } },
      { $unset: { phoneNumber: "" } }
    );
    
    console.log(`✅ Cleanup complete. Modified ${updateResult.modifiedCount} documents.`);

    console.log('\n✅ Database fix completed successfully.\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing database:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

fixDatabase();

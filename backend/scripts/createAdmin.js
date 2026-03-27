#!/usr/bin/env node

/**
 * Admin Seeding Script
 * Creates an admin user from environment variables.
 * Usage: npm run seed:admin
 *
 * Reads: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env
 * - Hashes password with bcrypt
 * - Prevents duplicate creation (checks by email)
 * - Does NOT expose any public API — CLI only
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// ─── Configuration ───────────────────────────────────────────────────────────
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const MONGODB_URI = process.env.MONGODB_URI;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

// ─── Validation ──────────────────────────────────────────────────────────────
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('\n❌  Missing required environment variables.');
  console.error('   Ensure ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are set in .env\n');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('\n❌  MONGODB_URI is not set in .env\n');
  process.exit(1);
}

// Import User model after dotenv is loaded
const User = require('../src/models/User');

// ─── Main ────────────────────────────────────────────────────────────────────
async function createAdmin() {
  console.log('\n========================================');
  console.log('  Admin Seeding Script');
  console.log('========================================\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅  Connected to MongoDB');

    // Check for existing admin
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log(`⚠️   Admin already exists: ${ADMIN_EMAIL}`);
        console.log('   No changes made. Exiting.\n');
      } else {
        console.log(`⚠️   A user with email ${ADMIN_EMAIL} exists but has role "${existingAdmin.role}".`);
        console.log('   To avoid conflicts, please use a different ADMIN_EMAIL.\n');
      }
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password (bypassing the pre-save hook since we set it directly)
    const salt = await bcryptjs.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, salt);

    // Create admin user directly to bypass pre-save double-hashing
    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: ADMIN_EMAIL.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    // The pre-save hook will re-hash the already-hashed password.
    // To avoid this, we use updateOne to set the password directly.
    await User.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword } }
    );

    console.log('✅  Admin user created successfully!');
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log('\n   You can now log in with these credentials.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌  Error creating admin:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createAdmin();

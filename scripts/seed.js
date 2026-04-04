import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import FinancialRecord from '../src/models/FinancialRecord.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    const userDefinitions = [
      { name: 'Admin User', email: 'admin@acme.com', password: 'admin123', role: 'admin' },
      { name: 'Analyst User', email: 'analyst@acme.com', password: 'analyst123', role: 'analyst' },
      { name: 'Viewer User', email: 'viewer@acme.com', password: 'viewer123', role: 'viewer' },
    ];

    const users = {};

    for (const userDef of userDefinitions) {
      let user = await User.findOne({ email: userDef.email });
      if (!user) {
        user = await User.create(userDef);
        console.log(`Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`User already exists: ${user.email} (${user.role})`);
      }
      users[userDef.role] = user;
    }

    const existingSampleCount = await FinancialRecord.countDocuments({
      createdBy: { $in: Object.values(users).map((user) => user._id) },
    });

    if (existingSampleCount === 0) {
      const records = [
        {
          amount: 120000,
          type: 'income',
          category: 'other_income',
          date: new Date('2025-01-05'),
          notes: 'Monthly retainer from corporate client',
          createdBy: users.admin._id,
        },
        {
          amount: 40000,
          type: 'expense',
          category: 'salaries',
          date: new Date('2025-01-10'),
          notes: 'Payroll for January',
          createdBy: users.admin._id,
        },
        {
          amount: 12000,
          type: 'expense',
          category: 'rent',
          date: new Date('2025-01-20'),
          notes: 'Office rent for January',
          createdBy: users.admin._id,
        },
        {
          amount: 9500,
          type: 'expense',
          category: 'utilities',
          date: new Date('2025-02-03'),
          notes: 'Electricity and internet bills',
          createdBy: users.analyst._id,
        },
        {
          amount: 45000,
          type: 'income',
          category: 'other_income',
          date: new Date('2025-02-14'),
          notes: 'Consulting project milestone payment',
          createdBy: users.admin._id,
        },
        {
          amount: 15000,
          type: 'expense',
          category: 'software',
          date: new Date('2025-02-28'),
          notes: 'Annual SaaS subscriptions',
          createdBy: users.analyst._id,
        },
        {
          amount: 7000,
          type: 'expense',
          category: 'travel',
          date: new Date('2025-03-08'),
          notes: 'Client visit travel expenses',
          createdBy: users.analyst._id,
        },
        {
          amount: 62000,
          type: 'income',
          category: 'other_income',
          date: new Date('2025-03-15'),
          notes: 'Quarterly consulting revenue',
          createdBy: users.admin._id,
        },
        {
          amount: 11000,
          type: 'expense',
          category: 'utilities',
          date: new Date('2025-03-22'),
          notes: 'Office utility bills',
          createdBy: users.analyst._id,
        },
        {
          amount: 43000,
          type: 'expense',
          category: 'salaries',
          date: new Date('2025-04-01'),
          notes: 'Payroll for April',
          createdBy: users.admin._id,
        },
        {
          amount: 12500,
          type: 'expense',
          category: 'rent',
          date: new Date('2025-04-10'),
          notes: 'Office rent for April',
          createdBy: users.admin._id,
        },
        {
          amount: 3800,
          type: 'expense',
          category: 'other_expense',
          date: new Date('2025-04-18'),
          notes: 'Team snacks and office supplies',
          createdBy: users.viewer._id,
        },
      ];

      await FinancialRecord.insertMany(records);
      console.log(`Created ${records.length} sample financial records.`);
    } else {
      console.log(`Found ${existingSampleCount} existing sample records. Skipping record insert.`);
    }

    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();

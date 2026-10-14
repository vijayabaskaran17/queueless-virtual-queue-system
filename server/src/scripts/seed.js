require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Token = require('../models/Token');
const QueueLog = require('../models/QueueLog');
const QueueSetting = require('../models/QueueSetting');
const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const StaffInvitation = require('../models/StaffInvitation');

const seedData = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/queueless';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Connected to MongoDB');

    // Clear existing collections
    await User.deleteMany({});
    await Service.deleteMany({});
    await Counter.deleteMany({});
    await Token.deleteMany({});
    await QueueLog.deleteMany({});
    await QueueSetting.deleteMany({});
    await Notification.deleteMany({});
    await Organization.deleteMany({});
    await StaffInvitation.deleteMany({});

    console.log('[Seed] Cleared existing data');

    // 1. Create Default Queue Settings
    await QueueSetting.create({
      maxTokensPerCustomerPerDay: 5,
      businessHoursStart: '08:30',
      businessHoursEnd: '17:30',
      allowCancellation: true,
      autoNotifyApproachingThreshold: 3,
      soundAlertsEnabled: true,
    });

    // 2. Create Services
    const serviceAcc = await Service.create({
      name: 'Account Services & Inquiries',
      code: 'ACC',
      prefix: 'A',
      description: 'New accounts, KYC updates, statement requests, and general banking inquiries.',
      avgDuration: 10,
      color: '#4f46e5',
      icon: 'CreditCard',
      isActive: true,
      dailyTokenCounter: 4,
    });

    const serviceCsh = await Service.create({
      name: 'Cash Deposits & Withdrawals',
      code: 'CSH',
      prefix: 'C',
      description: 'High-speed teller counter for cash deposits, withdrawals, and demand drafts.',
      avgDuration: 5,
      color: '#0d9488',
      icon: 'Banknote',
      isActive: true,
      dailyTokenCounter: 6,
    });

    const serviceLon = await Service.create({
      name: 'Loan & Mortgage Advisory',
      code: 'LON',
      prefix: 'L',
      description: 'Home loans, personal financing, business credit consultations, and document verification.',
      avgDuration: 20,
      color: '#f59e0b',
      icon: 'Building2',
      isActive: true,
      dailyTokenCounter: 2,
    });

    const serviceWlt = await Service.create({
      name: 'Wealth & Investment Planning',
      code: 'WLT',
      prefix: 'W',
      description: 'Portfolio advisory, mutual funds, retirement planning, and fixed deposit schemes.',
      avgDuration: 25,
      color: '#8b5cf6',
      icon: 'TrendingUp',
      isActive: true,
      dailyTokenCounter: 1,
    });

    const serviceHlp = await Service.create({
      name: 'Help Desk',
      code: 'HLP',
      prefix: 'H',
      description: 'General support, customer inquiries, document checks, and branch guidance.',
      avgDuration: 8,
      color: '#0284c7',
      icon: 'Layers',
      isActive: true,
      dailyTokenCounter: 0,
    });

    console.log('[Seed] Created Services');

    // 3. Create Verified Organization
    const defaultOrg = await Organization.create({
      name: 'Apex Global Banking & Services',
      code: 'APEX-BANK',
      description: 'Primary verified branch organization for QueueLess queue operations.',
      status: 'verified',
      requireEmployeeId: false,
    });

    console.log('[Seed] Created Verified Organization:', defaultOrg.name);

    // 4. Create Users (Admin, Staff, Customers)
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@queless.admin.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1 (555) 019-2834',
      organization: defaultOrg._id,
    });

    defaultOrg.admin = adminUser._id;
    await defaultOrg.save();

    const staff1 = await User.create({
      name: 'Sarah Jenkins',
      email: 'staff1@queless.staff.com',
      password: 'staff123',
      role: 'staff',
      phone: '+1 (555) 014-9921',
      organization: defaultOrg._id,
      employeeId: 'EMP-STF-001',
    });

    const staff2 = await User.create({
      name: 'David Vance',
      email: 'staff2@queless.staff.com',
      password: 'staff123',
      role: 'staff',
      phone: '+1 (555) 018-4432',
      organization: defaultOrg._id,
      employeeId: 'EMP-STF-002',
    });

    const customerUser = await User.create({
      name: 'Alex Rivera',
      email: 'customer@queueless.com',
      password: 'customer123',
      role: 'customer',
      phone: '+1 (555) 012-7788',
      documentType: 'passport',
      documentNumber: 'P82910482',
    });

    const customer2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'customer123',
      role: 'customer',
      phone: '+1 (555) 016-3399',
      documentType: 'national_id',
      documentNumber: 'NID-992104',
    });

    console.log('[Seed] Created Users');

    // 4. Create Counters
    const counter1 = await Counter.create({
      counterNumber: 1,
      name: 'Counter 1 - Account Services & Inquiries',
      assignedStaff: staff1._id,
      supportedServices: [serviceAcc._id],
      status: 'open',
      totalServedToday: 14,
    });

    const counter2 = await Counter.create({
      counterNumber: 2,
      name: 'Counter 2 - Cash Deposits & Withdrawals',
      assignedStaff: staff2._id,
      supportedServices: [serviceCsh._id],
      status: 'open',
      totalServedToday: 21,
    });

    const counter3 = await Counter.create({
      counterNumber: 3,
      name: 'Counter 3 - Loan & Mortgage Advisory',
      assignedStaff: null,
      supportedServices: [serviceLon._id],
      status: 'open',
      totalServedToday: 7,
    });

    const counter4 = await Counter.create({
      counterNumber: 4,
      name: 'Counter 4 - Wealth & Investment Planning',
      assignedStaff: null,
      supportedServices: [serviceWlt._id],
      status: 'open',
      totalServedToday: 5,
    });

    const counter5 = await Counter.create({
      counterNumber: 5,
      name: 'Help Desk',
      assignedStaff: null,
      supportedServices: [serviceHlp._id],
      status: 'open',
      totalServedToday: 0,
    });

    // Update staff assigned counter
    await User.findByIdAndUpdate(staff1._id, { assignedCounter: counter1._id });
    await User.findByIdAndUpdate(staff2._id, { assignedCounter: counter2._id });

    console.log('[Seed] Created Counters & Assigned Staff');

    // 5. Create Sample Tokens
    // Alex has an active waiting token in Account Services
    const alexActiveToken = await Token.create({
      tokenNumber: 'A003',
      sequenceNumber: 3,
      service: serviceAcc._id,
      customer: customerUser._id,
      status: 'waiting',
      joinedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      estimatedWaitTime: 8,
      notes: 'Need to update linked phone and KYC document.',
    });

    // Priya has an active in_progress token at Counter 1
    const priyaToken = await Token.create({
      tokenNumber: 'A002',
      sequenceNumber: 2,
      service: serviceAcc._id,
      customer: customer2._id,
      status: 'in_progress',
      counter: counter1._id,
      servedBy: staff1._id,
      joinedAt: new Date(Date.now() - 35 * 60 * 1000),
      calledAt: new Date(Date.now() - 10 * 60 * 1000),
      startedAt: new Date(Date.now() - 8 * 60 * 1000),
    });

    // Link current serving token to Counter 1
    counter1.currentServingToken = priyaToken._id;
    await counter1.save();

    // A completed token
    await Token.create({
      tokenNumber: 'A001',
      sequenceNumber: 1,
      service: serviceAcc._id,
      customer: customerUser._id,
      status: 'completed',
      counter: counter1._id,
      servedBy: staff1._id,
      joinedAt: new Date(Date.now() - 60 * 60 * 1000),
      calledAt: new Date(Date.now() - 45 * 60 * 1000),
      startedAt: new Date(Date.now() - 43 * 60 * 1000),
      completedAt: new Date(Date.now() - 35 * 60 * 1000),
      notes: 'Savings account opened successfully.',
    });

    // Another waiting token in Cash Deposits
    await Token.create({
      tokenNumber: 'C005',
      sequenceNumber: 5,
      service: serviceCsh._id,
      customer: customer2._id,
      status: 'waiting',
      joinedAt: new Date(Date.now() - 5 * 60 * 1000),
      estimatedWaitTime: 4,
    });

    // 6. Create Initial Notifications
    await Notification.create({
      recipient: customerUser._id,
      title: 'Token Generated',
      message: 'Your token A003 has been issued for Account Services & Inquiries. Current position: #1 in line.',
      type: 'info',
      token: alexActiveToken._id,
      isRead: false,
    });

    await Notification.create({
      recipient: customerUser._id,
      title: 'Service Completed',
      message: 'Token A001 was successfully completed at Counter 1. Thank you for visiting!',
      type: 'success',
      isRead: true,
    });

    // 7. Audit log entries
    await QueueLog.create({
      token: alexActiveToken._id,
      action: 'created',
      performedBy: customerUser._id,
      details: 'Token A003 created via Web Portal',
    });

    await QueueLog.create({
      token: priyaToken._id,
      action: 'called',
      performedBy: staff1._id,
      counter: counter1._id,
      details: 'Token A002 called to Counter 1 - General Banking',
    });

    console.log('[Seed] Database successfully seeded with demo accounts, services, counters, and active queues!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();

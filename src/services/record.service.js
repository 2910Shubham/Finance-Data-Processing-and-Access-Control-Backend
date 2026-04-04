import mongoose from 'mongoose';
import FinancialRecord from '../models/FinancialRecord.js';

// ─── Get all records (with filters + pagination) ──────────────────────────────

export const getAllRecords = async (filters = {}) => {
  const {
    type,
    category,
    from,
    to,
    page = 1,
    limit = 10,
  } = filters;

  const query = { deletedAt: null };

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = category.toLowerCase().trim();
  }

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to)   query.date.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // cap at 100
  const skip     = (pageNum - 1) * limitNum;

  const [records, total] = await Promise.all([
    FinancialRecord.find(query)
      .populate('createdBy', 'name email role')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum),
    FinancialRecord.countDocuments(query),
  ]);

  return {
    records,
    pagination: {
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext:    pageNum < Math.ceil(total / limitNum),
      hasPrev:    pageNum > 1,
    },
  };
};

// ─── Get single record by id ──────────────────────────────────────────────────

export const getRecordById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  return FinancialRecord.findOne({ _id: id, deletedAt: null })
    .populate('createdBy', 'name email role');
};

// ─── Create record ────────────────────────────────────────────────────────────

export const createRecord = async (data) => {
  const record = await FinancialRecord.create({
    amount:    data.amount,
    type:      data.type,
    category:  data.category.toLowerCase().trim(),
    date:      new Date(data.date),
    notes:     data.notes || '',
    createdBy: data.createdBy,
  });

  return record.populate('createdBy', 'name email role');
};

// ─── Update record ────────────────────────────────────────────────────────────

export const updateRecord = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const allowedUpdates = {};

  if (data.amount   !== undefined) allowedUpdates.amount   = data.amount;
  if (data.type     !== undefined) allowedUpdates.type     = data.type;
  if (data.category !== undefined) allowedUpdates.category = data.category.toLowerCase().trim();
  if (data.date     !== undefined) allowedUpdates.date     = new Date(data.date);
  if (data.notes    !== undefined) allowedUpdates.notes    = data.notes;

  const record = await FinancialRecord.findOneAndUpdate(
    { _id: id, deletedAt: null }, // never update a soft-deleted record
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email role');

  return record; // null if not found or already deleted
};

// ─── Soft delete ──────────────────────────────────────────────────────────────

export const softDeleteRecord = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const record = await FinancialRecord.findOneAndUpdate(
    { _id: id, deletedAt: null }, // idempotent — already deleted returns null
    { $set: { deletedAt: new Date() } },
    { new: true }
  );

  return record; // null if not found or already deleted
};
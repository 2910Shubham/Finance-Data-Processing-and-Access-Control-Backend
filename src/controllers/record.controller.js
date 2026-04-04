import * as recordService from '../services/record.service.js';

// ─── Get all records ──────────────────────────────────────────────────────────

export const getAllRecords = async (req, res) => {
  try {
    const { type, category, from, to, page, limit } = req.query;

    const result = await recordService.getAllRecords({
      type,
      category,
      from,
      to,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch records.',
    });
  }
};

// ─── Get single record ────────────────────────────────────────────────────────

export const getRecord = async (req, res) => {
  try {
    const record = await recordService.getRecordById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch record.',
    });
  }
};

// ─── Create record ────────────────────────────────────────────────────────────

export const createRecord = async (req, res) => {
  try {
    const record = await recordService.createRecord({
      ...req.body,
      createdBy: req.user.id, // injected by verifyToken
    });

    return res.status(201).json({
      success: true,
      message: 'Record created successfully.',
      data: record,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create record.',
    });
  }
};

// ─── Update record ────────────────────────────────────────────────────────────

export const updateRecord = async (req, res) => {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or has been deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Record updated successfully.',
      data: record,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update record.',
    });
  }
};

// ─── Delete record (soft) ─────────────────────────────────────────────────────

export const deleteRecord = async (req, res) => {
  try {
    const record = await recordService.softDeleteRecord(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Record deleted successfully.',
      data: { id: record._id, deletedAt: record.deletedAt },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete record.',
    });
  }
};
import mongoose from 'mongoose';

const financialRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be income or expense',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum : {
        values: ["salaries", "rent", "utilities", "software", "travel", "other_income", "other_expense"],
        message: "Invalid category"
      }
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null, // null = active, Date = soft-deleted
    },
  },
  {
    timestamps: true,
  }
);

// Index for common query patterns — keeps filtering fast
financialRecordSchema.index({ type: 1, date: -1 });
financialRecordSchema.index({ category: 1 });
financialRecordSchema.index({ createdBy: 1 });
financialRecordSchema.index({ deletedAt: 1 }); // fast soft-delete filter

// Query helper — automatically excludes soft-deleted records
// Usage: FinancialRecord.active().find({...})
financialRecordSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);
export default FinancialRecord;
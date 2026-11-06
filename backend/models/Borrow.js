const mongoose = require('mongoose');

const finePerDay = () => Number(process.env.FINE_PER_DAY || 5);

const borrowSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    borrowedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: Date,
    status: { type: String, enum: ['borrowed', 'returned'], default: 'borrowed', index: true },
    fine: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

borrowSchema.virtual('isOverdue').get(function () {
  return this.status === 'borrowed' && this.dueDate < new Date();
});

// Fine owed right now (active loans) or the fine charged at return
borrowSchema.virtual('currentFine').get(function () {
  if (this.status === 'returned') return this.fine;
  const days = Math.ceil((Date.now() - this.dueDate) / 86400000);
  return days > 0 ? days * finePerDay() : 0;
});

borrowSchema.statics.fineFor = function (dueDate, returnedAt = new Date()) {
  const days = Math.ceil((returnedAt - dueDate) / 86400000);
  return days > 0 ? days * finePerDay() : 0;
};

module.exports = mongoose.model('Borrow', borrowSchema);

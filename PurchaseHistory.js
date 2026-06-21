import mongoose from 'mongoose';

const purchaseHistorySchema = new mongoose.Schema(
  {
    // The lock is tied to the RECIPIENT's number (the number that receives the bundle),
    // not the payer's number. This stops one payer from buying "once-per-day" deals
    // for unlimited different recipients being used as a workaround in reverse,
    // and correctly stops a recipient from receiving 2 once-per-day deals in the
    // same calendar day even if paid for by different people.
    recipientPhone: {
      type: String,
      required: true,
      index: true
    },
    payerPhone: {
      type: String,
      required: true
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true
    },
    // Calendar day this purchase counts against, in EAT (Africa/Nairobi), as YYYY-MM-DD.
    // Pre-computed at write time so lookups are simple equality checks, not date-range queries.
    purchaseDay: {
      type: String,
      required: true,
      index: true
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// The actual enforcement index: one once-per-day-category purchase per recipient per day.
purchaseHistorySchema.index(
  { recipientPhone: 1, category: 1, purchaseDay: 1 }
);

export default mongoose.model('PurchaseHistory', purchaseHistorySchema);

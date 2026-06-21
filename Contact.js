import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }, // normalized E.164, e.g. +254712345678
    email: { type: String, default: '', trim: true },

    countryCode: { type: String, default: '' }, // e.g. "254"
    countryName: { type: String, default: '' }, // e.g. "Kenya"

    isDuplicate: { type: Boolean, default: false }, // flagged at insert time
  },
  { timestamps: true }
);

// Speed up duplicate lookups within a session
contactSchema.index({ sessionId: 1, phone: 1 });

export default mongoose.model('Contact', contactSchema);

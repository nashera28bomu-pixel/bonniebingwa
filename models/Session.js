import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    // Public shareable join slug, e.g. cymorvcf.com/join/abc123
    joinSlug: { type: String, required: true, unique: true, index: true },

    // Admin/owner auth — phone + PIN, no full account system needed
    ownerPhone: { type: String, required: true },
    ownerPin: { type: String, required: true }, // hashed
    adminToken: { type: String, required: true, unique: true, index: true },

    whatsappGroupLink: { type: String, default: '' },
    targetCount: { type: Number, default: 0 }, // 0 = no target set

    emojiPrefix: { type: String, default: '' }, // applied only at export time

    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true }, // shows on homepage feed

    contactCount: { type: Number, default: 0 }, // denormalized for fast homepage reads
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);

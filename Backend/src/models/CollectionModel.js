const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String },
        image: { type: String },
        isActive: { type: Boolean, default: true },
        isTrending: { type: Boolean, default: false },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    {
        timestamps: true,
    }
);

const Collection = mongoose.model('Collection', collectionSchema);
module.exports = Collection;


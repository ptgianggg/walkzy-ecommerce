const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String },
        image: { type: String },
        isActive: { type: Boolean, default: true },
        parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // Cho danh mục con
    },
    {
        timestamps: true,
    }
);

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;


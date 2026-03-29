const mongoose = require('mongoose')

const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['color', 'size', 'material'],
      required: true
    },
    value: { type: String, required: true },
    hexCode: { type: String },
    image: { type: String },
    order: { type: Number, default: 0 },
    categories: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category'
        }
      ],
      default: []
    },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
)

attributeSchema.index({ type: 1, value: 1 }, { unique: true })

const Attribute = mongoose.model('Attribute', attributeSchema)
module.exports = Attribute

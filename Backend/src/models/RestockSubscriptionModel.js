const mongoose = require('mongoose');

const restockSubscriptionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        variation: {
            color: { type: String, default: '' },
            size: { type: String, default: '' },
            material: { type: String, default: '' },
            sku: { type: String, default: '' }
        },
        isNotified: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const RestockSubscription = mongoose.model('RestockSubscription', restockSubscriptionSchema);

module.exports = RestockSubscription;

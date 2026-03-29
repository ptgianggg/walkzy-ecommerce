const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        cartItems: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                amount: { type: Number, required: true },
                variation: {
                    color: { type: String },
                    size: { type: String },
                    material: { type: String },
                    sku: { type: String }
                },
                // Include snapshot fields if helpful, but primarily rely on product populate
                name: { type: String, required: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
            }
        ],
    },
    {
        timestamps: true,
    }
);

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

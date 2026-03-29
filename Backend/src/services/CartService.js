const Cart = require("../models/CartModel")

const getProductId = (id) => {
    if (id && typeof id === 'object' && id._id) return id._id.toString();
    if (id && typeof id === 'string') return id;
    if (id && id.toString) return id.toString();
    return id;
}

const areVariationsEqual = (v1, v2) => {
    const var1 = v1 || {};
    const var2 = v2 || {};
    return (
        var1.color === var2.color &&
        var1.size === var2.size &&
        var1.material === var2.material
    );
}

const createCart = (newCart) => {
    return new Promise(async (resolve, reject) => {
        const { user, cartItems } = newCart
        try {
            const checkCart = await Cart.findOne({ user: user })
            if (checkCart !== null) {
                resolve({
                    status: 'OK',
                    message: 'The cart is already defined'
                })
            }
            const newCartCreate = await Cart.create({
                user, 
                cartItems: cartItems || []
            })
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: newCartCreate
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getCart = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const cart = await Cart.findOne({ user: userId }).populate('cartItems.product')
            if (cart === null) {
                resolve({
                    status: 'ERR',
                    message: 'The cart is not defined'
                })
            }
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: cart
            })
        } catch (e) {
            reject(e)
        }
    })
}

const addToCart = (userId, newItem) => {
    return new Promise(async (resolve, reject) => {
        try {
            let cart = await Cart.findOne({ user: userId })
            
            if (!cart) {
                cart = await Cart.create({
                    user: userId, 
                    cartItems: [newItem]
                })
            } else {
                const newItemId = getProductId(newItem.product);
                const itemIndex = cart.cartItems.findIndex(item => {
                    return item.product.toString() === newItemId && 
                           areVariationsEqual(item.variation, newItem.variation)
                })

                if (itemIndex > -1) {
                    cart.cartItems[itemIndex].amount += newItem.amount
                } else {
                    cart.cartItems.push(newItem)
                }
                
                await cart.save()
            }
            
            const populatedCart = await Cart.findById(cart._id).populate('cartItems.product')
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: populatedCart
            })
        } catch (e) {
            console.log(e)
            reject(e)
        }
    })
}

const updateCartItem = (userId, itemId, variation, amount) => {
    return new Promise(async (resolve, reject) => {
        try {
            const cart = await Cart.findOne({ user: userId })
            if (!cart) {
                resolve({
                    status: 'ERR',
                    message: 'Cart not found'
                })
                return
            }

            const searchId = getProductId(itemId);
            const itemIndex = cart.cartItems.findIndex(item => {
                return item.product.toString() === searchId &&
                       areVariationsEqual(item.variation, variation)
            })

            if (itemIndex > -1) {
                cart.cartItems[itemIndex].amount = amount
                await cart.save()
                const populatedCart = await Cart.findById(cart._id).populate('cartItems.product')
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: populatedCart
                })
            } else {
                resolve({
                    status: 'ERR',
                    message: 'Item not found in cart'
                })
            }
        } catch (e) {
            reject(e)
        }
    })
}

const deleteCartItem = (userId, itemId, variation) => {
    return new Promise(async (resolve, reject) => {
        try {
            const cart = await Cart.findOne({ user: userId })
            if (!cart) {
                resolve({
                    status: 'ERR',
                    message: 'Cart not found'
                })
                return
            }

            const searchId = getProductId(itemId);
            const newCartItems = cart.cartItems.filter(item => {
                const isMatch = item.product.toString() === searchId &&
                                areVariationsEqual(item.variation, variation);
                return !isMatch;
            })

            cart.cartItems = newCartItems
            await cart.save()
            
            const populatedCart = await Cart.findById(cart._id).populate('cartItems.product')
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: populatedCart
            })
        } catch (e) {
            reject(e)
        }
    })
}

const syncCart = (userId, cartItemsInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            let cart = await Cart.findOne({ user: userId })
            if (!cart) {
                cart = await Cart.create({ user: userId, cartItems: [] })
            }
            
            // 1. Merge logic
            for (let newItem of cartItemsInput) {
                 const newItemId = getProductId(newItem.product);
                 
                 const itemIndex = cart.cartItems.findIndex(item => {
                     return item.product.toString() === newItemId &&
                            areVariationsEqual(item.variation, newItem.variation)
                })

                if (itemIndex > -1) {
                    cart.cartItems[itemIndex].amount = newItem.amount
                    
                    if (newItem.price) cart.cartItems[itemIndex].price = newItem.price
                    if (newItem.image) cart.cartItems[itemIndex].image = newItem.image
                    if (newItem.name) cart.cartItems[itemIndex].name = newItem.name
                } else {
                    cart.cartItems.push(newItem)
                }
            }
            
            // 2. Deduplicate
            const mergedMap = new Map();
            
            for (let item of cart.cartItems) {
                const pid = item.product.toString();
                const v = item.variation || {};
                const key = `${pid}-${v.color||''}-${v.size||''}-${v.material||''}`;
                
                if (mergedMap.has(key)) {
                    // Item duplicate found in DB.
                    // We keep the LAST one encountered in the array?
                    // The loop iterates forward. If we encounter another, it replaces the first?
                    // cart.cartItems might have [A_old, A_new].
                    // We want A_new.
                    mergedMap.set(key, item);
                } else {
                    mergedMap.set(key, item);
                }
            }
            
            cart.cartItems = Array.from(mergedMap.values());
            
            await cart.save()
            const populatedCart = await Cart.findById(cart._id).populate('cartItems.product')
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: populatedCart
            })
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    createCart,
    getCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
    syncCart
}

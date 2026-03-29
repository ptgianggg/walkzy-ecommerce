const CartService = require('../services/CartService')

const createCart = async (req, res) => {
    try {
        const { user, cartItems } = req.body
        if (!user) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        const response = await CartService.createCart(req.body)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const getCart = async (req, res) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The userId is required'
            })
        }
        const response = await CartService.getCart(userId)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const addToCart = async (req, res) => {
    try {
        const userId = req.user.id // Assuming middleware attaches user
        const { orderItem } = req.body
        
        if (!userId || !orderItem) {
             return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        
        const response = await CartService.addToCart(userId, orderItem)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id
        const { product, variation, amount } = req.body
        // product is ID
        
        if (!userId || !product || amount === undefined) {
             return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        
        const response = await CartService.updateCartItem(userId, product, variation, amount)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const deleteCartItem = async (req, res) => {
    try {
        const userId = req.user.id
        const { product, variation } = req.body
        
        if (!userId || !product) {
              return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        
        const response = await CartService.deleteCartItem(userId, product, variation)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

const syncCart = async (req, res) => {
    try {
        const userId = req.user.id
        const { cartItems } = req.body
        
        if (!userId || !cartItems) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }
        
        const response = await CartService.syncCart(userId, cartItems)
        return res.status(200).json(response)
    } catch (e) {
        return res.status(404).json({
            message: e
        })
    }
}

module.exports = {
    createCart,
    getCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
    syncCart
}

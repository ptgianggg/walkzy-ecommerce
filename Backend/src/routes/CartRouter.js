const express = require('express')
const router = express.Router()
const CartController = require('../controllers/CartController')
const { authUserMiddleWare, authMiddleWare } = require('../middleware/authMiddleware')

router.post('/create', CartController.createCart) // Maybe not needed if added automatically
router.get('/get-cart/:id', authUserMiddleWare, CartController.getCart)
router.post('/add-to-cart', authUserMiddleWare, CartController.addToCart)
router.post('/update-cart-item', authUserMiddleWare, CartController.updateCartItem)
router.post('/delete-cart-item', authUserMiddleWare, CartController.deleteCartItem)
router.post('/sync-cart', authUserMiddleWare, CartController.syncCart)

module.exports = router

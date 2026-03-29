import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    orderItems: [],
    orderItemsSelected: [],
    shippingAddress: {

    },
    paymentMethod: '',
    itemsPrice: 0,
    shippingPrice: 0,
    taxPrice: 0,
    totalPrice: 0,
    user: '',
    isPaid: false,
    paiAt: '',
    isDelivered: false,
    deliveredAt: '',
    isSuccessOrder: false,
    isErrorOrder: false,
    errorMessage: '',
    // Voucher state
    appliedVoucher: null,
    voucherDiscount: 0,
    voucherCode: '',
    promotionId: null, // ID của promotion để gửi khi tạo order
    // Freeship code state
    appliedFreeshipCode: null,
    freeshipCode: '',
    freeshipDiscount: 0,
    shippingVoucherId: null, // ID của shipping voucher để gửi khi tạo order
    // Shipping method
    selectedShippingMethod: null, // { providerId, rateId, estimatedDeliveryDate }
}

export const orderSlide = createSlice({
    name: 'order',
    initialState,
    reducers: {
        addorderProduct: (state, action) => {
            const { orderItem } = action.payload
            // Tạo key duy nhất để identify item (product + variation)
            const itemKey = orderItem.variation && (orderItem.variation.color || orderItem.variation.size || orderItem.variation.material)
                ? `${orderItem.product}_${orderItem.variation.color || ''}_${orderItem.variation.size || ''}_${orderItem.variation.material || ''}`
                : orderItem.product
            
            const itemOrder = state?.orderItems?.find((item) => {
                if (item.variation && orderItem.variation) {
                    // So sánh cả product và variation (bao gồm color, size, material)
                    return item.product === orderItem.product &&
                           item.variation?.color === orderItem.variation?.color &&
                           item.variation?.size === orderItem.variation?.size &&
                           item.variation?.material === orderItem.variation?.material
                }
                // Không có variation, chỉ so sánh product
                return item.product === orderItem.product && !item.variation && !orderItem.variation
            })
            
            if (itemOrder) {
                // Kiểm tra stock
                const availableStock = itemOrder.availableStock || itemOrder.countInstock || 0
                const newAmount = itemOrder.amount + orderItem?.amount
                
                if (newAmount <= availableStock) {
                    itemOrder.amount = newAmount
                    state.isSuccessOrder = true
                    state.isErrorOrder = false
                } else {
                    state.isSuccessOrder = false
                    state.isErrorOrder = true
                    state.errorMessage = `Rất tiếc, bạn chỉ có thể mua tối đa ${availableStock} sản phẩm.`
                }
            } else {
                // Validate amount and stock before adding a new item
                const availableStock = orderItem.availableStock || orderItem.countInstock || 0
                const requestedAmount = Math.max(1, Math.floor(orderItem.amount || 1))

                if (availableStock === 0) {
                    // Do not add an item that is out of stock
                    state.isSuccessOrder = false
                    state.isErrorOrder = true
                    state.errorMessage = 'Sản phẩm này đã hết hàng.'
                    return
                }

                if (requestedAmount > availableStock) {
                    // Reject adding more than available stock
                    state.isSuccessOrder = false
                    state.isErrorOrder = true
                    state.errorMessage = `Rất tiếc, bạn chỉ có thể mua tối đa ${availableStock} sản phẩm.`
                    return
                }

                // Safe to add
                orderItem.amount = requestedAmount
                state.orderItems.push(orderItem)
                state.isSuccessOrder = true
                state.isErrorOrder = false
            }
        },
        resetOrder: (state) => {
            state.isSuccessOrder = false
            state.isErrorOrder = false
            state.errorMessage = ''
        },
        increaseAmount: (state, action) => {
            const { idProduct, variation } = action.payload
            const itemOrder = state?.orderItems?.find((item) => {
                if (variation) {
                    return item.product === idProduct &&
                           item.variation?.color === variation?.color &&
                           item.variation?.size === variation?.size &&
                           item.variation?.material === variation?.material
                }
                return item.product === idProduct && !item.variation
            })
            
            if (itemOrder) {
                const maxStock = itemOrder.availableStock || itemOrder.countInstock || 0
                if (itemOrder.amount < maxStock) {
                    itemOrder.amount++
                    state.isErrorOrder = false
                } else {
                    state.isErrorOrder = true
                    state.errorMessage = `Rất tiếc, bạn chỉ có thể mua tối đa ${maxStock} sản phẩm.`
                }
            }
            
            const itemOrderSelected = state?.orderItemsSelected?.find((item) => {
                if (variation) {
                    return item.product === idProduct &&
                           item.variation?.color === variation?.color &&
                           item.variation?.size === variation?.size &&
                           item.variation?.material === variation?.material
                }
                return item.product === idProduct && !item.variation
            })
            
            if (itemOrderSelected && itemOrder && itemOrder.amount <= (itemOrder.availableStock || itemOrder.countInstock || 0)) {
                itemOrderSelected.amount = itemOrder.amount
            }
        },
        decreaseAmount: (state, action) => {
            const { idProduct, variation } = action.payload
            const itemOrder = state?.orderItems?.find((item) => {
                if (variation) {
                    return item.product === idProduct &&
                           item.variation?.color === variation?.color &&
                           item.variation?.size === variation?.size &&
                           item.variation?.material === variation?.material
                }
                return item.product === idProduct && !item.variation
            })
            
            if (itemOrder && itemOrder.amount > 1) {
                itemOrder.amount--
                state.isErrorOrder = false
            }
            
            const itemOrderSelected = state?.orderItemsSelected?.find((item) => {
                if (variation) {
                    return item.product === idProduct &&
                           item.variation?.color === variation?.color &&
                           item.variation?.size === variation?.size &&
                           item.variation?.material === variation?.material
                }
                return item.product === idProduct && !item.variation
            })
            
            if (itemOrderSelected && itemOrder) {
                itemOrderSelected.amount = itemOrder.amount
            }
        },
        removeorderProduct: (state, action) => {
            const { idProduct, variation } = action.payload
            state.orderItems = state?.orderItems?.filter((item) => {
                if (variation) {
                    return !(item.product === idProduct &&
                           item.variation?.color === variation?.color &&
                           item.variation?.size === variation?.size &&
                           item.variation?.material === variation?.material)
                }
                return !(item.product === idProduct && !item.variation)
            })
            
            state.orderItemsSelected = state?.orderItemsSelected?.filter((item) => {
                if (variation) {
                    return !(item.product === idProduct &&
                           item.variation?.color === variation?.color &&
                           item.variation?.size === variation?.size &&
                           item.variation?.material === variation?.material)
                }
                return !(item.product === idProduct && !item.variation)
            })
        },
        removeallorderProduct: (state, action) => {
            const { listChecked } = action.payload
            state.orderItems = state?.orderItems?.filter((item) => {
                const itemKey = item.variation && (item.variation.color || item.variation.size || item.variation.material)
                    ? `${item.product}_${item.variation.color || ''}_${item.variation.size || ''}_${item.variation.material || ''}`
                    : item.product
                return !listChecked.includes(itemKey)
            })
            state.orderItemsSelected = state?.orderItemsSelected?.filter((item) => {
                const itemKey = item.variation && (item.variation.color || item.variation.size || item.variation.material)
                    ? `${item.product}_${item.variation.color || ''}_${item.variation.size || ''}_${item.variation.material || ''}`
                    : item.product
                return !listChecked.includes(itemKey)
            })
        },
        selectedOrder: (state, action) => {
            const { listChecked } = action.payload
            const orderSelected = []
            
            state.orderItems.forEach((order) => {
                // Tạo key cho item (bao gồm cả material)
                let itemKey;
                if (order.variation && (order.variation.color || order.variation.size || order.variation.material)) {
                    itemKey = `${order.product}_${order.variation.color || ''}_${order.variation.size || ''}_${order.variation.material || ''}`;
                } else {
                    itemKey = order.product;
                }
                
                if (listChecked.includes(itemKey)) {
                    orderSelected.push(order);
                }
            });
            
            state.orderItemsSelected = orderSelected
        },
        updateQuantity: (state, action) => {
            const { idProduct, variation, quantity } = action.payload
            const itemOrder = state?.orderItems?.find((item) => {
                if (variation) {
                    return item.product === idProduct &&
                           item.variation?.color === variation?.color &&
                           item.variation?.size === variation?.size &&
                           item.variation?.material === variation?.material
                }
                return item.product === idProduct && !item.variation
            })
            
            if (itemOrder) {
                const maxStock = itemOrder.availableStock || itemOrder.countInstock || 0
                const newQuantity = Math.min(Math.max(1, quantity), maxStock)
                
                if (newQuantity <= maxStock) {
                    itemOrder.amount = newQuantity
                    state.isErrorOrder = false
                    
                    // Update selected order too
                    const itemOrderSelected = state?.orderItemsSelected?.find((item) => {
                        if (variation) {
                            return item.product === idProduct &&
                                   item.variation?.color === variation?.color &&
                                   item.variation?.size === variation?.size &&
                                   item.variation?.material === variation?.material
                        }
                        return item.product === idProduct && !item.variation
                    })
                    
                    if (itemOrderSelected) {
                        itemOrderSelected.amount = newQuantity
                    }
                } else {
                    state.isErrorOrder = true
                    state.errorMessage = `Rất tiếc, bạn chỉ có thể mua tối đa ${maxStock} sản phẩm.`
                }
            }
        },
        clearCart: (state) => {
            // Xóa toàn bộ giỏ hàng
            state.orderItems = []
            state.orderItemsSelected = []
            state.isSuccessOrder = false
            state.isErrorOrder = false
            state.errorMessage = ''
            // Xóa voucher khi clear cart
            state.appliedVoucher = null
            state.voucherDiscount = 0
            state.voucherCode = ''
            state.promotionId = null
            // Xóa freeship code khi clear cart
            state.appliedFreeshipCode = null
            state.freeshipCode = ''
            state.freeshipDiscount = 0
            state.shippingVoucherId = null
        },
        applyVoucher: (state, action) => {
            // Lưu voucher đã áp dụng
            const { voucherCode, voucherDiscount, appliedVoucher, promotionId } = action.payload
            state.voucherCode = voucherCode || ''
            state.voucherDiscount = voucherDiscount || 0
            state.appliedVoucher = appliedVoucher || null
            state.promotionId = promotionId || (appliedVoucher?._id) || null
        },
        removeVoucher: (state) => {
            // Xóa voucher
            state.voucherCode = ''
            state.voucherDiscount = 0
            state.appliedVoucher = null
            state.promotionId = null
        },
        applyFreeshipCode: (state, action) => {
            // Lưu freeship code đã áp dụng
            const { freeshipCode, appliedFreeshipCode, freeshipDiscount, shippingVoucherId } = action.payload
            state.freeshipCode = freeshipCode || ''
            state.appliedFreeshipCode = appliedFreeshipCode || null
            state.freeshipDiscount = freeshipDiscount || 0
            state.shippingVoucherId = shippingVoucherId || (appliedFreeshipCode?._id) || null
        },
        removeFreeshipCode: (state) => {
            // Xóa freeship code
            state.freeshipCode = ''
            state.appliedFreeshipCode = null
            state.freeshipDiscount = 0
            state.shippingVoucherId = null
        },
        setShippingMethod: (state, action) => {
            // Lưu shipping method đã chọn
            state.selectedShippingMethod = action.payload
        },
        clearShippingMethod: (state) => {
            // Xóa shipping method
            state.selectedShippingMethod = null
        },
        addToOrderSelected: (state, action) => {
            // Thêm trực tiếp vào orderItemsSelected mà không thêm vào giỏ hàng (dùng cho "Mua ngay")
            // Mặc định thay thế danh sách cũ để đảm bảo chỉ thanh toán cho sản phẩm vừa chọn
            const { orderItem } = action.payload
            
            const availableStock = orderItem.availableStock || orderItem.countInstock || 0
            const requestedAmount = Math.max(1, Math.floor(orderItem.amount || 1))

            if (availableStock === 0) {
                state.isErrorOrder = true
                state.errorMessage = 'Sản phẩm này đã hết hàng.'
                return
            }

            if (requestedAmount > availableStock) {
                orderItem.amount = availableStock
                state.isErrorOrder = true
                state.errorMessage = `Số lượng đã được điều chỉnh xuống tối đa ${availableStock} sản phẩm do tồn kho hạn chế.`
            } else {
                orderItem.amount = requestedAmount
                state.isErrorOrder = false
            }

            // Thay thế hoàn toàn danh sách đã chọn - Quan trọng cho logic "Mua ngay"
            state.orderItemsSelected = [orderItem]

            // Reset voucher và shipping khi mua sản phẩm mới (để tránh voucher cũ của sản phẩm khác áp dụng sai)
            state.appliedVoucher = null
            state.voucherDiscount = 0
            state.voucherCode = ''
            state.promotionId = null
            state.appliedFreeshipCode = null
            state.freeshipCode = ''
            state.freeshipDiscount = 0
            state.shippingVoucherId = null
            state.selectedShippingMethod = null
        },
        updateOrderVariation: (state, action) => {
            const { idProduct, oldVariation, newVariation, newPrice, newStock, sku } = action.payload
            
            // Tìm item cũ trong orderItems
            const oldItemIndex = state.orderItems.findIndex(item => 
                item.product === idProduct && 
                item.variation?.color === oldVariation?.color &&
                item.variation?.size === oldVariation?.size &&
                item.variation?.material === oldVariation?.material
            )

            if (oldItemIndex !== -1) {
                const oldItem = state.orderItems[oldItemIndex]
                const amount = oldItem.amount

                // Kiểm tra xem item với variation mới có tồn tại chưa (để merge)
                const existingNewItemIndex = state.orderItems.findIndex((item, idx) => 
                    idx !== oldItemIndex &&
                    item.product === idProduct && 
                    item.variation?.color === newVariation?.color &&
                    item.variation?.size === newVariation?.size &&
                    item.variation?.material === newVariation?.material
                )

                if (existingNewItemIndex !== -1) {
                    // Merge số lượng vào item đã có
                    const existingItem = state.orderItems[existingNewItemIndex]
                    const totalAmount = existingItem.amount + amount
                    const maxStock = newStock || existingItem.availableStock || existingItem.countInstock || 0
                    
                    existingItem.amount = Math.min(totalAmount, maxStock)
                    
                    // Xóa item cũ
                    state.orderItems.splice(oldItemIndex, 1)
                } else {
                    // Cập nhật item cũ với variation mới
                    oldItem.variation = { ...newVariation, sku: sku || newVariation.sku }
                    if (newPrice !== undefined) oldItem.price = newPrice
                    if (newStock !== undefined) {
                        oldItem.availableStock = newStock
                        oldItem.countInstock = newStock
                        if (oldItem.amount > newStock) oldItem.amount = newStock
                    }
                }
                
                // Tính toán lại orderItemsSelected nếu listChecked có chứa item cũ
                // Phần này sẽ được handle bởi component bằng cách dispatch selectedOrder lại sau khi update
            }
        },
        setCart: (state, action) => {
            const { cartItems } = action.payload;
            state.orderItems = cartItems;
        },
    },
})

// Action creators are generated for each case reducer function
export const { addorderProduct, increaseAmount, decreaseAmount, removeorderProduct, removeallorderProduct, selectedOrder, resetOrder, updateQuantity, clearCart, applyVoucher, removeVoucher, applyFreeshipCode, removeFreeshipCode, addToOrderSelected, setShippingMethod, clearShippingMethod, updateOrderVariation, setCart } = orderSlide.actions

export default orderSlide.reducer
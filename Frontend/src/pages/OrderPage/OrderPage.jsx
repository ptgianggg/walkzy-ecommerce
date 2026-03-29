import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import { Tabs } from 'antd'
import { Checkbox, Space, Empty, Button, List, Tag, Popover, Spin, Modal } from 'antd'
import {
  WrapperLeft,
  WrapperStyleHeader,
  WrapperListOrder,
  WrapperItemOrder,
  WrapperPriceDiscount,
  WrapperCountOrder,
  WrapperRight,
  WrapperInfo,
  WrapperTotal,
  WrapperCartContainer,
  WrapperEmptyCart,
  StatusTag,
  BuyButtonWrapper,
  VariationSelectionPopover
} from './style'

import {
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  CheckOutlined,
  CarOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  TagsOutlined,
  CaretDownOutlined,
  TruckOutlined
} from '@ant-design/icons'

import ButtonComponent from '../../components/ButtonComponent/ButtonComponent'
import { useDispatch, useSelector } from 'react-redux'
import { WrapperInputNumber } from '../../components/ProductDetailComponent/style'
import {
  decreaseAmount,
  increaseAmount,
  removeallorderProduct,
  removeorderProduct,
  selectedOrder,
  updateQuantity,
  applyVoucher,
  removeVoucher,
  updateOrderVariation,
  applyFreeshipCode,
  removeFreeshipCode
} from '../../redux/slides/orderSlide'
import { convertPrice } from '../../utils'
import ModalComponent from '../../components/ModalComponent/ModalComponent'
import Inputcomponent from '../../components/Inputcomponent/Inputcomponent'
import AddressPicker from '../../components/AddressPicker/AddressPicker'
import { useMutationHooks } from '../../hooks/useMutationHook'
import * as UserService from '../../services/UserService'
import * as VoucherService from '../../services/VoucherService'
import * as ShippingVoucherService from '../../services/ShippingVoucherService'

import * as ProductService from '../../services/ProductService'
import * as CartService from '../../services/CartService'
import * as AttributeService from '../../services/AttributeService'
import Loading from '../../components/LoadingComponent/Loading'

import * as message from '../../components/Message/Message'
import { updateUser } from '../../redux/slides/userSlide'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

const OrderPage = () => {
  const order = useSelector((state) => state.order)
  const user = useSelector((state) => state.user)
  const [listChecked, setListChecked] = useState([])
  const [isOpenModalVoucher, setIsOpenModalVoucher] = useState(false)

  // Variation editing state
  const [editingVariationItem, setEditingVariationItem] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  // ========= HANDLE CART ITEM KEY / CHECKBOX =========
  const getItemKey = (item) => {
    if (item.variation && (item.variation.color || item.variation.size || item.variation.material)) {
      return `${item.product}_${item.variation.color || ''}_${item.variation.size || ''}_${item.variation.material || ''}`
    }
    return item.product || ''
  }

  // Fetch active vouchers
  const { data: activeVouchers, isLoading: isLoadingActiveVouchers } = useQuery({
    queryKey: ['active-vouchers'],
    queryFn: () => VoucherService.getActiveVouchers(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch active shipping vouchers
  const { data: activeShippingVouchers, isLoading: isLoadingActiveShippingVouchers } = useQuery({
    queryKey: ['active-shipping-vouchers'],
    queryFn: () => ShippingVoucherService.getActiveShippingVouchers(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const [voucherTab, setVoucherTab] = useState('shop') // 'shop' or 'shipping'

  // Fetch product details for variation editing
  const { data: productDetails, isFetching: isFetchingProductDetails } = useQuery({
    queryKey: ['product-details', editingVariationItem?.product],
    queryFn: () => ProductService.getDetailsProduct(editingVariationItem?.product),
    enabled: !!editingVariationItem?.product,
    staleTime: 2 * 60 * 1000
  })

  // Helper logic for variations (similar to ProductDetailComponent)
  const availableColors = useMemo(() => {
    if (!productDetails?.data?.hasVariations) return []
    return [...new Set(productDetails.data.variations.filter(v => v.isActive && v.color).map(v => v.color))]
  }, [productDetails])

  const availableSizes = useMemo(() => {
    if (!productDetails?.data?.hasVariations) return []
    return [...new Set(productDetails.data.variations.filter(v => v.isActive && v.size).map(v => v.size))]
  }, [productDetails])

  const availableMaterials = useMemo(() => {
    if (!productDetails?.data?.hasVariations) return []
    return [...new Set(productDetails.data.variations.filter(v => v.isActive && v.material).map(v => v.material))]
  }, [productDetails])

  const currentCombination = useMemo(() => {
    if (!productDetails?.data?.hasVariations) return null
    return productDetails.data.variations.find(v =>
      v.isActive &&
      (!selectedColor || v.color === selectedColor) &&
      (!selectedSize || v.size === selectedSize) &&
      (!selectedMaterial || v.material === selectedMaterial)
    )
  }, [productDetails, selectedColor, selectedSize, selectedMaterial])

  const handleOpenVariationPopover = (item) => {
    setEditingVariationItem(item)
    setSelectedColor(item.variation?.color || null)
    setSelectedSize(item.variation?.size || null)
    setSelectedMaterial(item.variation?.material || null)
  }

  const handleConfirmVariation = () => {
    if (!editingVariationItem || !currentCombination) return

    const oldKey = getItemKey(editingVariationItem)
    const newKey = `${editingVariationItem.product}_${selectedColor || ''}_${selectedSize || ''}_${selectedMaterial || ''}`

    if (oldKey === newKey) {
      setEditingVariationItem(null)
      return
    }

    dispatch(updateOrderVariation({
      idProduct: editingVariationItem.product,
      oldVariation: editingVariationItem.variation,
      newVariation: {
        color: selectedColor || '',
        size: selectedSize || '',
        material: selectedMaterial || ''
      },
      newPrice: currentCombination.price,
      newStock: currentCombination.stock || currentCombination.countInStock || 0,
      sku: currentCombination.sku
    }))

    // Cập nhật listChecked nếu item cũ đang được chọn
    if (listChecked.includes(oldKey)) {
      setListChecked(prev => {
        const next = prev.filter(key => key !== oldKey)
        if (!next.includes(newKey)) {
          next.push(newKey)
        }
        return next
      })
    }

    setEditingVariationItem(null)
    message.success('Cập nhật phân loại thành công')
  }


  const [isOpenModalUpdateInfo, setIsOpenModalUpdateInfo] = useState(false)
  // Lấy voucher từ Redux state, nếu không có thì dùng local state
  const [voucherCode, setVoucherCode] = useState(order?.voucherCode || '')
  const [voucherDiscount, setVoucherDiscount] = useState(order?.voucherDiscount || 0)
  const [appliedVoucher, setAppliedVoucher] = useState(order?.appliedVoucher || null)
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [appliedFreeshipCode, setAppliedFreeshipCode] = useState(order?.appliedFreeshipCode || null)

  const [stateUserDetails, setStateUserDetails] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    district: '',
    ward: '',
    latitude: null,
    longitude: null
  })
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const dispatch = useDispatch()



  // ========= HANDLE CART ITEM KEY / CHECKBOX =========
  const isItemChecked = (item) => {
    const key = getItemKey(item)
    return listChecked.includes(key)
  }

  const handleItemCheck = (e, item) => {
    const key = getItemKey(item)
    if (e.target.checked) {
      if (!listChecked.includes(key)) {
        setListChecked([...listChecked, key])
      }
    } else {
      setListChecked(listChecked.filter((k) => k !== key))
    }
  }

  const handleOnchangeCheckAll = (e) => {
    if (e.target.checked) {
      const newListChecked = []
      order?.orderItems?.forEach((item) => {
        // Chỉ thêm vào listChecked nếu sản phẩm còn hàng
        const maxStock = item.availableStock || item.countInstock || 0
        const isOutOfStock = maxStock === 0
        if (!isOutOfStock) {
          const key = getItemKey(item)
          newListChecked.push(key)
        }
      })
      setListChecked(newListChecked)
    } else {
      setListChecked([])
    }
  }

  useEffect(() => {
    dispatch(selectedOrder({ listChecked }))
  }, [listChecked, dispatch, order?.orderItems])

  // Clear selected shipping rate when city changes (only if city actually changed)


  // ========= HANDLE QUANTITY / DELETE =========
  // ========= HANDLE QUANTITY / DELETE =========
  const handleChangeCount = (type, orderItem, limited) => {
    const idProduct = orderItem?.product
    const variation = orderItem?.variation

    if (type === 'increase') {
      if (!limited) {
        dispatch(increaseAmount({ idProduct, variation }))
        if (user?.id) {
          CartService.updateCartItem({ product: idProduct, variation, amount: orderItem.amount + 1 }, user.access_token)
        }
      } else {
        message.warning(
          `Chỉ có thể mua tối đa ${orderItem.availableStock || orderItem.countInstock || 0} sản phẩm`
        )
      }
    } else {
      if (!limited) {
        dispatch(decreaseAmount({ idProduct, variation }))
        if (user?.id && orderItem.amount > 1) {
          CartService.updateCartItem({ product: idProduct, variation, amount: orderItem.amount - 1 }, user.access_token)
        }
      }
    }
  }

  const handleDeleteOrder = (orderItem) => {
    const idProduct = orderItem?.product
    const variation = orderItem?.variation
    dispatch(removeorderProduct({ idProduct, variation }))
    if (user?.id) {
      CartService.deleteCartItem({ product: idProduct, variation }, user.access_token)
    }
    message.success('Đã xóa sản phẩm khỏi giỏ hàng')
  }

  const handleRemoveAllOrder = () => {
    if (listChecked?.length > 0) {
      // Logic to sync delete with backend before clearing local state or concurrently
      if (user?.id) {
        order?.orderItems?.forEach(item => {
          // itemKey defined in scope? No. Need helper check.
          const key = getItemKey(item);
          if (listChecked.includes(key)) {
            CartService.deleteCartItem({ product: item.product, variation: item.variation }, user.access_token)
          }
        })
      }

      dispatch(removeallorderProduct({ listChecked }))
      setListChecked([])
      message.success('Đã xóa các sản phẩm đã chọn')
    }
  }

  // ========= USER INFO & MODAL =========
  useEffect(() => {
    form.setFieldsValue(stateUserDetails)
  }, [form, stateUserDetails])

  useEffect(() => {
    if (isOpenModalUpdateInfo) {
      setStateUserDetails({
        city: user?.city || '',
        name: user?.name || '',
        address: user?.address || '',
        phone: user?.phone || '',
        province: user?.province || '',
        district: user?.district || '',
        ward: user?.ward || '',
        latitude: user?.latitude || null,
        longitude: user?.longitude || null
      })
    }
  }, [isOpenModalUpdateInfo, user])

  const handleChangeAddress = () => {
    setIsOpenModalUpdateInfo(true)
  }

  const mutationUpdate = useMutationHooks((data) => {
    const { id, token, ...rests } = data
    const res = UserService.updateUser(id, { ...rests }, token)
    return res
  })

  const { isPending } = mutationUpdate

  const handleCancelUpdate = () => {
    setStateUserDetails({
      name: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      district: '',
      ward: '',
      latitude: null,
      longitude: null
    })
    form.resetFields()
    setIsOpenModalUpdateInfo(false)
  }

  const handleUpdateInfoUser = () => {
    const { name, address, city, phone } = stateUserDetails
    if (name && address && city && phone) {
      mutationUpdate.mutate(
        { id: user?.id, token: user?.access_token, ...stateUserDetails },
        {
          onSuccess: () => {
            // QUAN TRỌNG: Merge với user hiện tại để giữ lại id, access_token, email, isAdmin, roleId, permissions...
            // Nếu không merge, những giá trị này sẽ bị ghi đè thành rỗng và user bị đăng xuất
            dispatch(updateUser({
              ...user,  // Giữ lại tất cả thông tin user hiện tại
              ...stateUserDetails,  // Ghi đè với thông tin mới từ form
              _id: user?.id  // Đảm bảo _id được giữ lại (reducer dùng _id)
            }))
            setIsOpenModalUpdateInfo(false)
            message.success('Cập nhật thông tin thành công')
          }
        }
      )
    } else {
      message.error('Vui lòng điền đầy đủ thông tin')
    }
  }

  const handleAddressChange = (addressData) => {
    setStateUserDetails((prev) => ({
      ...prev,
      address: addressData.address || prev.address,
      city: addressData.city || prev.city,
      province: addressData.province || prev.province,
      district: addressData.district || prev.district,
      ward: addressData.ward || prev.ward,
      latitude: addressData.latitude || prev.latitude,
      longitude: addressData.longitude || prev.longitude
    }))
  }

  const handleOnchangeDetails = (e) => {
    setStateUserDetails({
      ...stateUserDetails,
      [e.target.name]: e.target.value
    })
  }

  // ========= PRICE CALCULATION =========
  const priceMemo = useMemo(() => {
    const result = order?.orderItemsSelected?.reduce((total, cur) => {
      return total + cur.price * cur.amount
    }, 0)
    return result || 0
  }, [order])

  const totalWeightMemo = useMemo(() => {
    const result = order?.orderItemsSelected?.reduce((total, cur) => {
      return total + (Number(cur.weight) || 0) * cur.amount
    }, 0)
    return result || 0
  }, [order])

  const totalPriceMemo = useMemo(() => {
    const subtotal = Number(priceMemo)
    const finalTotal = subtotal - Number(voucherDiscount)
    return Math.max(0, finalTotal)
  }, [priceMemo, voucherDiscount])



  // Handle voucher validation


  const handleApplyVoucherWithCode = (code) => {
    setVoucherCode(code)
    // Needs a slight delay to ensure state update or passed directly if refactored.
    // Actually, I can just call the logic directly here or refactor handleApplyVoucher to take an optional code param.
    // Let's modify handleApplyVoucher below to be safer.
    handleApplyVoucher(code)
  }

  // Refactored handleApplyVoucher to accept optional code
  const handleApplyVoucher = async (codeOverride) => {
    const codeToUse = typeof codeOverride === 'string' ? codeOverride : voucherCode;

    if (!codeToUse || !codeToUse.trim()) {
      message.warning('Vui lòng nhập mã voucher')
      return
    }

    if (!user?.access_token) {
      message.warning('Vui lòng đăng nhập để sử dụng voucher')
      return
    }

    if (!order?.orderItemsSelected || order.orderItemsSelected.length === 0) {
      message.warning('Vui lòng chọn sản phẩm để áp dụng voucher')
      return
    }

    if (appliedVoucher) {
      message.warning('Bạn đã áp dụng một voucher. Vui lòng xóa voucher hiện tại trước khi áp dụng voucher mới.')
      return
    }

    setIsValidatingVoucher(true)
    try {
      const result = await VoucherService.validateVoucher(
        codeToUse.trim().toUpperCase(),
        order.orderItemsSelected.map(item => ({
          product: item.product,
          category: item.category,
          brand: item.brand,
          amount: item.amount,
          price: item.price,
          variation: item.variation
        })),
        priceMemo,
        user.access_token
      )

      if (result.status === 'OK') {
        const discountAmount = result.data.discountAmount
        const promotion = result.data.promotion
        const promotionId = result.data.promotionId || promotion?._id

        // Update local state
        setVoucherDiscount(discountAmount)
        setAppliedVoucher(promotion)
        setIsOpenModalVoucher(false) // Close modal on success

        // Lưu vào Redux để giữ khi chuyển trang (bao gồm promotionId)
        dispatch(applyVoucher({
          voucherCode: codeToUse.trim().toUpperCase(),
          voucherDiscount: discountAmount,
          appliedVoucher: promotion,
          promotionId: promotionId
        }))

        message.success(`Áp dụng mã voucher thành công! Giảm ${discountAmount.toLocaleString()} VNĐ`)
      } else {
        // Hiển thị toast với message từ backend
        const errorMessage = result.message || 'Mã voucher không hợp lệ'
        if (errorMessage.includes('không áp dụng cho sản phẩm trong giỏ hàng')) {
          message.error('Voucher này không áp dụng cho sản phẩm trong giỏ hàng của bạn.')
        } else {
          message.error(errorMessage)
        }
        setVoucherDiscount(0)
        setAppliedVoucher(null)
      }
    } catch (error) {
      console.error('Error validating voucher:', error)
      message.error('Có lỗi xảy ra khi kiểm tra voucher')
      setVoucherDiscount(0)
      setAppliedVoucher(null)
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setVoucherCode('')
    setVoucherDiscount(0)
    setAppliedVoucher(null)

    // Xóa khỏi Redux
    dispatch(removeVoucher())

    message.success('Đã xóa mã voucher')
  }

  // Handle freeship code validation
  const handleApplyFreeshipCodeWithCode = (code) => {
    setVoucherCode(code)
    handleApplyFreeshipCode(code)
  }

  const handleApplyFreeshipCode = async (codeOverride) => {
    const codeToUse = typeof codeOverride === 'string' ? codeOverride : voucherCode;

    if (!codeToUse || !codeToUse.trim()) {
      message.warning('Vui lòng nhập mã freeship')
      return
    }

    if (!user?.access_token) {
      message.warning('Vui lòng đăng nhập để sử dụng mã freeship')
      return
    }

    setIsValidatingVoucher(true)
    try {
      const result = await ShippingVoucherService.validateShippingVoucher(
        codeToUse.trim().toUpperCase(),
        '', // shippingProviderId (chưa có)
        priceMemo,
        user.id
      )

      if (result.status === 'OK') {
        const voucher = result.data.voucher
        setAppliedFreeshipCode(voucher)
        setIsOpenModalVoucher(false)

        dispatch(applyFreeshipCode({
          freeshipCode: codeToUse.trim().toUpperCase(),
          appliedFreeshipCode: voucher,
          freeshipDiscount: 0
        }))

        message.success(`Đã chọn mã freeship: ${codeToUse.trim().toUpperCase()}. Giảm giá sẽ được tính ở bước thanh toán.`)
      } else {
        message.error(result.message || 'Mã freeship không hợp lệ')
      }
    } catch (error) {
      console.error('Error validating freeship code:', error)
      message.error('Có lỗi xảy ra khi kiểm tra mã freeship')
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  const handleRemoveFreeshipCode = () => {
    setAppliedFreeshipCode(null)
    dispatch(removeFreeshipCode())
    message.success('Đã xóa mã freeship')
  }

  // ========= HANDLE NAVIGATE PAYMENT =========
  const handleAddCard = () => {
    // Kiểm tra đăng nhập
    if (!user?.id || !user?.access_token) {
      message.warning('Vui lòng đăng nhập để tiếp tục mua hàng')
      navigate('/sign-in', { state: { from: '/order' } })
      return
    }

    if (!order?.orderItemsSelected?.length) {
      message.error('Vui lòng chọn ít nhất một sản phẩm để tiếp tục')
      return
    }

    // Kiểm tra sản phẩm hết hàng trong danh sách đã chọn
    const outOfStockItems = order.orderItemsSelected.filter((item) => {
      const maxStock = item.availableStock || item.countInstock || 0
      return maxStock === 0
    })

    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map(item => item.name).join(', ')
      message.error(
        `Không thể thanh toán. Có ${outOfStockItems.length} sản phẩm đã hết hàng: ${itemNames}. Vui lòng xóa các sản phẩm hết hàng khỏi giỏ hàng trước khi thanh toán.`
      )
      return
    }

    navigate('/payment')
  }

  // ========= RENDER =========
  return (
    <WrapperCartContainer>
      <div className="cart-content">
        <div className="cart-header">
          <h2 className="cart-title">
            <ShoppingCartOutlined style={{ marginRight: 12, color: '#1a94ff', fontSize: 28 }} />
            Giỏ hàng của bạn
          </h2>
          <span className="cart-count">{order?.orderItems?.length || 0} sản phẩm</span>
        </div>

        <div className="cart-body">
          {/* LEFT: SHIPPING */}


          {/* MIDDLE: CART ITEMS */}
          <WrapperLeft>
            <WrapperStyleHeader>
              <span className="select-all-section">
                <Checkbox
                  onChange={handleOnchangeCheckAll}
                  checked={
                    (() => {
                      // Chỉ đếm các sản phẩm còn hàng
                      const inStockItems = order?.orderItems?.filter((item) => {
                        const maxStock = item.availableStock || item.countInstock || 0
                        return maxStock > 0
                      }) || []
                      return inStockItems.length > 0 &&
                        listChecked?.length === inStockItems.length
                    })()
                  }
                />
                <span className="select-all-text">Tất cả</span>
              </span>

              <DeleteOutlined
                className="delete-all-icon"
                onClick={handleRemoveAllOrder}
                title="Xóa tất cả sản phẩm đã chọn"
              />
            </WrapperStyleHeader>

            <WrapperListOrder>
              {order?.orderItems?.length > 0 ? (
                order.orderItems.map((orderItem, index) => {
                  const maxStock = orderItem.availableStock || orderItem.countInstock || 0
                  const isOutOfStock = maxStock === 0
                  const isChecked = isItemChecked(orderItem)

                  const unitPrice = orderItem.price
                  const discount = orderItem.discount || 0
                  const originalPrice =
                    discount > 0 && discount < 100
                      ? Math.round(unitPrice / (1 - discount / 100))
                      : orderItem.originalPrice || unitPrice

                  const discountPercent =
                    originalPrice > unitPrice
                      ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100)
                      : discount || 0

                  const finalPrice = unitPrice * orderItem.amount

                  // Biến thể hiển thị một giá trị duy nhất
                  const displayColor = orderItem.variation
                    ? Array.isArray(orderItem.variation.color)
                      ? orderItem.variation.color[0]
                      : orderItem.variation.color
                    : null

                  const displaySize = orderItem.variation
                    ? Array.isArray(orderItem.variation.size)
                      ? orderItem.variation.size[0]
                      : orderItem.variation.size
                    : null

                  const displayMaterial = orderItem.variation
                    ? Array.isArray(orderItem.variation.material)
                      ? orderItem.variation.material[0]
                      : orderItem.variation.material
                    : null

                  const renderVariationPopoverContent = () => {
                    if (isFetchingProductDetails) return <div style={{ padding: '20px', textAlign: 'center' }}><Spin /></div>
                    if (!productDetails?.data?.hasVariations) return <div style={{ padding: '20px' }}>Sản phẩm không có phân loại</div>

                    return (
                      <VariationSelectionPopover>
                        {availableColors.length > 0 && (
                          <div className="variation-group">
                            <span className="group-label">Màu sắc</span>
                            <div className="options">
                              {availableColors.map(color => (
                                <div
                                  key={color}
                                  className={`option-item ${selectedColor === color ? 'selected' : ''}`}
                                  onClick={() => setSelectedColor(color)}
                                >
                                  {color}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {availableMaterials.length > 0 && (
                          <div className="variation-group">
                            <span className="group-label">Chất liệu</span>
                            <div className="options">
                              {availableMaterials.map(material => (
                                <div
                                  key={material}
                                  className={`option-item ${selectedMaterial === material ? 'selected' : ''}`}
                                  onClick={() => setSelectedMaterial(material)}
                                >
                                  {material}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {availableSizes.length > 0 && (
                          <div className="variation-group">
                            <span className="group-label">Kích cỡ</span>
                            <div className="options">
                              {availableSizes.map(size => {
                                const isAvailable = productDetails.data.variations.some(v =>
                                  v.isActive &&
                                  v.size === size &&
                                  (!selectedColor || v.color === selectedColor) &&
                                  (!selectedMaterial || v.material === selectedMaterial) &&
                                  (v.stock > 0 || v.countInStock > 0)
                                )
                                return (
                                  <div
                                    key={size}
                                    className={`option-item ${selectedSize === size ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                                    onClick={() => isAvailable && setSelectedSize(size)}
                                  >
                                    {size}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        <div className="popover-footer">
                          <Button onClick={() => setEditingVariationItem(null)}>Trở lại</Button>
                          <Button type="primary" onClick={handleConfirmVariation}>Xác nhận</Button>
                        </div>
                      </VariationSelectionPopover>
                    )
                  }

                  return (
                    <WrapperItemOrder
                      key={`${orderItem.product}_${index}`}
                      className={`${isOutOfStock ? 'out-of-stock' : ''} ${isChecked ? 'selected' : ''}`.trim()}
                    >
                      {/* HÀNG 1: ẢNH + TÊN + BIẾN THỂ + BADGE + XÓA */}
                      <div className="item-main-row">
                        <div className="item-main-left">
                          <Checkbox
                            className="product-checkbox"
                            onChange={(e) => handleItemCheck(e, orderItem)}
                            checked={isChecked}
                            disabled={isOutOfStock}
                          />
                          <div
                            className="product-thumb"
                            onClick={() => navigate(`/product-details/${orderItem.product}`)}
                          >
                            <img
                              src={orderItem?.image}
                              alt={orderItem?.name}
                              className="product-image"
                            />
                          </div>

                          <div className="product-info">
                            <div
                              className="product-name"
                              onClick={() => navigate(`/product-details/${orderItem.product}`)}
                            >
                              {orderItem?.name}
                            </div>

                            <Popover
                              content={renderVariationPopoverContent()}
                              trigger="click"
                              open={editingVariationItem?.product === orderItem.product && getItemKey(editingVariationItem) === getItemKey(orderItem)}
                              onOpenChange={(visible) => !visible && setEditingVariationItem(null)}
                              placement="bottomLeft"
                              overlayClassName="variation-popover"
                            >
                              <div
                                className="product-variation"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenVariationPopover(orderItem)
                                }}
                              >
                                <div className="variation-badge">
                                  <span className="variation-label">Phân loại:</span>
                                  <span className="variation-value">
                                    {[displayColor, displayMaterial, displaySize].filter(Boolean).join(', ')}
                                  </span>
                                  <CaretDownOutlined className="variation-arrow" />
                                </div>
                              </div>
                            </Popover>

                            <div className="product-tags">
                              {isOutOfStock ? (
                                <StatusTag className="out-of-stock">Hết hàng</StatusTag>
                              ) : (
                                <StatusTag className="in-stock">Còn hàng</StatusTag>
                              )}

                              {discountPercent > 0 && originalPrice > unitPrice && (
                                <StatusTag className="sale">Sale {discountPercent}%</StatusTag>
                              )}
                            </div>

                            <div className="product-price-row">
                              <span className="current-price">
                                {convertPrice(unitPrice)}
                              </span>
                              {discountPercent > 0 && originalPrice > unitPrice && (
                                <>
                                  <WrapperPriceDiscount>
                                    {convertPrice(originalPrice)}
                                  </WrapperPriceDiscount>
                                  <span className="discount-percent">
                                    -{discountPercent}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="item-main-right">
                          <DeleteOutlined
                            className="delete-icon"
                            onClick={() => handleDeleteOrder(orderItem)}
                            title="Xóa sản phẩm"
                          />
                        </div>
                      </div>

                      {/* HÀNG 2: SỐ LƯỢNG + THÀNH TIỀN */}
                      <div className="item-bottom-row">
                        <div className="bottom-left">
                          <span className="bottom-label">Số lượng</span>
                          <WrapperCountOrder>
                            <button
                              className="qty-btn"
                              onClick={() =>
                                handleChangeCount(
                                  'decrease',
                                  orderItem,
                                  orderItem?.amount <= 1
                                )
                              }
                              disabled={orderItem?.amount <= 1 || isOutOfStock}
                            >
                              <MinusOutlined />
                            </button>
                            <WrapperInputNumber
                              value={orderItem?.amount}
                              size="small"
                              min={1}
                              max={maxStock}
                              disabled={isOutOfStock}
                              onChange={(value) => {
                                const numValue = Number(value) || 1
                                if (numValue > maxStock) {
                                  message.error(
                                    `Chỉ có thể mua tối đa ${maxStock} sản phẩm`
                                  )
                                  dispatch(
                                    updateQuantity({
                                      idProduct: orderItem.product,
                                      variation: orderItem.variation,
                                      quantity: maxStock
                                    })
                                  )
                                  return
                                }
                                if (numValue < 1) {
                                  dispatch(
                                    updateQuantity({
                                      idProduct: orderItem.product,
                                      variation: orderItem.variation,
                                      quantity: 1
                                    })
                                  )
                                  return
                                }

                                dispatch(
                                  updateQuantity({
                                    idProduct: orderItem.product,
                                    variation: orderItem.variation,
                                    quantity: numValue
                                  })
                                )
                              }}
                            />
                            <button
                              className="qty-btn"
                              onClick={() =>
                                handleChangeCount(
                                  'increase',
                                  orderItem,
                                  orderItem?.amount >= maxStock
                                )
                              }
                              disabled={
                                orderItem?.amount >= maxStock ||
                                isOutOfStock ||
                                maxStock === 0
                              }
                            >
                              <PlusOutlined />
                            </button>
                          </WrapperCountOrder>
                        </div>

                        <div className="bottom-right">
                          <span className="bottom-label">Thành tiền</span>
                          <span className="bottom-total-price">
                            {convertPrice(finalPrice)}
                          </span>
                        </div>
                      </div>
                    </WrapperItemOrder>
                  )
                })
              ) : (
                <WrapperEmptyCart>
                  <Empty
                    image={
                      <ShoppingCartOutlined
                        style={{ fontSize: 80, color: '#d9d9d9' }}
                      />
                    }
                    description={
                      <span style={{ fontSize: 16, color: '#999' }}>
                        Giỏ hàng của bạn đang trống
                      </span>
                    }
                  >
                    <ButtonComponent
                      styleButton={{
                        background: '#1a94ff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 24px',
                        height: 'auto'
                      }}
                      textbutton="Tiếp tục mua sắm"
                      onClick={() => navigate('/product')}
                      styletextbutton={{
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    />
                  </Empty>
                </WrapperEmptyCart>
              )}
            </WrapperListOrder>
          </WrapperLeft>

          {/* RIGHT: SUMMARY */}
          {order?.orderItems?.length > 0 && (
            <WrapperRight>
              <div className="order-summary-card">
                <WrapperInfo className="price-info">
                  <div className="price-row">
                    <span>Tạm tính</span>
                    <span className="price-value">{convertPrice(priceMemo)}</span>
                  </div>

                  {/* Voucher Section */}
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GiftOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>Voucher & Freeship</span>
                      </div>
                      <span
                        style={{ color: '#1890ff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                        onClick={() => setIsOpenModalVoucher(true)}
                      >
                        Chọn voucher khác
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {appliedVoucher ? (
                        <div style={{
                          padding: '12px',
                          background: '#e6f7ff',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px dashed #1890ff'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TagsOutlined style={{ color: '#1890ff' }} />
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '13px' }}>
                                {appliedVoucher.code}
                              </div>
                              <div style={{ fontSize: '11px', color: '#52c41a' }}>
                                Shop Voucher: Giảm {convertPrice(voucherDiscount)}
                              </div>
                            </div>
                          </div>
                          <span
                            onClick={handleRemoveVoucher}
                            style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: '16px' }}
                          >
                            ×
                          </span>
                        </div>
                      ) : null}

                      {appliedFreeshipCode ? (
                        <div style={{
                          padding: '12px',
                          background: '#f6ffed',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px dashed #52c41a'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TruckOutlined style={{ color: '#52c41a' }} />
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: '13px' }}>
                                {appliedFreeshipCode.code}
                              </div>
                              <div style={{ fontSize: '11px', color: '#52c41a' }}>
                                Freeship: Giảm giá ship sẽ tính lúc thanh toán
                              </div>
                            </div>
                          </div>
                          <span
                            onClick={handleRemoveFreeshipCode}
                            style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: '16px' }}
                          >
                            ×
                          </span>
                        </div>
                      ) : null}

                      {!appliedVoucher && !appliedFreeshipCode && (
                        <div
                          onClick={() => setIsOpenModalVoucher(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: '#fff',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#1a1a1a',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>Nhập hoặc chọn mã giảm giá</span>
                          <TagsOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {voucherDiscount > 0 && (
                    <div className="price-row" style={{ marginTop: '12px' }}>
                      <span style={{ color: '#52c41a' }}>
                        <GiftOutlined style={{ marginRight: 6 }} />
                        Giảm giá voucher
                      </span>
                      <span className="price-value" style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        -{convertPrice(voucherDiscount)}
                      </span>
                    </div>
                  )}
                </WrapperInfo>

                {/* Modal Select Voucher */}
                <ModalComponent
                  title="Chọn Voucher"
                  open={isOpenModalVoucher}
                  onCancel={() => setIsOpenModalVoucher(false)}
                  footer={null}
                  width={600}
                >
                  <Tabs
                    activeKey={voucherTab}
                    onChange={setVoucherTab}
                    items={[
                      { key: 'shop', label: 'Shop Voucher' },
                      { key: 'shipping', label: 'Voucher Vận Chuyển' }
                    ]}
                    style={{ marginBottom: '16px' }}
                  />

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <Inputcomponent
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder={voucherTab === 'shop' ? "Mã Voucher Shop" : "Mã Voucher Vận Chuyển"}
                      style={{ flex: 1 }}
                    />
                    <ButtonComponent
                      onClick={voucherTab === 'shop' ? handleApplyVoucher : handleApplyFreeshipCode}
                      disabled={!voucherCode.trim()}
                      textbutton="Áp dụng"
                      styleButton={{
                        background: voucherCode.trim() ? '#1890ff' : '#f5f5f5',
                        border: 'none',
                        color: voucherCode.trim() ? '#fff' : '#ccc'
                      }}
                    />
                  </div>

                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {voucherTab === 'shop' ? (
                      <>
                        {isLoadingActiveVouchers ? (
                          <Loading />
                        ) : (
                          <List
                            dataSource={activeVouchers?.data || []}
                            renderItem={item => {
                              const isUsed = appliedVoucher?._id === item._id;
                              const isExpired = new Date(item.endDate) < new Date();
                              const percentUsed = item.usageLimit ? Math.round((item.usageCount / item.usageLimit) * 100) : 0;

                              return (
                                <div style={{
                                  display: 'flex',
                                  border: '1px solid #e8e8e8',
                                  borderRadius: '8px',
                                  marginBottom: '12px',
                                  overflow: 'hidden',
                                  opacity: isUsed || isExpired ? 0.7 : 1,
                                  background: isUsed ? '#e6f7ff' : '#fff'
                                }}>
                                  <div style={{
                                    width: '100px',
                                    background: '#1890ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    color: '#fff',
                                    padding: '8px'
                                  }}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                      {item.type === 'percentage' ? `${item.value}%` : `${item.value / 1000}k`}
                                    </span>
                                    <span style={{ fontSize: '10px' }}>GIẢM</span>
                                  </div>
                                  <div style={{ flex: 1, padding: '12px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                                      {item.minPurchase > 0 ? `Đơn tối thiểu ${convertPrice(item.minPurchase)}` : 'Không giới hạn đơn tối thiểu'}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#999', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>HSD: {new Date(item.endDate).toLocaleDateString()}</span>
                                      {item.usageLimit && <span>Đã dùng: {percentUsed}%</span>}
                                    </div>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    borderLeft: '1px dashed #e8e8e8'
                                  }}>
                                    {isUsed ? (
                                      <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '12px' }}>Đã chọn</span>
                                    ) : (
                                      <Button
                                        type="link"
                                        size="small"
                                        onClick={() => {
                                          handleApplyVoucherWithCode(item.code);
                                        }}
                                      >
                                        Dùng ngay
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        {isLoadingActiveShippingVouchers ? (
                          <Loading />
                        ) : (
                          <List
                            dataSource={activeShippingVouchers?.data || []}
                            renderItem={item => {
                              const isUsed = appliedFreeshipCode?._id === item._id;
                              const isExpired = new Date(item.endDate) < new Date();
                              const percentUsed = item.usageLimit ? Math.round((item.usageCount / item.usageLimit) * 100) : 0;

                              return (
                                <div style={{
                                  display: 'flex',
                                  border: '1px solid #e8e8e8',
                                  borderRadius: '8px',
                                  marginBottom: '12px',
                                  overflow: 'hidden',
                                  opacity: isUsed || isExpired ? 0.7 : 1,
                                  background: isUsed ? '#f6ffed' : '#fff'
                                }}>
                                  <div style={{
                                    width: '100px',
                                    background: '#52c41a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    color: '#fff',
                                    padding: '8px'
                                  }}>
                                    <TruckOutlined style={{ fontSize: '24px', marginBottom: '4px' }} />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                      {item.type === 'free' ? 'FREESHIP' : item.type === 'percentage' ? `${item.value}%` : `${item.value / 1000}k`}
                                    </span>
                                  </div>
                                  <div style={{ flex: 1, padding: '12px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                      {item.minPurchase > 0 ? `Đơn tối thiểu ${convertPrice(item.minPurchase)}` : 'Không giới hạn đơn tối thiểu'}
                                    </div>
                                    {item.shippingProviders?.length > 0 && (
                                      <div style={{ fontSize: '11px', color: '#1890ff', marginBottom: '4px' }}>
                                        Áp dụng: {item.shippingProviders.map(p => p.name).join(', ')}
                                      </div>
                                    )}
                                    <div style={{ fontSize: '10px', color: '#999', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>HSD: {new Date(item.endDate).toLocaleDateString()}</span>
                                      {item.usageLimit && <span>Đã dùng: {percentUsed}%</span>}
                                    </div>
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    borderLeft: '1px dashed #e8e8e8'
                                  }}>
                                    {isUsed ? (
                                      <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '12px' }}>Đã chọn</span>
                                    ) : (
                                      <Button
                                        type="link"
                                        size="small"
                                        onClick={() => {
                                          handleApplyFreeshipCodeWithCode(item.code);
                                        }}
                                      >
                                        Dùng ngay
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                </ModalComponent>

                <WrapperTotal>
                  <span className="total-label">Tổng tiền</span>
                  <div className="total-price-wrapper">
                    <span className="total-price-large">
                      {convertPrice(totalPriceMemo)}
                    </span>
                    <span className="total-note">(Chưa bao gồm phí vận chuyển)</span>
                  </div>
                </WrapperTotal>
              </div>

              <BuyButtonWrapper>
                <ButtonComponent
                  onClick={handleAddCard}
                  size="large"
                  styleButton={{
                    background:
                      order?.orderItemsSelected?.length > 0 ? '#1a94ff' : '#d9d9d9',
                    height: 52,
                    width: '100%',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor:
                      order?.orderItemsSelected?.length > 0
                        ? 'pointer'
                        : 'not-allowed'
                  }}
                  disabled={order?.orderItemsSelected?.length === 0}
                  textbutton={
                    <Space>
                      <CheckCircleOutlined style={{ fontSize: 18 }} />
                      Mua hàng ({order?.orderItemsSelected?.length || 0})
                    </Space>
                  }
                  styletextbutton={{
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 700
                  }}
                />
              </BuyButtonWrapper>
            </WrapperRight>
          )}
        </div>
      </div>

      {/* MODAL UPDATE USER INFO */}
      <ModalComponent
        title="Cập nhật thông tin giao hàng"
        open={isOpenModalUpdateInfo}
        onCancel={handleCancelUpdate}
        onOk={handleUpdateInfoUser}
        width={900}
        style={{ top: 20 }}
      >
        <Loading isPending={isPending}>
          <Form
            name="basic"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            autoComplete="on"
            form={form}
          >
            <Form.Item
              label="Họ tên"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Inputcomponent
                value={stateUserDetails['name']}
                onChange={handleOnchangeDetails}
                name="name"
                placeholder="Nhập họ và tên"
              />
            </Form.Item>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
              ]}
            >
              <Inputcomponent
                value={stateUserDetails.phone}
                onChange={handleOnchangeDetails}
                name="phone"
                placeholder="Nhập số điện thoại"
              />
            </Form.Item>
            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[{ required: true, message: 'Vui lòng chọn địa chỉ!' }]}
            >
              <AddressPicker
                value={{
                  address: stateUserDetails.address,
                  city: stateUserDetails.city,
                  province: stateUserDetails.province,
                  district: stateUserDetails.district,
                  ward: stateUserDetails.ward
                }}
                onChange={handleAddressChange}
                form={form}
              />
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>
    </WrapperCartContainer>
  )
}

export default OrderPage

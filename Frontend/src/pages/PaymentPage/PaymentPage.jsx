import React, { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import { Tabs } from 'antd'
import { Radio, Tag, Space, List, Button } from 'antd'
import {
  WrapperPaymentContainer,
  WrapperLeft,
  WrapperRight,
  WrapperInfo,
  WrapperTotal,
  WrapperPriceInfo,
  WrapperTotalPrice,
  WrapperButton,
  WrapperPayPal,
  Lable,
  WrapperRadio,
  WrapperShippingCard,
  WrapperItemOrder
} from './style'
import {
  EnvironmentOutlined,
  TruckOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  GiftOutlined,

  CheckOutlined,
  TagsOutlined
} from '@ant-design/icons'
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent'
import { useDispatch, useSelector } from 'react-redux'
import { convertPrice } from '../../utils'
import ModalComponent from '../../components/ModalComponent/ModalComponent'
import Inputcomponent from '../../components/Inputcomponent/Inputcomponent'
import AddressPicker from '../../components/AddressPicker/AddressPicker'
import { useMutationHooks } from '../../hooks/useMutationHook'
import * as UserService from '../../services/UserService'
import * as OrderService from '../../services/OrderService'
import * as VoucherService from '../../services/VoucherService'
import * as ShippingVoucherService from '../../services/ShippingVoucherService'
import Loading from '../../components/LoadingComponent/Loading'
import * as message from '../../components/Message/Message'
import { updateUser } from '../../redux/slides/userSlide'
import { useNavigate } from 'react-router-dom'
import { removeallorderProduct, clearCart, applyVoucher, removeVoucher, applyFreeshipCode, removeFreeshipCode, setShippingMethod, addToOrderSelected } from '../../redux/slides/orderSlide'
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import * as PaymentService from '../../services/PaymentService'
import * as ShippingService from '../../services/ShippingService'
import { findBestShippingRate, getRateMethodIdentifier, getRateProviderId, getRateUniqueId, normalizeIdentifier } from '../../utils/shipping'
import { useQueryClient, useQuery } from '@tanstack/react-query'

const PaymentPage = () => {
  const order = useSelector((state) => state.order)
  const user = useSelector((state) => state.user)
  const [isOpenModalUpdateInfo, setIsOpenModalUpdateInfo] = useState(false)
  const [isOpenModalVoucher, setIsOpenModalVoucher] = useState(false)

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
  const [delivery, setDelivery] = useState('fast')
  const [payment, setPayment] = useState('later_money')
  const [selectedShippingRate, setSelectedShippingRate] = useState(null)
  // Lấy voucher từ Redux state, nếu không có thì dùng local state
  const [voucherCode, setVoucherCode] = useState(order?.voucherCode || '')
  const [voucherDiscount, setVoucherDiscount] = useState(order?.voucherDiscount || 0)
  const [appliedVoucher, setAppliedVoucher] = useState(order?.appliedVoucher || null)
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [isAutoApplyingVoucher, setIsAutoApplyingVoucher] = useState(false)
  // Freeship code state
  const [freeshipCode, setFreeshipCode] = useState(order?.freeshipCode || '')
  const [appliedFreeshipCode, setAppliedFreeshipCode] = useState(order?.appliedFreeshipCode || null)
  const [freeshipDiscount, setFreeshipDiscount] = useState(order?.freeshipDiscount || 0)
  const [isValidatingFreeshipCode, setIsValidatingFreeshipCode] = useState(false)
  const [isRestoringBuyNow, setIsRestoringBuyNow] = useState(true)
  const navigate = useNavigate()
  const [sdkReady, setSdkReady] = useState(false)
  const queryClient = useQueryClient()
  const [hasCompletedOrder, setHasCompletedOrder] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState(null)
  const [isMoMoLoading, setIsMoMoLoading] = useState(false)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

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
  const [form] = Form.useForm();
  const dispatch = useDispatch()

  const saveSuccessState = (payload) => {
    try {
      sessionStorage.setItem('last_order_success', JSON.stringify(payload))
    } catch (error) {
      console.warn('Could not cache order success data', error)
    }
  }


  // Khôi phục đơn "Mua ngay" nếu có lưu tạm trong sessionStorage
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('pending_buy_now')
      console.log('📋 Checking for pending buy-now:', pending ? 'Found' : 'Not found')

      if (pending && (!order?.orderItemsSelected || order.orderItemsSelected.length === 0)) {
        console.log('🔄 Restoring pending buy-now items...')
        const items = JSON.parse(pending)
        if (Array.isArray(items) && items.length > 0) {
          console.log('✅ Found', items.length, 'item(s) to restore')
          items.forEach((orderItem) => {
            console.log('➕ Restoring item:', orderItem.name)
            dispatch(addToOrderSelected({ orderItem }))
          })
        }
      } else if (pending && order?.orderItemsSelected?.length > 0) {
        console.log('⏭️  Skipping restore - orderItemsSelected already has', order.orderItemsSelected.length, 'items')
      }
    } catch (e) {
      console.warn('Restore buy-now failed', e)
    } finally {
      // Luôn xoá cache tạm để tránh lặp
      sessionStorage.removeItem('pending_buy_now')
      console.log('🧹 Cleared pending_buy_now from sessionStorage')
      setIsRestoringBuyNow(false)
    }
  }, [dispatch, order?.orderItemsSelected])

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

  // Tự động áp dụng lại voucher từ Redux khi vào trang thanh toán
  useEffect(() => {
    // Nếu đã có voucher trong Redux và chưa áp dụng ở PaymentPage
    if (order?.appliedVoucher && order?.voucherCode && !appliedVoucher && !isAutoApplyingVoucher) {
      // Kiểm tra xem có sản phẩm trong giỏ hàng không
      if (order?.orderItemsSelected && order.orderItemsSelected.length > 0 && user?.access_token) {
        setIsAutoApplyingVoucher(true)

        // Tự động validate và áp dụng lại voucher
        const autoApplyVoucher = async () => {
          try {
            const priceMemo = order.orderItemsSelected.reduce((total, cur) => {
              return total + cur.price * cur.amount
            }, 0)

            const result = await VoucherService.validateVoucher(
              order.voucherCode,
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
              setVoucherCode(order.voucherCode)

              // Cập nhật lại Redux với dữ liệu mới nhất
              dispatch(applyVoucher({
                voucherCode: order.voucherCode,
                voucherDiscount: discountAmount,
                appliedVoucher: promotion,
                promotionId: promotionId
              }))
            } else {
              // Nếu voucher không còn hợp lệ, xóa khỏi Redux
              dispatch(removeVoucher())
              setVoucherCode('')
              setVoucherDiscount(0)
              setAppliedVoucher(null)
            }
          } catch (error) {
            console.error('Error auto-applying voucher:', error)
            // Nếu có lỗi, xóa voucher
            dispatch(removeVoucher())
            setVoucherCode('')
            setVoucherDiscount(0)
            setAppliedVoucher(null)
          } finally {
            setIsAutoApplyingVoucher(false)
          }
        }

        autoApplyVoucher()
      }
    }
  }, [order?.appliedVoucher, order?.voucherCode, order?.orderItemsSelected, appliedVoucher, isAutoApplyingVoucher, user?.access_token, dispatch])

  const handleChangeAddress = () => {
    setIsOpenModalUpdateInfo(true)
  }

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


  const priceMemo = useMemo(() => {
    const result = order?.orderItemsSelected?.reduce((total, cur) => {
      return total + cur.price * cur.amount
    }, 0)
    return result || 0
  }, [order])

  // Tính tổng số tiền được giảm (để hiển thị, không dùng để tính tổng)
  const priceDiscountMemo = useMemo(() => {
    const result = order?.orderItemsSelected?.reduce((total, cur) => {
      const discount = cur.discount || 0
      const originalPrice = cur.originalPrice || cur.price

      // Nếu có discount, tính số tiền được giảm
      if (discount > 0 && discount < 100 && originalPrice > cur.price) {
        const discountAmount = (originalPrice - cur.price) * cur.amount
        return total + discountAmount
      }
      return total
    }, 0)
    return result || 0
  }, [order])

  // Fetch available shipping rates
  const { data: shippingRatesData, refetch: refetchShippingRates, isLoading: isLoadingShippingRates } = useQuery({
    queryKey: ['available-shipping-rates', priceMemo, user?.city],
    queryFn: () => {
      return ShippingService.getAvailableShippingRates(priceMemo, user?.city)
    },
    enabled: priceMemo > 0 && !!order?.orderItemsSelected && order?.orderItemsSelected?.length > 0
  })

  // Calculate estimated delivery date
  const getEstimatedDeliveryDate = (rate) => {
    if (!rate?.estimatedDays) return null
    const minDays = rate.estimatedDays.min || 1
    const maxDays = rate.estimatedDays.max || 3
    const avgDays = Math.ceil((minDays + maxDays) / 2)
    const date = new Date()
    date.setDate(date.getDate() + avgDays)
    return date
  }

  const getShippingMethodLabel = (rate) => {
    const map = {
      standard: 'Giao tiêu chuẩn (Standard)',
      express: 'Giao nhanh (Express)',
      fast: 'Giao hỏa tốc (Fast)',
      custom: 'Phương thức khác'
    }
    return map[rate?.shippingMethod] || rate?.name || 'Phương thức vận chuyển'
  }

  const getShippingEtaText = (rate) => {
    const min = rate?.estimatedDays?.min || 1
    const max = rate?.estimatedDays?.max || min
    if (max <= 1) return 'Giao trong ngày'
    return `Giao ${min}-${max} ngày`
  }

  const persistSelectedShippingRate = (rate) => {
    if (!rate) return
    const nextRateId = getRateUniqueId(rate)
    const currentRateId = getRateUniqueId(selectedShippingRate)
    const storedRateId = normalizeIdentifier(order?.selectedShippingMethod?.rateId)
    const normalizedMethod = (order?.selectedShippingMethod?.shippingMethod || '').toLowerCase()
    const rateMethod = (rate.shippingMethod || '').toLowerCase()

    const shouldUpdateState = !currentRateId || currentRateId !== nextRateId
    const shouldUpdateRedux =
      !order?.selectedShippingMethod ||
      !storedRateId ||
      storedRateId !== nextRateId ||
      normalizedMethod !== rateMethod

    if (shouldUpdateState) {
      setSelectedShippingRate(rate)
    }

    if (shouldUpdateRedux) {
      const methodIdentifier = getRateMethodIdentifier(rate) || rate.shippingMethod || 'standard'
      dispatch(
        setShippingMethod({
          shippingMethod: methodIdentifier,
          rateId: nextRateId,
          providerId: getRateProviderId(rate),
          providerName: rate?.provider?.name || rate?.providerName || '',
          shippingRateName: rate.name,
          estimatedDeliveryDate: getEstimatedDeliveryDate(rate)
        })
      )
    }
  }

  const autoSelectShippingRate = (rates) => {
    if (!Array.isArray(rates) || rates.length === 0) return
    const preferredProviders =
      (appliedFreeshipCode?.shippingProviders ||
        order?.appliedFreeshipCode?.shippingProviders ||
        [])
        .map((provider) => normalizeIdentifier(provider).toLowerCase())
        .filter(Boolean)

    const bestRate = findBestShippingRate(rates, {
      preferredMethod: order?.selectedShippingMethod?.shippingMethod,
      preferredRateId: order?.selectedShippingMethod?.rateId,
      preferredProviders
    })

    if (bestRate) {
      persistSelectedShippingRate(bestRate)
    }
  }

  // Sync selected shipping rate from Redux when shipping rates data changes
  useEffect(() => {
    if (shippingRatesData?.status === 'OK' && shippingRatesData?.data?.length > 0) {
      // Chỉ auto-select nếu chưa có rate được chọn hoặc rate hiện tại không match với data mới
      const currentRateId = getRateUniqueId(selectedShippingRate)
      const hasMatchingRate = shippingRatesData.data.some(rate => getRateUniqueId(rate) === currentRateId)

      if (!selectedShippingRate || !hasMatchingRate) {
        autoSelectShippingRate(shippingRatesData.data)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingRatesData?.status, shippingRatesData?.data])

  const handleSelectShippingRate = (rate) => {
    persistSelectedShippingRate(rate)
  }

  const diliveryPriceMemo = useMemo(() => {
    if (priceMemo === 0 || order?.orderItemsSelected?.length === 0) return 0
    if (selectedShippingRate) {
      return selectedShippingRate.shippingFee || 0
    }
    // Fallback to old logic if no rate selected
    if (priceMemo >= 500000) return 0
    if (priceMemo >= 200000) return 10000
    return 20000
  }, [priceMemo, order?.orderItemsSelected?.length, selectedShippingRate])

  // Tính phí vận chuyển sau khi áp dụng freeship code
  const finalShippingPriceMemo = useMemo(() => {
    const baseShippingFee = diliveryPriceMemo
    if (baseShippingFee === 0 || freeshipDiscount === 0) return baseShippingFee
    return Math.max(0, baseShippingFee - freeshipDiscount)
  }, [diliveryPriceMemo, freeshipDiscount])

  // Tổng tiền = giá đã giảm + phí vận chuyển - voucher discount
  const totalPriceMemo = useMemo(() => {
    const subtotal = Number(priceMemo) + Number(finalShippingPriceMemo)
    const finalTotal = subtotal - Number(voucherDiscount)
    return Math.max(0, finalTotal)
  }, [priceMemo, finalShippingPriceMemo, voucherDiscount])



  const handleApplyVoucherWithCode = (code) => {
    setVoucherCode(code)
    handleApplyVoucher(code)
  }

  // Handle voucher validation
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

    // Không cho áp dụng 2 voucher cùng lúc - nếu đã có voucher thì xóa trước
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
        setIsOpenModalVoucher(false)

        // Lưu vào Redux (bao gồm promotionId)
        dispatch(applyVoucher({
          voucherCode: codeToUse.trim().toUpperCase(),
          voucherDiscount: discountAmount,
          appliedVoucher: promotion,
          promotionId: promotionId
        }))

        message.success(`Áp dụng mã voucher thành công! Giảm ${discountAmount.toLocaleString()} VNĐ`)
      } else {
        const errorMessage = result.message || 'Mã voucher không hợp lệ'
        if (errorMessage.includes('không áp dụng cho sản phẩm trong giỏ hàng')) {
          message.error('Voucher này không áp dụng cho sản phẩm trong giỏ hàng của bạn.')
        } else {
          message.error(errorMessage)
        }
      }

    } catch (e) {
      message.error('Có lỗi xảy ra khi áp dụng voucher')
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
    setFoucherCodeForFreeship(code)
    handleApplyFreeshipCode(code)
  }

  // Need to use a separate state for freeship input if they are different, 
  // but looking at the code it uses 'freeshipCode' state.
  // Wait, I should check if I need to add setFoucherCodeForFreeship or just use setFreeshipCode.
  // The state defined at the top is [freeshipCode, setFreeshipCode].

  const handleApplyFreeshipCode = async (codeOverride) => {
    const codeToUse = typeof codeOverride === 'string' ? codeOverride : freeshipCode;

    if (!codeToUse || !codeToUse.trim()) {
      message.warning('Vui lòng nhập mã freeship')
      return
    }

    if (!order?.orderItemsSelected || order.orderItemsSelected.length === 0) {
      message.warning('Vui lòng chọn sản phẩm để áp dụng mã freeship')
      return
    }

    if (!selectedShippingRate) {
      message.warning('Vui lòng chọn phương thức vận chuyển trước')
      return
    }

    // Không cho áp dụng 2 freeship code cùng lúc
    if (appliedFreeshipCode) {
      message.warning('Bạn đã áp dụng một mã freeship. Vui lòng xóa mã hiện tại trước khi áp dụng mã mới.')
      return
    }

    setIsValidatingFreeshipCode(true)
    try {
      const providerId = selectedShippingRate.provider?._id || selectedShippingRate.provider
      const userId = user?.id || null

      const result = await ShippingVoucherService.validateShippingVoucher(
        codeToUse.trim().toUpperCase(),
        providerId,
        priceMemo,
        userId
      )

      if (result.status === 'OK' && result.data?.voucher) {
        const voucher = result.data.voucher
        const shippingFee = selectedShippingRate.shippingFee || 0

        // Tính toán discount amount
        let discountAmount = 0
        if (voucher.type === 'free') {
          discountAmount = shippingFee // Miễn phí toàn bộ
        } else if (voucher.type === 'percentage') {
          discountAmount = (shippingFee * voucher.value) / 100
          if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
            discountAmount = voucher.maxDiscount
          }
        } else if (voucher.type === 'fixed') {
          discountAmount = voucher.value
          if (discountAmount > shippingFee) {
            discountAmount = shippingFee
          }
        }
        discountAmount = Math.round(discountAmount)

        // Update local state
        setFreeshipDiscount(discountAmount)
        setAppliedFreeshipCode(voucher)
        setIsOpenModalVoucher(false)

        // Lưu vào Redux
        dispatch(applyFreeshipCode({
          freeshipCode: codeToUse.trim().toUpperCase(),
          appliedFreeshipCode: voucher,
          freeshipDiscount: discountAmount,
          shippingVoucherId: voucher._id
        }))

        message.success(`Áp dụng mã freeship thành công! ${discountAmount > 0 ? `Giảm ${convertPrice(discountAmount)} phí vận chuyển` : 'Miễn phí vận chuyển'}`)
      } else {
        const errorMessage = result.message || 'Mã freeship không hợp lệ'
        message.error(errorMessage)
        setFreeshipDiscount(0)
        setAppliedFreeshipCode(null)
      }
    } catch (error) {
      console.error('Error validating freeship code:', error)
      message.error('Có lỗi xảy ra khi kiểm tra mã freeship')
      setFreeshipDiscount(0)
      setAppliedFreeshipCode(null)
    } finally {
      setIsValidatingFreeshipCode(false)
    }
  }

  const setFoucherCodeForFreeship = (code) => {
    setFreeshipCode(code)
  }

  const handleRemoveFreeshipCode = () => {
    setFreeshipCode('')
    setFreeshipDiscount(0)
    setAppliedFreeshipCode(null)

    // Xóa khỏi Redux
    dispatch(removeFreeshipCode())

    message.success('Đã xóa mã freeship')
  }

  // Auto-apply freeship code from Redux
  useEffect(() => {
    // Chỉ chạy khi có freeship code trong Redux nhưng chưa áp dụng ở local state
    if (order?.appliedFreeshipCode && order?.freeshipCode && !appliedFreeshipCode && selectedShippingRate) {
      const providerId = selectedShippingRate.provider?._id || selectedShippingRate.provider
      const voucherProviderIds = order.appliedFreeshipCode.shippingProviders?.map(p =>
        typeof p === 'object' ? p._id?.toString() : p.toString()
      ) || []

      // Nếu voucher có giới hạn provider và provider hiện tại nằm trong danh sách, hoặc không có giới hạn
      if (voucherProviderIds.length === 0 || voucherProviderIds.includes(providerId?.toString())) {
        setAppliedFreeshipCode(order.appliedFreeshipCode)
        setFreeshipCode(order.freeshipCode)
        // Recalculate discount
        const shippingFee = selectedShippingRate.shippingFee || 0
        let discountAmount = 0
        if (order.appliedFreeshipCode.type === 'free') {
          discountAmount = shippingFee
        } else if (order.appliedFreeshipCode.type === 'percentage') {
          discountAmount = (shippingFee * order.appliedFreeshipCode.value) / 100
          if (order.appliedFreeshipCode.maxDiscount && discountAmount > order.appliedFreeshipCode.maxDiscount) {
            discountAmount = order.appliedFreeshipCode.maxDiscount
          }
        } else if (order.appliedFreeshipCode.type === 'fixed') {
          discountAmount = order.appliedFreeshipCode.value
          if (discountAmount > shippingFee) {
            discountAmount = shippingFee
          }
        }
        discountAmount = Math.round(discountAmount)
        setFreeshipDiscount(discountAmount)
        // Chỉ dispatch nếu discount khác với giá trị hiện tại trong Redux
        if (order.freeshipDiscount !== discountAmount) {
          dispatch(applyFreeshipCode({
            freeshipCode: order.freeshipCode,
            appliedFreeshipCode: order.appliedFreeshipCode,
            freeshipDiscount: discountAmount,
            shippingVoucherId: order.appliedFreeshipCode._id
          }))
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.appliedFreeshipCode?._id, order?.freeshipCode, appliedFreeshipCode, selectedShippingRate?._id])

  // Reset freeship code when shipping rate changes
  useEffect(() => {
    if (appliedFreeshipCode && selectedShippingRate) {
      const providerId = selectedShippingRate.provider?._id || selectedShippingRate.provider
      const voucherProviderIds = appliedFreeshipCode.shippingProviders?.map(p =>
        typeof p === 'object' ? p._id?.toString() : p.toString()
      ) || []

      // Nếu voucher có giới hạn provider và provider hiện tại không nằm trong danh sách, xóa freeship code
      if (voucherProviderIds.length > 0 && !voucherProviderIds.includes(providerId?.toString())) {
        handleRemoveFreeshipCode()
        message.warning('Mã freeship không áp dụng cho phương thức vận chuyển đã chọn')
      } else {
        // Recalculate discount với shipping fee mới - chỉ update nếu discount thay đổi
        const shippingFee = selectedShippingRate.shippingFee || 0
        let discountAmount = 0
        if (appliedFreeshipCode.type === 'free') {
          discountAmount = shippingFee
        } else if (appliedFreeshipCode.type === 'percentage') {
          discountAmount = (shippingFee * appliedFreeshipCode.value) / 100
          if (appliedFreeshipCode.maxDiscount && discountAmount > appliedFreeshipCode.maxDiscount) {
            discountAmount = appliedFreeshipCode.maxDiscount
          }
        } else if (appliedFreeshipCode.type === 'fixed') {
          discountAmount = appliedFreeshipCode.value
          if (discountAmount > shippingFee) {
            discountAmount = shippingFee
          }
        }
        discountAmount = Math.round(discountAmount)

        // Chỉ update nếu discount thay đổi để tránh vòng lặp
        if (freeshipDiscount !== discountAmount) {
          setFreeshipDiscount(discountAmount)
          dispatch(applyFreeshipCode({
            freeshipCode: freeshipCode,
            appliedFreeshipCode: appliedFreeshipCode,
            freeshipDiscount: discountAmount,
            shippingVoucherId: appliedFreeshipCode._id
          }))
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShippingRate?._id, selectedShippingRate?.shippingFee])


  // Handle MoMo Payment
  const handleMoMoPayment = async () => {
    // Kiểm tra đăng nhập
    if (!user?.id || !user?.access_token) {
      message.warning('Vui lòng đăng nhập để tiếp tục mua hàng')
      navigate('/sign-in', { state: { from: '/payment' } })
      return
    }

    if (!order?.orderItemsSelected?.length) {
      message.error('Vui lòng chọn ít nhất một sản phẩm để tiếp tục')
      navigate('/order')
      return
    }

    if (!user?.phone || !user?.address || !user?.name || !user?.city) {
      setIsOpenModalUpdateInfo(true)
      message.warning('Vui lòng cập nhật thông tin giao hàng')
      return
    }

    // Kiểm tra đã chọn phương thức vận chuyển (chỉ cần method, BE tự chọn hãng)
    const shippingMethodValue = order?.selectedShippingMethod?.shippingMethod || order?.selectedShippingMethod
    if (!shippingMethodValue) {
      message.error('Vui lòng chọn phương thức vận chuyển trước khi thanh toán')
      return
    }

    setIsMoMoLoading(true)
    try {
      // 1. Tạo đơn hàng ở backend trước (trạng thái chờ thanh toán)
      const orderRes = await mutationAddOrder.mutateAsync({
        token: user?.access_token,
        orderItems: order?.orderItemsSelected,
        fullName: user?.name,
        address: user?.address,
        phone: user?.phone,
        city: user?.city,
        province: user?.province,
        district: user?.district,
        ward: user?.ward,
        paymentMethod: 'momo',
        itemsPrice: priceMemo,
        shippingPrice: finalShippingPriceMemo,
        totalPrice: totalPriceMemo,
        voucherDiscount: voucherDiscount,
        voucherCode: appliedVoucher?.code || order?.voucherCode || null,
        promotionId: order?.promotionId || appliedVoucher?._id || null,
        freeshipCode: appliedFreeshipCode?.code || order?.freeshipCode || null,
        shippingVoucherId: order?.shippingVoucherId || appliedFreeshipCode?._id || null,
        freeshipDiscount: freeshipDiscount || 0,
        shippingMethod: shippingMethodValue,
        user: user?.id,
        email: user?.email,
        isPaid: false,
        status: 'pending_payment'
      });

      if (orderRes?.status !== 'OK') {
        message.error(orderRes?.message || 'Không thể tạo đơn hàng');
        setIsMoMoLoading(false);
        return;
      }

      const realOrderId = orderRes?.data?._id;
      setCreatedOrderId(realOrderId);

      // Lưu orderId vào sessionStorage để handle ở return page
      sessionStorage.setItem('momo_temp_orderId', realOrderId);

      // 2. Tạo payment request với MoMo
      const paymentData = {
        amount: totalPriceMemo,
        orderInfo: `pay_order_${realOrderId}`,
        redirectUrl: `${window.location.origin}/payment/momo/return`,
        ipnUrl: `${process.env.REACT_APP_API_URL}/payment/momo/ipn`,
        orderId: `MOMO_${realOrderId}_${new Date().getTime()}` // Fake MoMo orderId to avoid duplicate if user retries
      }

      const paymentResult = await PaymentService.createMoMoPayment(paymentData)

      if (paymentResult?.status === 'OK' && paymentResult?.data?.payUrl) {
        // Xóa giỏ hàng trước khi redirect (vì đơn đã được tạo thành công trong DB)
        dispatch(clearCart());
        // Redirect đến MoMo payment page
        window.location.href = paymentResult.data.payUrl
      } else {
        const rawMsg = paymentResult?.message || 'Không thể tạo link thanh toán MoMo'
        const safeMsg = typeof rawMsg === 'string' ? rawMsg : (rawMsg?.message || (rawMsg ? JSON.stringify(rawMsg) : null) || 'Không thể tạo link thanh toán MoMo')
        message.error(safeMsg);
        // Note: Đơn hàng vẫn tồn tại trong DB với status pending_payment
      }
    } catch (error) {
      console.error('MoMo Payment Error:', error)
      const raw = error?.message || 'Có lỗi xảy ra khi thanh toán MoMo'
      const safe = typeof raw === 'string' ? raw : (raw?.message || (raw ? JSON.stringify(raw) : null) || 'Có lỗi xảy ra khi thanh toán MoMo')
      message.error(safe)
    } finally {
      setIsMoMoLoading(false)
    }
  }

  const handledAddOrder = () => {
    // ✅ Kiểm tra nếu đã completed hoặc đang trong quá trình submit thì không cho gọi lại (tránh duplicate)
    if (hasCompletedOrder || isPendingAddOrder || isMoMoLoading || isSubmittingOrder) {
      console.warn('❌ Order already completed or submission in progress')
      return
    }

    if (payment === 'momo') {
      handleMoMoPayment()
      return
    }

    setIsSubmittingOrder(true)

    // Kiểm tra đăng nhập
    if (!user?.id || !user?.access_token) {
      message.warning('Vui lòng đăng nhập để tiếp tục mua hàng')
      navigate('/sign-in', { state: { from: '/payment' } })
      return
    }

    if (!order?.orderItemsSelected?.length) {
      message.error('Vui lòng chọn ít nhất một sản phẩm để tiếp tục')
      navigate('/order')
      return
    }

    if (!user?.phone || !user?.address || !user?.name || !user?.city) {
      setIsOpenModalUpdateInfo(true)
      message.warning('Vui lòng cập nhật thông tin giao hàng')
      return
    }

    // Kiểm tra đã chọn phương thức vận chuyển (chỉ cần method, BE tự chọn hãng)
    // Đảm bảo shippingMethodValue luôn là string
    let shippingMethodValue = order?.selectedShippingMethod?.shippingMethod || order?.selectedShippingMethod

    // Nếu là object, extract string từ object
    if (shippingMethodValue && typeof shippingMethodValue === 'object') {
      shippingMethodValue = shippingMethodValue.shippingMethod || shippingMethodValue.method || shippingMethodValue.code || null
    }

    // Convert sang string nếu cần
    if (shippingMethodValue && typeof shippingMethodValue !== 'string') {
      shippingMethodValue = String(shippingMethodValue)
    }

    // Normalize: trim và lowercase
    if (shippingMethodValue) {
      shippingMethodValue = shippingMethodValue.trim().toLowerCase()
    }

    if (!shippingMethodValue) {
      message.error('Vui lòng chọn phương thức vận chuyển trước khi đặt hàng')
      return
    }

    if (user?.access_token && order?.orderItemsSelected && user?.name
      && user?.address && user?.phone && user?.city && priceMemo && user?.id) {
      console.log('📝 Submitting order with payment method:', payment)
      console.log('📦 Order data:', {
        orderItemsCount: order?.orderItemsSelected?.length,
        shippingMethod: shippingMethodValue,
        selectedShippingMethod: order?.selectedShippingMethod,
        priceMemo,
        finalShippingPriceMemo,
        totalPriceMemo
      })
      mutationAddOrder.mutate(
        {
          token: user?.access_token,
          orderItems: order?.orderItemsSelected,
          fullName: user?.name,
          address: user?.address,
          phone: user?.phone,
          city: user?.city,
          province: user?.province,
          district: user?.district,
          ward: user?.ward,
          paymentMethod: payment,
          itemsPrice: priceMemo,
          shippingPrice: finalShippingPriceMemo,
          totalPrice: totalPriceMemo,
          voucherDiscount: voucherDiscount,
          voucherCode: appliedVoucher?.code || order?.voucherCode || null,
          promotionId: order?.promotionId || appliedVoucher?._id || null, // Gửi promotionId để backend tăng usageCount
          freeshipCode: appliedFreeshipCode?.code || order?.freeshipCode || null,
          shippingVoucherId: order?.shippingVoucherId || appliedFreeshipCode?._id || null,
          freeshipDiscount: freeshipDiscount || 0,
          shippingMethod: shippingMethodValue,
          user: user?.id,
          email: user?.email
        },
        {
          onSuccess: (responseData) => {
            // Xử lý khi đặt hàng thành công
            if (responseData?.status === 'OK') {
              console.log('✅ Order created successfully:', responseData?.data?._id)

              const successState = {
                delivery,
                payment,
                orders: order?.orderItemsSelected,
                totalPriceMemo: totalPriceMemo,
                orderId: responseData?.data?._id || responseData?.data?.id || null,
                shippingRateName: selectedShippingRate?.name || null,
                estimatedDeliveryDate: order?.selectedShippingMethod?.estimatedDeliveryDate || null
              }

              saveSuccessState(successState)
              console.log('✅ Success state saved to sessionStorage')

              // Invalidate cache của tất cả các sản phẩm trong đơn hàng để cập nhật số lượng
              if (order?.orderItemsSelected && order.orderItemsSelected.length > 0) {
                order.orderItemsSelected.forEach((item) => {
                  if (item.product) {
                    queryClient.invalidateQueries({
                      queryKey: ['product-details', item.product]
                    });
                  }
                });
              }
              console.log('✅ Cache invalidated for products')

              // Invalidate cache của promotions để cập nhật số lượng voucher còn lại
              if (order?.promotionId || appliedVoucher?._id) {
                queryClient.invalidateQueries({
                  queryKey: ['promotions']
                });
              }
              console.log('✅ Cache invalidated for promotions')

              // Xóa toàn bộ giỏ hàng sau khi mua hàng thành công
              dispatch(clearCart())
              console.log('✅ Cart cleared from Redux')

              // Refresh notifications so header updates immediately
              queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
              queryClient.invalidateQueries({ queryKey: ['unread-count', user?.access_token] })
              console.log('✅ Notifications invalidated')

              message.success('Đặt hàng thành công')

              // Set flag TRƯỚC navigate để useEffect biết không cần check điều kiện nữa
              setHasCompletedOrder(true)
              console.log('✅ hasCompletedOrder set to true')

              // Sử dụng setTimeout để ensure tất cả state updates được process trước
              setTimeout(() => {
                console.log('🚀 Navigating to /orderSuccess...')
                navigate('/orderSuccess', {
                  replace: true,
                  state: successState
                })
              }, 100)
            } else {
              setIsSubmittingOrder(false)
              const respMsg = responseData?.message
              const safeRespMsg = typeof respMsg === 'string' ? respMsg : (respMsg?.message || (respMsg ? JSON.stringify(respMsg) : null) || 'Đặt hàng thất bại')
              message.error(safeRespMsg)
            }
          },
          onError: (error) => {
            setIsSubmittingOrder(false)
            console.error('❌ Order creation error:', error)
            console.error('❌ Error details:', {
              message: error?.message,
              response: error?.response?.data,
              status: error?.response?.status,
              url: error?.config?.url
            })
            const raw = error?.response?.data?.message || error?.message || 'Đặt hàng thất bại'
            const errorMessage = typeof raw === 'string' ? raw : (raw?.message || (raw ? JSON.stringify(raw) : null) || 'Đặt hàng thất bại')
            message.error(errorMessage)
          }
        }
      )
    }
  }

  const mutationUpdate = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data
      const res = UserService.updateUser(id, { ...rests }, token)
      return res
    },
  )

  const mutationAddOrder = useMutationHooks(
    (data) => {
      const { id,
        token,
        ...rests } = data
      const res = OrderService.createOrder(
        { ...rests }, token)
      return res
    },
  )

  const mutationPayOrder = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data
      const res = OrderService.payOrder(id, token, rests)
      return res
    }
  )


  const { isPending, data } = mutationUpdate
  const { isPending: isPendingAddOrder } = mutationAddOrder




  const onSuccessPaypal = (details, data) => {
    const orderIdToPay = createdOrderId || data.orderID; // data.orderID is PayPal order ID, but we need our backend order ID

    if (!createdOrderId) {
      console.error('❌ No createdOrderId found for payment confirmation');
      message.error('Lỗi: Không tìm thấy ID đơn hàng để xác nhận thanh toán.');
      return;
    }

    mutationPayOrder.mutate(
      {
        id: createdOrderId,
        token: user?.access_token,
        paidAt: details.update_time,
        paymentTransactionId: details.id
      },
      {
        onSuccess: (responseData) => {
          if (responseData?.status === 'OK') {
            const successState = {
              delivery,
              payment,
              orders: order?.orderItemsSelected,
              totalPriceMemo: totalPriceMemo,
              orderId: createdOrderId,
              shippingRateName: selectedShippingRate?.name || null,
              estimatedDeliveryDate: order?.selectedShippingMethod?.estimatedDeliveryDate || null
            }

            saveSuccessState(successState)
            setHasCompletedOrder(true)

            if (order?.orderItemsSelected && order.orderItemsSelected.length > 0) {
              order.orderItemsSelected.forEach((item) => {
                if (item.product) {
                  queryClient.invalidateQueries({
                    queryKey: ['product-details', item.product]
                  });
                }
              });
            }

            dispatch(clearCart())
            message.success('Thanh toán thành công')
            navigate('/orderSuccess', {
              replace: true,
              state: successState
            })
          } else {
            message.error(responseData?.message || 'Xác nhận thanh toán thất bại')
          }
        },
        onError: (error) => {
          message.error('Lỗi xác nhận thanh toán: ' + (error?.message || 'Unknown error'))
        }
      }
    )
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
            // Clear selected shipping rate to allow re-selection with new city
            setSelectedShippingRate(null)
            // Refetch shipping rates with new city
            refetchShippingRates()
          }
        }
      )
    } else {
      message.error('Vui lòng điền đầy đủ thông tin')
    }
  }

  const handleOnchangeDetails = (e) => {
    setStateUserDetails({
      ...stateUserDetails,
      [e.target.name]: e.target.value
    })
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

  const handleDelivery = (e) => {
    setDelivery(e.target.value)
  }



  // Sync selected shipping rate from Redux when shipping rates data changes
  // This ensures that if user selected shipping method in OrderPage, it will be loaded here
  useEffect(() => {
    if (shippingRatesData?.status === 'OK' && shippingRatesData?.data?.length > 0) {
      // Ưu tiên 1: Tìm theo rateId nếu có (chính xác nhất)
      if (order?.selectedShippingMethod?.rateId) {
        const savedRateById = shippingRatesData.data.find(rate => {
          const rateId = rate._id || rate.id || rate.rateId || ''
          return rateId.toString() === order.selectedShippingMethod.rateId.toString()
        })
        if (savedRateById) {
          if (selectedShippingRate?._id !== savedRateById._id) {
            console.log('PaymentPage - Found rate by ID from Redux, setting:', savedRateById.name)
            setSelectedShippingRate(savedRateById)
          }
          return
        }
      }

      // Ưu tiên 2: Tìm theo shippingMethod nếu có
      if (order?.selectedShippingMethod?.shippingMethod) {
        const savedRate = shippingRatesData.data.find(rate => {
          const rateMethod = (rate.shippingMethod || '').toLowerCase()
          const storedMethod = (order.selectedShippingMethod.shippingMethod || '').toLowerCase()
          return rateMethod === storedMethod
        })
        if (savedRate) {
          if (selectedShippingRate?._id !== savedRate._id) {
            console.log('PaymentPage - Found rate by method from Redux, setting:', savedRate.name)
            setSelectedShippingRate(savedRate)
            // Update Redux với đầy đủ thông tin
            const estimatedDate = getEstimatedDeliveryDate(savedRate)
            dispatch(setShippingMethod({
              shippingMethod: savedRate.shippingMethod,
              rateId: savedRate._id || savedRate.id || '',
              providerId: savedRate.provider?._id || savedRate.providerId || '',
              providerName: savedRate?.provider?.name || '',
              shippingRateName: savedRate.name || '',
              estimatedDeliveryDate: estimatedDate
            }))
          }
          return
        }
        console.warn('PaymentPage - Method from Redux not found in available rates')
      }

      // Nếu không có method trong Redux và chưa có rate được chọn, auto-select first rate
      if (!selectedShippingRate && !order?.selectedShippingMethod?.shippingMethod) {
        console.log('PaymentPage - No Redux method, auto-selecting first rate')
        const firstRate = shippingRatesData.data[0]
        setSelectedShippingRate(firstRate)
        const estimatedDate = getEstimatedDeliveryDate(firstRate)
        dispatch(setShippingMethod({
          shippingMethod: firstRate.shippingMethod,
          rateId: firstRate._id || firstRate.id || '',
          providerId: firstRate.provider?._id || firstRate.providerId || '',
          providerName: firstRate?.provider?.name || '',
          shippingRateName: firstRate.name || '',
          estimatedDeliveryDate: estimatedDate
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingRatesData?.status, shippingRatesData?.data, order?.selectedShippingMethod?.shippingMethod, order?.selectedShippingMethod?.rateId])

  // Clear selected shipping rate when city changes (only if city actually changed)
  useEffect(() => {
    // Chỉ clear nếu city thay đổi và có shipping method trong Redux với city cũ
    // Không clear ngay khi component mount
    const prevCity = sessionStorage.getItem('prevCity')
    if (user?.city && prevCity && prevCity !== user.city) {
      setSelectedShippingRate(null)
      // Clear shipping method trong Redux khi city thay đổi
      dispatch(setShippingMethod(null))
    }
    // Lưu city hiện tại
    if (user?.city) {
      sessionStorage.setItem('prevCity', user.city)
    }
  }, [user?.city, dispatch])
  const handlePayment = (e) => {
    setPayment(e.target.value)
  }
  const addPaypalScript = async () => {
    const { data } = await PaymentService.getConfig()
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://www.paypal.com/sdk/js?client-id=${data}`
    script.async = true;
    script.onload = () => {
      setSdkReady(true)
    }
    document.body.appendChild(script)
  }
  useEffect(() => {
    if (!window.paypal) {
      addPaypalScript()
    } else {
      setSdkReady(true)
    }
  }, [])

  // Redirect if no items selected or not logged in
  useEffect(() => {
    if (isRestoringBuyNow) {
      console.log('⏳ Still restoring buy-now, waiting...')
      return
    }

    // ✅ Nếu đã hoàn tất order, không kiểm tra điều kiện, cho phép navigate '/orderSuccess' được execute
    if (hasCompletedOrder) {
      console.log('✅ Order completed, allowing navigation to success page')
      return
    }

    // ✅ Nếu có dữ liệu thành công từ lần trước trong sessionStorage, không cần validate
    const cachedSuccessState = sessionStorage.getItem('last_order_success')
    if (cachedSuccessState) {
      console.log('✅ Previous order success data found, skipping validation')
      return
    }

    if (!user?.id || !user?.access_token) {
      console.warn('⚠️ User not logged in')
      message.warning('Vui lòng đăng nhập để tiếp tục')
      navigate('/sign-in', { state: { from: '/payment' } })
      return
    }

    console.log('📦 Checking orderItemsSelected:', order?.orderItemsSelected?.length || 0, 'items')

    if (!order?.orderItemsSelected?.length) {
      console.error('❌ No items in orderItemsSelected!')
      message.warning('Vui lòng chọn sản phẩm trước khi thanh toán')
      navigate('/order', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.access_token, order?.orderItemsSelected?.length, isRestoringBuyNow, hasCompletedOrder]) // Kiểm tra lại sau khi khôi phục buy-now

  return (
    <WrapperPaymentContainer>
      <Loading isPending={isPendingAddOrder}>
        <div className="payment-content">
          <div className="payment-header">
            <h2 className="payment-title">
              <ShoppingCartOutlined style={{ marginRight: 12, color: '#1a94ff', fontSize: 28 }} />
              Thanh toán
            </h2>
          </div>

          <div className="payment-body">
            <WrapperLeft>
              {/* Delivery Address Info */}
              <WrapperInfo className="delivery-info">
                <div className="delivery-header">
                  <EnvironmentOutlined className="info-icon" />
                  <div className="delivery-text">
                    <span className="label">Giao đến</span>
                    <span className="value">
                      {user?.address || 'Chưa có'}, {user?.city || ''}
                    </span>
                  </div>
                  <span
                    className="change-address-link"
                    onClick={handleChangeAddress}
                  >
                    Thay đổi
                  </span>
                </div>
              </WrapperInfo>

              {/* Product List */}
              <WrapperInfo>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <ShoppingCartOutlined style={{ color: '#1a94ff', fontSize: '20px' }} />
                  <span style={{ fontWeight: 600, fontSize: '16px' }}>Sản phẩm</span>
                </div>
                <div>
                  {order?.orderItemsSelected?.map((item) => {
                    // Handle variations display
                    const selectedColor = item.variation
                      ? Array.isArray(item.variation.color)
                        ? item.variation.color[0]
                        : item.variation.color
                      : null
                    const selectedSize = item.variation
                      ? Array.isArray(item.variation.size)
                        ? item.variation.size[0]
                        : item.variation.size
                      : null
                    const selectedMaterial = item.variation
                      ? Array.isArray(item.variation.material)
                        ? item.variation.material[0]
                        : item.variation.material
                      : null

                    return (
                      <WrapperItemOrder key={item.product}>
                        <img src={item.image} alt={item.name} className="item-img" />
                        <div className="item-content">
                          <div className="item-name">{item.name}</div>
                          <div className="item-variation">
                            {selectedColor && <span>Màu: {String(selectedColor)}</span>}
                            {selectedSize && <span>Size: {String(selectedSize)}</span>}
                            {selectedMaterial && <span>Chất liệu: {String(selectedMaterial)}</span>}
                          </div>
                        </div>
                        <div className="item-price-qty">
                          <div className="item-price">{convertPrice(item.price)}</div>
                          <div className="item-qty">x{item.amount}</div>
                        </div>
                      </WrapperItemOrder>
                    )
                  })}
                </div>
              </WrapperInfo>

              {/* Shipping Method */}
              <WrapperShippingCard>
                <div className="shipping-title">
                  <TruckOutlined className="icon" />
                  Phương thức vận chuyển
                </div>
                <div className="shipping-options">
                  {isLoadingShippingRates ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      Đang tải phương thức vận chuyển...
                    </div>
                  ) : shippingRatesData?.status === 'OK' && shippingRatesData?.data?.length > 0 ? (
                    shippingRatesData.data.map((rate) => {
                      const isSelected = selectedShippingRate?._id === rate._id
                      return (
                        <div
                          key={rate._id}
                          className={`shipping-option-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectShippingRate(rate)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={`option-icon ${isSelected ? 'selected' : ''}`}>
                            <TruckOutlined />
                          </div>
                          <div className="option-content" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                                  {getShippingMethodLabel(rate)}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999' }}>
                                  {rate.isFree ? 'Miễn phí' : convertPrice(rate.shippingFee || 0)} • {getShippingEtaText(rate)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div className="option-price" style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? '#1a94ff' : '#333' }}>
                                  {rate.isFree ? 'Miễn phí' : convertPrice(rate.shippingFee || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                          {isSelected && <CheckOutlined className="check-icon" />}
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      Không tìm thấy phương thức vận chuyển phù hợp cho địa chỉ này
                    </div>
                  )}
                </div>
              </WrapperShippingCard>

              {/* Payment Method */}
              <WrapperInfo>
                <Lable>
                  <CreditCardOutlined className="label-icon" />
                  Chọn phương thức thanh toán
                </Lable>
                <WrapperRadio onChange={handlePayment} value={payment}>
                  <Radio value="later_money">Thanh toán tiền mặt khi nhận hàng</Radio>
                  <Radio value="paypal">Thanh toán bằng PayPal</Radio>
                  <Radio value="momo">Thanh toán bằng MoMo</Radio>
                </WrapperRadio>
              </WrapperInfo>
            </WrapperLeft>

            <WrapperRight>
              <WrapperTotal>
                <WrapperPriceInfo>
                  <div className="price-row">
                    <span>Tạm tính</span>
                    <span className="price-value">{convertPrice(priceMemo)}</span>
                  </div>
                  {priceDiscountMemo > 0 && (
                    <div className="price-row">
                      <span>Giảm giá</span>
                      <span className="price-value" style={{ color: '#52c41a' }}>
                        -{convertPrice(priceDiscountMemo)}
                      </span>
                    </div>
                  )}
                  <div className="price-row">
                    <span>
                      <TruckOutlined style={{ marginRight: 6 }} />
                      Phí vận chuyển
                    </span>
                    <span className="price-value">
                      {finalShippingPriceMemo === 0 ? (
                        <Tag color="green" style={{ margin: 0 }}>
                          Miễn phí
                        </Tag>
                      ) : (
                        <>
                          {freeshipDiscount > 0 && (
                            <span style={{
                              textDecoration: 'line-through',
                              color: '#999',
                              marginRight: '8px',
                              fontSize: '13px'
                            }}>
                              {convertPrice(diliveryPriceMemo)}
                            </span>
                          )}
                          <span>{convertPrice(finalShippingPriceMemo)}</span>
                        </>
                      )}
                    </span>
                  </div>
                  {freeshipDiscount > 0 && (
                    <div className="price-row" style={{ marginTop: '8px' }}>
                      <span style={{ color: '#52c41a', fontSize: '13px' }}>
                        <TruckOutlined style={{ marginRight: 6 }} />
                        Giảm phí vận chuyển
                      </span>
                      <span className="price-value" style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '13px' }}>
                        -{convertPrice(freeshipDiscount)}
                      </span>
                    </div>
                  )}

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
                                Freeship: {freeshipDiscount > 0 ? `Giảm ${convertPrice(freeshipDiscount)}` : 'Miễn phí ship'}
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
                                        <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '12px' }}>Đã dùng</span>
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
                                        <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '12px' }}>Đã dùng</span>
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
                  </ModalComponent>                   <div className="price-row" style={{ marginTop: '12px' }}>
                    <span style={{ color: '#52c41a' }}>
                      <GiftOutlined style={{ marginRight: 6 }} />
                      Giảm giá voucher
                    </span>
                    <span className="price-value" style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      -{convertPrice(voucherDiscount)}
                    </span>
                  </div>



                </WrapperPriceInfo>

                <WrapperTotalPrice>
                  <span className="total-label">Tổng tiền</span>
                  <div className="total-price-wrapper">
                    <span className="total-price-large">
                      {convertPrice(totalPriceMemo)}
                    </span>
                    <span className="total-note">(Đã bao gồm VAT)</span>
                  </div>
                </WrapperTotalPrice>
              </WrapperTotal>

              <WrapperButton>
                {payment === 'paypal' && sdkReady ? (
                  <PayPalScriptProvider options={{ "client-id": "AXLsj5MvqdYyJjlDP2D90yIBJn4vVbZU17xz_BwzbjP8G2_ajmNNUDwwJyLc7xa5gBcFY_Ow_fWOnQIX" }}>
                    <WrapperPayPal>
                      <PayPalButtons
                        createOrder={async (data, actions) => {
                          if (isPendingAddOrder || hasCompletedOrder) {
                            console.warn('❌ Order creation already in progress or completed')
                            return
                          }
                          try {
                            // Tạo đơn hàng ở backend trước
                            const res = await mutationAddOrder.mutateAsync({
                              token: user?.access_token,
                              orderItems: order?.orderItemsSelected,
                              fullName: user?.name,
                              address: user?.address,
                              phone: user?.phone,
                              city: user?.city,
                              province: user?.province,
                              district: user?.district,
                              ward: user?.ward,
                              paymentMethod: 'paypal',
                              itemsPrice: priceMemo,
                              shippingPrice: finalShippingPriceMemo,
                              totalPrice: totalPriceMemo,
                              voucherDiscount: voucherDiscount,
                              voucherCode: appliedVoucher?.code || order?.voucherCode || null,
                              promotionId: order?.promotionId || appliedVoucher?._id || null,
                              freeshipCode: appliedFreeshipCode?.code || order?.freeshipCode || null,
                              shippingVoucherId: order?.shippingVoucherId || appliedFreeshipCode?._id || null,
                              freeshipDiscount: freeshipDiscount || 0,
                              shippingMethod: order?.selectedShippingMethod?.shippingMethod || order?.selectedShippingMethod,
                              user: user?.id,
                              email: user?.email,
                              isPaid: false,
                              status: 'pending_payment'
                            });

                            if (res?.status === 'OK') {
                              setCreatedOrderId(res.data._id);
                              return actions.order.create({
                                purchase_units: [
                                  {
                                    amount: {
                                      value: (totalPriceMemo / 3000).toFixed(2) // Giả định tỷ giá
                                    }
                                  }
                                ]
                              });
                            } else {
                              message.error(res?.message || 'Không thể tạo đơn hàng');
                              return null;
                            }
                          } catch (err) {
                            message.error('Lỗi khi chuẩn bị thanh toán');
                            return null;
                          }
                        }}
                        onApprove={(data, actions) => {
                          return actions.order.capture().then((details) => {
                            onSuccessPaypal(details, data);
                          });
                        }}
                        onError={() => {
                          message.error('Có lỗi xảy ra khi thanh toán PayPal')
                        }}
                      />
                    </WrapperPayPal>
                  </PayPalScriptProvider>
                ) : (
                  <ButtonComponent
                    onClick={() => handledAddOrder()}
                    size="large"
                    loading={isPendingAddOrder || isMoMoLoading || isSubmittingOrder}
                    styleButton={{
                      background: (order?.orderItemsSelected?.length > 0 && !isPendingAddOrder && !isMoMoLoading && !isSubmittingOrder) ? '#1a94ff' : '#d9d9d9',
                      height: 52,
                      width: '100%',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 700,
                      cursor: (order?.orderItemsSelected?.length > 0 && !isPendingAddOrder && !isMoMoLoading && !isSubmittingOrder) ? 'pointer' : 'not-allowed'
                    }}
                    disabled={order?.orderItemsSelected?.length === 0 || isPendingAddOrder || isMoMoLoading || isSubmittingOrder}
                    textbutton={
                      <Space>
                        <ShoppingCartOutlined style={{ fontSize: 18 }} />
                        {(isPendingAddOrder || isMoMoLoading || isSubmittingOrder) ? 'Đang xử lý...' : `Đặt hàng (${order?.orderItemsSelected?.length || 0})`}
                      </Space>
                    }
                    styletextbutton={{
                      color: '#fff',
                      fontSize: 18,
                      fontWeight: 700
                    }}
                  />
                )}
              </WrapperButton>
            </WrapperRight>
          </div>
        </div>
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
      </Loading>
    </WrapperPaymentContainer>
  )
}

export default PaymentPage

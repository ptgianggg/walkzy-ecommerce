import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Page, HeaderRow, TitleBlock, Title, Subtitle, ActionsRow, CardGrid, QuickCard, TabWrap, TableShell, TableHeader, EmptyWrap } from './style'
import { Button, Form, Input, Space, Select, TreeSelect, DatePicker, InputNumber, Switch, Tag, Tabs, Card, Radio, Modal, Checkbox, Slider, Menu } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as PromotionService from '../../services/PromotionService'
import * as ProductService from '../../services/ProductService'
import * as CategoryService from '../../services/CategoryService'
import * as BrandService from '../../services/BrandService'
import * as ShippingVoucherService from '../../services/ShippingVoucherService'
import * as ShippingService from '../../services/ShippingService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import Loading from '../LoadingComponent/Loading'
import * as message from '../Message/Message'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'
import dayjs from 'dayjs'
import AdminShippingVoucher from '../AdminShippingVoucher/AdminShippingVoucher'

const { TextArea } = Input;
const { Option } = Select;

const AdminPromotion = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setisModalOpen] = useState(false);
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [promotionType, setPromotionType] = useState('percentage')
  const [activeTab, setActiveTab] = useState('all') // 'all', 'percentage', 'fixed', 'voucher_new_user', etc.
  const [activeSubMenu, setActiveSubMenu] = useState('products') // 'products' hoặc 'shipping_voucher'
  const [refreshKey, setRefreshKey] = useState(0) // Key để force re-render table
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productFilters, setProductFilters] = useState({
    category: null,
    brand: null,
    minPrice: null,
    maxPrice: null,
    isActive: null,
    search: ''
  })
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const user = useSelector((state) => state?.user)
  const searchInput = useRef(null);

  const initial = () => ({
    name: '',
    code: '',
    description: '',
    type: 'percentage',
    value: 0,
    minPurchase: 0,
    maxDiscount: null,
    startDate: null,
    endDate: null,
    isActive: true,
    products: [],
    categories: [],
    brands: [],
    applicableScope: null, // 'products', 'categories', 'brands'
    comboProducts: [],
    flashSaleStart: null,
    flashSaleEnd: null,
    flashSaleStock: null,
    usageLimit: null,
    userLimit: 1,
    isForNewUser: false,
    isShopWide: false
  })

  const [statePromotion, setStatePromotion] = useState(initial())
  const [statePromotionDetails, setStatePromotionDetails] = useState(initial())
  const [form] = Form.useForm();

  // Shipping Voucher states
  const [isShippingVoucherModalOpen, setIsShippingVoucherModalOpen] = useState(false);
  const [isShippingVoucherDrawerOpen, setIsShippingVoucherDrawerOpen] = useState(false);
  const [shippingVoucherRowSelected, setShippingVoucherRowSelected] = useState('')
  const shippingVoucherInitial = () => ({
    name: '',
    code: '',
    description: '',
    type: 'percentage', // 'percentage', 'fixed', 'free'
    value: 0,
    minPurchase: 0,
    maxDiscount: null,
    shippingProviders: [],
    startDate: null,
    endDate: null,
    usageLimit: null,
    userLimit: 1,
    isActive: true
  })
  const [stateShippingVoucher, setStateShippingVoucher] = useState(shippingVoucherInitial())
  const [stateShippingVoucherDetails, setStateShippingVoucherDetails] = useState(shippingVoucherInitial())
  const [formShippingVoucher] = Form.useForm();

  // Fetch data for selects
  const { data: productsData } = useQuery({
    queryKey: ['products', user?.access_token],
    queryFn: async () => {
      const res = await ProductService.getAllProduct('', 1000, user?.access_token); // Lấy nhiều sản phẩm hơn để filter
      return res;
    }
  });


  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    error: errorCategories,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      try {
        const res = await CategoryService.getCategoryTree();
        // Đảm bảo trả về đúng format
        if (res?.status === 'OK' && res?.data) {
          return res;
        }
        // Nếu format khác, xử lý lại
        if (Array.isArray(res)) {
          return { status: 'OK', data: { tree: res, flat: res } };
        }
        if (res?.data && Array.isArray(res.data)) {
          return { status: 'OK', data: { tree: res.data, flat: res.data } };
        }
        console.warn('Unexpected categories format:', res);
        return { status: 'OK', data: { tree: [], flat: [] } };
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    retry: 2, // Retry 2 times on failure
    retryDelay: 1000, // Wait 1 second between retries
  });

  const {
    data: brandsData,
    isLoading: isLoadingBrands,
    isError: isErrorBrands,
    error: errorBrands,
    refetch: refetchBrands
  } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        const res = await BrandService.getAllBrand();
        // Đảm bảo trả về đúng format
        if (res?.status === 'OK' && res?.data) {
          return res;
        }
        // Nếu format khác, xử lý lại
        if (Array.isArray(res)) {
          return { status: 'OK', data: res };
        }
        if (res?.data && Array.isArray(res.data)) {
          return res;
        }
        console.warn('Unexpected brands format:', res);
        return { status: 'OK', data: [] };
      } catch (error) {
        console.error('Error fetching brands:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    retry: 2, // Retry 2 times on failure
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Chuẩn hóa dữ liệu danh mục (tree + flat)
  const {
    flatCategories,
    categoryTreeOptions,
    categoryDescendantsMap
  } = useMemo(() => {
    const fallback = {
      flatCategories: [],
      categoryTreeOptions: [],
      categoryDescendantsMap: {}
    };

    if (!categoriesData) return fallback;

    let payload = categoriesData;
    if (categoriesData?.status === 'OK' && categoriesData?.data) {
      payload = categoriesData.data;
    }

    let treeSource = [];
    let flatSource = [];

    if (Array.isArray(payload?.tree)) {
      treeSource = payload.tree;
      flatSource = Array.isArray(payload.flat) ? payload.flat : [];
    } else if (Array.isArray(payload)) {
      flatSource = payload;
    } else if (Array.isArray(payload?.data)) {
      flatSource = payload.data;
    }

    const ensureArray = (value) => Array.isArray(value) ? value : [];

    const buildTreeFromFlatList = (items = []) => {
      const map = {};
      const roots = [];
      items.forEach(item => {
        const id = String(item?._id || item?.id || '');
        if (!id) return;
        map[id] = {
          ...item,
          _id: id,
          children: []
        };
      });
      Object.values(map).forEach(item => {
        const parentRaw = item.parentCategory?._id || item.parentCategory?.id || item.parentCategory;
        const parentId = parentRaw ? String(parentRaw) : null;
        if (parentId && map[parentId]) {
          map[parentId].children.push(item);
        } else {
          roots.push(item);
        }
      });
      const sortNodes = (nodes) => {
        nodes.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        nodes.forEach(child => sortNodes(child.children || []));
      };
      sortNodes(roots);
      return roots;
    };

    if (!treeSource.length && flatSource.length) {
      treeSource = buildTreeFromFlatList(flatSource);
    }

    if (!treeSource.length) {
      const normalizedFlat = ensureArray(flatSource).map(cat => ({
        ...cat,
        _id: String(cat?._id || cat?.id || '')
      })).filter(cat => cat._id);
      const simpleTree = normalizedFlat.map(cat => ({
        title: cat.name || 'Danh mục',
        value: cat._id,
        key: cat._id,
        disabled: cat.isActive === false,
        children: []
      }));
      return {
        flatCategories: normalizedFlat,
        categoryTreeOptions: simpleTree,
        categoryDescendantsMap: {}
      };
    }

    const normalizedFlat = [];
    const descendantsMap = {};

    const normalizeTree = (nodes, parentId = null) => {
      return ensureArray(nodes).map(node => {
        const id = String(node?._id || node?.id || '');
        if (!id) return null;
        const children = normalizeTree(node.children || [], id).filter(Boolean);
        const normalizedNode = {
          _id: id,
          name: node.name || 'Danh mục',
          slug: node.slug || '',
          image: node.image || null,
          isActive: node.isActive !== false,
          parentId,
          children
        };
        normalizedFlat.push({
          _id: id,
          name: normalizedNode.name,
          slug: normalizedNode.slug,
          image: normalizedNode.image,
          parentId,
          isActive: normalizedNode.isActive
        });
        return normalizedNode;
      }).filter(Boolean);
    };

    const normalizedTree = normalizeTree(treeSource);

    const collectDescendants = (node) => {
      const collected = [];
      node.children.forEach(child => {
        collected.push(child._id);
        collected.push(...collectDescendants(child));
      });
      descendantsMap[node._id] = collected;
      return collected;
    };
    normalizedTree.forEach(node => collectDescendants(node));

    const toTreeNodes = (nodes) => nodes.map(node => ({
      title: node.name || 'Danh mục',
      value: node._id,
      key: node._id,
      disabled: node.isActive === false,
      children: toTreeNodes(node.children || [])
    }));

    return {
      flatCategories: normalizedFlat,
      categoryTreeOptions: toTreeNodes(normalizedTree),
      categoryDescendantsMap: descendantsMap
    };
  }, [categoriesData]);

  // Filter products based on filters
  useEffect(() => {
    if (!productsData?.data) {
      setFilteredProducts([]);
      return;
    }

    const products = productsData.data?.data || productsData.data || [];
    let filtered = [...products];

    // Filter by search
    if (productFilters.search) {
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(productFilters.search.toLowerCase())
      );
    }

    // Filter by category (include descendants)
    if (productFilters.category) {
      const selectedId = String(productFilters.category);
      const descendantIds = categoryDescendantsMap[selectedId] || [];
      const acceptedIds = new Set([selectedId, ...descendantIds]);
      filtered = filtered.filter(p => {
        const productCategoryId = p?.category?._id?.toString() || p?.category?.toString() || '';
        return productCategoryId && acceptedIds.has(productCategoryId);
      });
    }

    // Filter by brand
    if (productFilters.brand) {
      filtered = filtered.filter(p =>
        p.brand?.toString() === productFilters.brand ||
        p.brand?._id?.toString() === productFilters.brand
      );
    }

    // Filter by price
    if (productFilters.minPrice !== null) {
      filtered = filtered.filter(p => (p.price || 0) >= productFilters.minPrice);
    }
    if (productFilters.maxPrice !== null) {
      filtered = filtered.filter(p => (p.price || 0) <= productFilters.maxPrice);
    }

    // Filter by status
    if (productFilters.isActive !== null) {
      filtered = filtered.filter(p => p.isActive === productFilters.isActive);
    }

    setFilteredProducts(filtered);
  }, [productsData, productFilters, categoryDescendantsMap]);

  const brands = useMemo(() => {
    if (!brandsData) return [];

    // Format 1: { status: 'OK', data: [...] }
    if (brandsData?.status === 'OK' && brandsData?.data) {
      const data = brandsData.data;
      if (Array.isArray(data)) {
        return data.filter(brand => brand && (brand._id || brand.id) && brand.name);
      }
    }

    // Format 2: Direct array
    if (Array.isArray(brandsData)) {
      return brandsData.filter(brand => brand && (brand._id || brand.id) && brand.name);
    }

    // Format 3: { data: [...] } without status
    if (brandsData?.data && Array.isArray(brandsData.data)) {
      return brandsData.data.filter(brand => brand && (brand._id || brand.id) && brand.name);
    }

    return [];
  }, [brandsData]);

  const mutation = useMutationHooks(
    (data) => PromotionService.createPromotion(data, user?.access_token)
  )

  const mutationUpdate = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data
      return PromotionService.updatePromotion(id, token, rests)
    },
  )

  const mutationDeleteted = useMutationHooks(
    (data) => {
      const { id, token } = data
      return PromotionService.deletePromotion(id, token)
    },
  )

  // Shipping Voucher mutations
  const mutationShippingVoucher = useMutationHooks(
    (data) => ShippingVoucherService.createShippingVoucher(data, user?.access_token)
  )

  const mutationUpdateShippingVoucher = useMutationHooks(
    (data) => {
      const { id, token, ...rests } = data
      return ShippingVoucherService.updateShippingVoucher(id, token, rests)
    },
  )

  const mutationDeleteShippingVoucher = useMutationHooks(
    (data) => {
      const { id, token } = data
      return ShippingVoucherService.deleteShippingVoucher(id, token)
    },
  )

  const { data: dataShippingVoucher, isPending: isPendingSV, isSuccess: isSuccessSV, isError: isErrorSV } = mutationShippingVoucher
  const { data: dataUpdatedSV, isPending: isPendingUpdatedSV, isSuccess: isSuccessUpdatedSV, isError: isErrorUpdatedSV } = mutationUpdateShippingVoucher
  const { data: dataDeletedSV, isPending: isPendingDeletedSV, isSuccess: isSuccessDeletedSV, isError: isErrorDeletedSV } = mutationDeleteShippingVoucher

  const getAllPromotions = async () => {
    try {
      const res = await PromotionService.getAllPromotion();
      // Đảm bảo trả về format đúng
      if (res?.status === 'OK' && res?.data) {
        return res;
      }
      // Nếu format khác, xử lý lại
      if (Array.isArray(res?.data)) {
        return {
          status: 'OK',
          message: 'SUCCESS',
          data: res.data
        };
      }
      if (Array.isArray(res)) {
        return {
          status: 'OK',
          message: 'SUCCESS',
          data: res
        };
      }
      // Trả về data rỗng nếu không có format đúng
      return {
        status: 'OK',
        message: 'SUCCESS',
        data: []
      };
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return {
        status: 'ERR',
        message: error.message || 'Lỗi khi lấy dữ liệu khuyến mãi',
        data: []
      };
    }
  }

  const fetchGetDetailsPromotion = async (rowSelected) => {
    const res = await PromotionService.getDetailsPromotion(rowSelected)
    if (res?.data) {
      const data = res.data

      // Determine applicable scope
      const applicableScope = data.products?.length > 0
        ? 'products'
        : data.categories?.length > 0
          ? 'categories'
          : data.brands?.length > 0
            ? 'brands'
            : null;

      // Prepare state data
      const stateData = {
        name: data.name || '',
        code: data.code || '',
        description: data.description || '',
        type: data.type || 'percentage',
        value: data.value || 0,
        minPurchase: data.minPurchase || 0,
        maxDiscount: data.maxDiscount || null,
        startDate: data.startDate ? dayjs(data.startDate) : null,
        endDate: data.endDate ? dayjs(data.endDate) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        products: data.products?.map(p => p._id || p) || [],
        categories: data.categories?.map(c => c._id || c) || [],
        brands: data.brands?.map(b => b._id || b) || [],
        applicableScope: applicableScope,
        comboProducts: data.comboProducts || [],
        flashSaleStart: data.flashSaleStart ? dayjs(data.flashSaleStart) : null,
        flashSaleEnd: data.flashSaleEnd ? dayjs(data.flashSaleEnd) : null,
        flashSaleStock: data.flashSaleStock || null,
        usageLimit: data.usageLimit || null,
        userLimit: data.userLimit || 1,
        isForNewUser: data.isForNewUser || false,
        isShopWide: data.isShopWide || false
      };

      // Update state
      setStatePromotionDetails(stateData);

      // Update form values
      form.setFieldsValue(stateData);

      // Update promotion type
      setPromotionType(data.type || 'percentage');
    }
    setIsPendingUpdate(false);
  }

  useEffect(() => {
    if (isModalOpen) {
      const init = initial();
      setStatePromotion(init);
      form.setFieldsValue(init);
    }
  }, [isModalOpen]);


  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      setIsPendingUpdate(true)
      fetchGetDetailsPromotion(rowSelected)
    }
  }, [rowSelected, isOpenDrawer])

  const handleDetailsPromotion = () => {
    setIsOpenDrawer(true)
  }

  const { data, isPending, isSuccess, isError } = mutation
  const { data: dataUpdated, isPending: isPendingUpdated, isSuccess: isSuccessUpdated, isError: isErrorUpdated } = mutationUpdate
  const { data: dataDeleted, isPending: isPendingDeleted, isSuccess: isSuccessDeleted, isError: isErrorDeleted } = mutationDeleteted

  const queryPromotion = useQuery({
    queryKey: ['promotions'],
    queryFn: getAllPromotions,
    refetchInterval: 10000, // Tự động refetch mỗi 10 giây để cập nhật số lượng voucher còn lại
    refetchIntervalInBackground: true, // Tiếp tục refetch ngay cả khi tab không active
    staleTime: 0, // Luôn coi data là stale để luôn refetch khi cần
    cacheTime: 5 * 60 * 1000 // Cache 5 phút
  });

  const { isPending: isPendingPromotion, data: promotions } = queryPromotion

  const renderAction = (_, record) => {
    return (
      <Space size="middle">
        <EditOutlined
          style={{ color: '#1890ff', fontSize: '20px', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            setRowSelected(record._id || record.id)
            handleDetailsPromotion()
          }}
        />
        <DeleteOutlined
          style={{ color: '#ff4d4f', fontSize: '20px', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            setRowSelected(record._id || record.id)
            setIsModalOpenDelete(true)
          }}
        />
      </Space>
    )
  }

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
        <Inputcomponent
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
  });

  const columns = [
    {
      title: 'Tên khuyến mãi',
      dataIndex: 'name',
      sorter: (a, b) => a.name?.length - b.name?.length,
      ...getColumnSearchProps('name')
    },
    {
      title: 'Mã',
      dataIndex: 'code',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      render: (type) => {
        const typeMap = {
          percentage: 'Giảm %',
          fixed: 'Giảm giá cố định',
          voucher_new_user: 'Voucher user mới',
          voucher_shop_wide: 'Voucher toàn shop',
          buy1get1: 'Mua 1 tặng 1',
          buy2discount: 'Mua 2 giảm',
          combo: 'Combo',
          flash_sale: 'Flash Sale'
        }
        return <Tag color="blue">{typeMap[type] || type}</Tag>
      }
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      render: (value, record) => {
        if (record.type === 'percentage') {
          return `${value}%`
        } else if (record.type === 'fixed') {
          return `${value.toLocaleString()} VNĐ`
        }
        return value
      }
    },
    {
      title: 'Đã dùng',
      dataIndex: 'usageCount',
      render: (_, record) => {
        const usageLimit = record.usageLimit
        const used = record.usageCount ?? 0

        if (usageLimit === null) {
          return <Tag color="blue">{used.toLocaleString()} lượt</Tag>
        }

        return (
          <Tag color="geekblue" style={{ fontWeight: 600 }}>
            {used.toLocaleString()} / {usageLimit.toLocaleString()}
          </Tag>
        )
      },
      sorter: (a, b) => (a.usageCount || 0) - (b.usageCount || 0)
    },
    {
      title: 'Còn lại',
      dataIndex: 'remaining',
      render: (_, record) => {
        const usageLimit = record.usageLimit
        const remaining = record.remaining
        const used = record.usageCount ?? 0

        if (usageLimit === null) {
          return <Tag color="default">Không giới hạn</Tag>
        }

        if (remaining <= 0 || Number.isNaN(remaining)) {
          return (
            <Tag color="red" style={{ fontWeight: 'bold' }}>
              Hết ({used.toLocaleString()}/{usageLimit.toLocaleString()})
            </Tag>
          )
        }

        const tone = remaining <= 10 ? 'orange' : 'green'
        return (
          <Tag color={tone} style={{ fontWeight: 'bold' }}>
            {remaining.toLocaleString()} / {usageLimit.toLocaleString()}
          </Tag>
        )
      },
      sorter: (a, b) => {
        const remA = a.remaining ?? Infinity
        const remB = b.remaining ?? Infinity
        return remA - remB
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (isActive) => isActive ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Tạm dừng</Tag>
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      render: renderAction
    },
  ];

  // Xử lý dữ liệu cho table - filter theo tab
  const dataTable = useMemo(() => {
    if (!promotions || !promotions.data) return [];
    let promotionsList = Array.isArray(promotions.data) ? promotions.data : [];

    // Filter theo tab
    if (activeTab !== 'all') {
      promotionsList = promotionsList.filter(promotion => promotion.type === activeTab);
    }

    // Đảm bảo usageCount và usageLimit là số
    return promotionsList.map((promotion) => {
      const usageLimitRaw = promotion.usageLimit ?? promotion.limit ?? promotion.maxUsage
      const usageLimitParsed = Number(usageLimitRaw)
      const usageLimit = Number.isFinite(usageLimitParsed) && usageLimitParsed >= 0 ? usageLimitParsed : null

      const usageCountRaw = promotion.usageCount ?? promotion.usedCount ?? 0
      const usageCountParsed = Number(usageCountRaw)
      const usageCount = Number.isFinite(usageCountParsed) && usageCountParsed >= 0 ? usageCountParsed : 0

      const remaining = usageLimit !== null ? Math.max(usageLimit - usageCount, 0) : null

      return {
        ...promotion,
        key: promotion._id || promotion.id,
        usageLimit,
        usageCount,
        remaining
      }
    });
  }, [promotions, activeTab, refreshKey]); // Thêm refreshKey vào dependency
  const totalPromotions = dataTable.length;
  const activePromotions = useMemo(() => dataTable.filter((p) => p.isActive).length, [dataTable]);

  useEffect(() => {
    if (isSuccess) {
      if (data?.status === 'OK') {
        message.success('Tạo khuyến mãi thành công!')
        handleCancel()
        queryPromotion.refetch()
      } else {
        message.error(data?.message || 'Tạo khuyến mãi thất bại!')
      }
    } else if (isError) {
      message.error('Lỗi khi kết nối đến máy chủ!')
    }
  }, [isSuccess, isError, data])

  useEffect(() => {
    if (isSuccessDeleted) {
      if (dataDeleted?.status === 'OK') {
        message.success('Xóa khuyến mãi thành công!')
        handleCancelDelete()
        queryPromotion.refetch()
      } else {
        message.error(dataDeleted?.message || 'Xóa khuyến mãi thất bại!')
      }
    } else if (isErrorDeleted) {
      message.error('Lỗi khi xóa khuyến mãi!')
    }
  }, [isSuccessDeleted, isErrorDeleted, dataDeleted])

  const handleCloseDrawer = () => {
    setIsOpenDrawer(false);
    setStatePromotionDetails(initial())
    setPromotionType('percentage')
    form.resetFields()
  };

  useEffect(() => {
    if (isSuccessUpdated) {
      if (dataUpdated?.status === 'OK') {
        message.success('Cập nhật khuyến mãi thành công!')
        handleCloseDrawer()
        queryPromotion.refetch()
      } else {
        message.error(dataUpdated?.message || 'Cập nhật khuyến mãi thất bại!')
      }
    } else if (isErrorUpdated) {
      message.error('Lỗi khi cập nhật khuyến mãi!')
    }
  }, [isSuccessUpdated, isErrorUpdated, dataUpdated])

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }

  const handleDeletePromotion = () => {
    mutationDeleteted.mutate({ id: rowSelected, token: user?.access_token }, {
      onSettled: () => {
        queryPromotion.refetch()
      }
    })
  }

  const handleCancel = () => {
    setisModalOpen(false);
    setStatePromotion(initial())
    setPromotionType('percentage')
    form.resetFields()
  };

  const onFinish = () => {
    // Xóa các trường không cần thiết dựa trên applicableScope
    const submitData = {
      ...statePromotion,
      startDate: statePromotion.startDate ? dayjs(statePromotion.startDate).toDate().toISOString() : null,
      endDate: statePromotion.endDate ? dayjs(statePromotion.endDate).toDate().toISOString() : null,
      flashSaleStart: statePromotion.flashSaleStart ? dayjs(statePromotion.flashSaleStart).toDate().toISOString() : null,
      flashSaleEnd: statePromotion.flashSaleEnd ? dayjs(statePromotion.flashSaleEnd).toDate().toISOString() : null,
    }

    // Xóa applicableScope (không gửi lên backend)
    delete submitData.applicableScope;

    // Xóa các trường không được chọn
    if (statePromotion.applicableScope !== 'products') {
      submitData.products = [];
    }
    if (statePromotion.applicableScope !== 'categories') {
      submitData.categories = [];
    }
    if (statePromotion.applicableScope !== 'brands') {
      submitData.brands = [];
    }

    // Xóa các trường không còn dùng
    delete submitData.applicableSizes;
    delete submitData.applicableColors;

    mutation.mutate(submitData, {
      onSettled: () => {
        queryPromotion.refetch()
      }
    })
  }

  const handleOnchange = (e) => {
    if (e.target) {
      setStatePromotion({
        ...statePromotion,
        [e.target.name]: e.target.value
      })
    } else {
      // Handle select changes
      setStatePromotion({
        ...statePromotion,
        [e.name]: e.value || e
      })
    }
  }

  const handleOnchangeDetails = (e) => {
    if (e.target) {
      setStatePromotionDetails({
        ...statePromotionDetails,
        [e.target.name]: e.target.value
      })
    } else {
      setStatePromotionDetails({
        ...statePromotionDetails,
        [e.name]: e.value || e
      })
    }
  }

  const onUpdatePromotion = () => {
    // Loại bỏ usageCount khỏi data update (được quản lý tự động bởi backend)
    const { usageCount, ...dataWithoutUsageCount } = statePromotionDetails;

    const submitData = {
      ...dataWithoutUsageCount,
      startDate: statePromotionDetails.startDate ? dayjs(statePromotionDetails.startDate).toDate().toISOString() : null,
      endDate: statePromotionDetails.endDate ? dayjs(statePromotionDetails.endDate).toDate().toISOString() : null,
      flashSaleStart: statePromotionDetails.flashSaleStart ? dayjs(statePromotionDetails.flashSaleStart).toDate().toISOString() : null,
      flashSaleEnd: statePromotionDetails.flashSaleEnd ? dayjs(statePromotionDetails.flashSaleEnd).toDate().toISOString() : null,
    }
    mutationUpdate.mutate({ id: rowSelected, token: user?.access_token, ...submitData }, {
      onSettled: () => {
        queryPromotion.refetch()
      }
    })
  }

  const renderPromotionForm = (isDetails = false) => {
    const state = isDetails ? statePromotionDetails : statePromotion
    const handleChange = isDetails ? handleOnchangeDetails : handleOnchange
    const setIsProductModalOpenFn = setIsProductModalOpen;
    // Chỉ cho phép mở modal khi tạo mới

    return (
      <>
        <Form.Item
          label="Tên khuyến mãi"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi!' }]}
        >
          <Inputcomponent
            value={state.name}
            onChange={handleChange}
            name="name"
          />
        </Form.Item>

        <Form.Item
          label="Mã voucher"
          name="code"
        >
          <Inputcomponent
            value={state.code}
            onChange={handleChange}
            name="code"
            placeholder="Để trống nếu không dùng mã"
          />
        </Form.Item>

        <Form.Item
          label="Loại khuyến mãi"
          name="type"
          rules={[{ required: true }]}
        >
          <Select
            value={state.type}
            onChange={(value) => {
              setPromotionType(value)
              handleChange({ name: 'type', value })
            }}
          >
            <Option value="percentage">Giảm theo %</Option>
            <Option value="fixed">Giảm giá cố định (VNĐ)</Option>
            <Option value="voucher_new_user">Voucher cho user mới</Option>
            <Option value="voucher_shop_wide">Voucher toàn shop</Option>
            <Option value="buy1get1">Mua 1 tặng 1</Option>
            <Option value="buy2discount">Mua 2 giảm giá</Option>
            <Option value="combo">Combo sản phẩm</Option>
            <Option value="flash_sale">Flash Sale</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={promotionType === 'percentage' ? 'Phần trăm giảm' : promotionType === 'fixed' ? 'Số tiền giảm (VNĐ)' : 'Giá trị'}
          name="value"
          rules={[{ required: true }]}
        >
          <InputNumber
            value={state.value}
            onChange={(value) => handleChange({ name: 'value', value })}
            style={{ width: '100%' }}
            min={0}
            max={promotionType === 'percentage' ? 100 : undefined}
          />
        </Form.Item>

        {(promotionType === 'percentage' || promotionType === 'fixed' || promotionType === 'voucher_new_user' || promotionType === 'voucher_shop_wide') && (
          <>
            <Form.Item
              label="Đơn hàng tối thiểu (VNĐ)"
              name="minPurchase"
            >
              <InputNumber
                value={state.minPurchase}
                onChange={(value) => handleChange({ name: 'minPurchase', value })}
                style={{ width: '100%' }}
                min={0}
                placeholder="Ví dụ: 300000 cho đơn từ 300K"
              />
            </Form.Item>

            {(promotionType === 'percentage' || promotionType === 'voucher_new_user' || promotionType === 'voucher_shop_wide') && (
              <Form.Item
                label="Giảm tối đa (VNĐ)"
                name="maxDiscount"
              >
                <InputNumber
                  value={state.maxDiscount}
                  onChange={(value) => handleChange({ name: 'maxDiscount', value })}
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
            )}
          </>
        )}

        {promotionType === 'voucher_new_user' && (
          <Form.Item
            label="Chỉ dành cho user mới"
            name="isForNewUser"
            valuePropName="checked"
          >
            <Switch
              checked={state.isForNewUser}
              onChange={(checked) => handleChange({ name: 'isForNewUser', value: checked })}
            />
          </Form.Item>
        )}

        {promotionType === 'voucher_shop_wide' && (
          <Form.Item
            label="Voucher toàn shop"
            name="isShopWide"
            valuePropName="checked"
            tooltip="Voucher này áp dụng cho tất cả sản phẩm, không giới hạn theo sản phẩm/danh mục/thương hiệu"
          >
            <Switch
              checked={state.isShopWide}
              onChange={(checked) => handleChange({ name: 'isShopWide', value: checked })}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Ngày bắt đầu"
          name="startDate"
          rules={[{ required: true }]}
        >
          <DatePicker
            value={state.startDate}
            onChange={(date) => handleChange({ name: 'startDate', value: date })}
            style={{ width: '100%' }}
            showTime
          />
        </Form.Item>

        <Form.Item
          label="Ngày kết thúc"
          name="endDate"
          rules={[{ required: true }]}
        >
          <DatePicker
            value={state.endDate}
            onChange={(date) => handleChange({ name: 'endDate', value: date })}
            style={{ width: '100%' }}
            showTime
          />
        </Form.Item>

        {promotionType === 'flash_sale' && (
          <>
            <Form.Item
              label="Flash Sale bắt đầu"
              name="flashSaleStart"
            >
              <DatePicker
                value={state.flashSaleStart}
                onChange={(date) => handleChange({ name: 'flashSaleStart', value: date })}
                style={{ width: '100%' }}
                showTime
              />
            </Form.Item>

            <Form.Item
              label="Flash Sale kết thúc"
              name="flashSaleEnd"
            >
              <DatePicker
                value={state.flashSaleEnd}
                onChange={(date) => handleChange({ name: 'flashSaleEnd', value: date })}
                style={{ width: '100%' }}
                showTime
              />
            </Form.Item>

            <Form.Item
              label="Số lượng flash sale"
              name="flashSaleStock"
            >
              <InputNumber
                value={state.flashSaleStock}
                onChange={(value) => handleChange({ name: 'flashSaleStock', value })}
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>
          </>
        )}

        {promotionType !== 'voucher_shop_wide' && (
          <>
            <Form.Item
              label="Phạm vi áp dụng"
              name="applicableScope"
              rules={[{ required: true, message: 'Vui lòng chọn phạm vi áp dụng!' }]}
            >
              <Radio.Group
                value={state.applicableScope || (state.products?.length > 0 ? 'products' : state.categories?.length > 0 ? 'categories' : state.brands?.length > 0 ? 'brands' : null)}
                onChange={(e) => {
                  const value = e.target.value;

                  // update form
                  form.setFieldsValue({
                    applicableScope: value,
                    products: [],
                    categories: [],
                    brands: []
                  });

                  // update the correct state depending on whether we're editing or creating
                  if (isDetails) {
                    setStatePromotionDetails(prev => ({
                      ...prev,
                      applicableScope: value,
                      products: [],
                      categories: [],
                      brands: []
                    }));
                  } else {
                    setStatePromotion(prev => ({
                      ...prev,
                      applicableScope: value,
                      products: [],
                      categories: [],
                      brands: []
                    }));
                  }

                  setSelectedProductIds([]);
                }}

              >
                <Radio value="products">Áp dụng cho sản phẩm</Radio>
                <Radio value="categories">Áp dụng cho danh mục</Radio>
                <Radio value="brands">Áp dụng cho thương hiệu</Radio>
              </Radio.Group>
            </Form.Item>

            {state.applicableScope === 'products' && (
              <Form.Item
                label="Chọn sản phẩm"
                name="products"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất một sản phẩm!' }]}
              >
                <div>
                  <Button
                    type="primary"
                    onClick={() => {
                      const currentProducts = isDetails ? statePromotionDetails.products : statePromotion.products;
                      setSelectedProductIds(currentProducts || []);
                      setIsProductModalOpen(true);
                    }}
                  >
                    Chọn sản phẩm {state.products?.length > 0 ? `(${state.products.length} sản phẩm)` : ''}
                  </Button>
                  {state.products?.length > 0 && (
                    <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                      Đã chọn {state.products.length} sản phẩm
                    </div>
                  )}
                </div>
              </Form.Item>
            )}

            {state.applicableScope === 'categories' && (
              <Form.Item
                label="Chọn danh mục"
                name="categories"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất một danh mục!' }]}
              >
                {isLoadingCategories ? (
                  <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>
                    <span>Đang tải danh mục...</span>
                  </div>
                ) : isErrorCategories ? (
                  <div style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>
                      Lỗi khi tải danh mục: {errorCategories?.message || 'Không thể tải dữ liệu'}
                    </div>
                    <Button size="small" onClick={() => refetchCategories()}>
                      Th? l?i
                    </Button>
                  </div>
                ) : flatCategories.length === 0 ? (
                  <div style={{ padding: '8px', textAlign: 'center', color: '#ff4d4f' }}>
                    Không có danh mục nào để chọn. Vui lòng tạo danh mục trước.
                  </div>
                ) : (
                  <>
                    <TreeSelect
                      key={`categories-tree-select-${state.applicableScope}-${flatCategories.length}`}
                      treeData={categoryTreeOptions}
                      value={state.categories || []}
                      onChange={(value) => {
                        const normalizedValue = Array.isArray(value) ? value : (value ? [value] : []);
                        handleChange({ name: 'categories', value: normalizedValue });
                        form.setFieldsValue({ categories: normalizedValue });
                      }}
                      placeholder="Chọn danh mục (có thể chọn nhiều)"
                      style={{ width: '100%' }}
                      showSearch
                      allowClear
                      treeCheckable
                      showCheckedStrategy={TreeSelect.SHOW_PARENT}
                      treeLine={{ showLeafIcon: false }}
                      treeDefaultExpandAll
                      filterTreeNode={(input, node) =>
                        String(node?.title || '').toLowerCase().includes(input.toLowerCase())
                      }
                      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    />
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                      Có {flatCategories.length} danh mục ?? ch?n {state.categories?.length > 0 && `? ?? ch?n: ${state.categories.length}`}
                    </div>
                  </>
                )}
              </Form.Item>
            )}
            {state.applicableScope === 'brands' && (
              <Form.Item
                label="Chọn thương hiệu"
                name="brands"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thương hiệu!' }]}
              >
                {isLoadingBrands ? (
                  <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>
                    <span>Đang tải thương hiệu...</span>
                  </div>
                ) : isErrorBrands ? (
                  <div style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>
                      Lỗi khi tải thương hiệu: {errorBrands?.message || 'Không thể tải dữ liệu'}
                    </div>
                    <Button size="small" onClick={() => refetchBrands()}>
                      Thử lại
                    </Button>
                  </div>
                ) : brands.length === 0 ? (
                  <div style={{ padding: '8px', textAlign: 'center', color: '#ff4d4f' }}>
                    Không có thương hiệu nào để chọn. Vui lòng tạo thương hiệu trước.
                  </div>
                ) : (
                  <>
                    <Select
                      key={`brands-select-${state.applicableScope}-${brands.length}`}
                      mode="multiple"
                      value={state.brands || []}
                      onChange={(value) => {
                        handleChange({ name: 'brands', value });
                        form.setFieldsValue({ brands: value });
                      }}
                      placeholder="Chọn thương hiệu (có thể chọn nhiều)"
                      style={{ width: '100%' }}
                      loading={isLoadingBrands}
                      notFoundContent="Không tìm thấy thương hiệu phù hợp"
                      showSearch
                      allowClear
                      filterOption={(input, option) => {
                        const label = option?.label || option?.children || '';
                        return String(label).toLowerCase().includes(input.toLowerCase());
                      }}
                      optionFilterProp="children"
                      maxTagCount="responsive"
                      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    >
                      {brands.map(brand => {
                        const brandId = brand._id || brand.id;
                        const brandName = brand.name || 'Không có tên';
                        return (
                          <Option key={brandId} value={brandId} label={brandName}>
                            {brandName}
                          </Option>
                        );
                      })}
                    </Select>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                      Có {brands.length} thương hiệu để chọn {state.brands?.length > 0 && `• Đã chọn: ${state.brands.length}`}
                    </div>
                  </>
                )}
              </Form.Item>
            )}
          </>
        )}

        <Form.Item
          label="Giới hạn sử dụng"
          name="usageLimit"
        >
          <InputNumber
            value={state.usageLimit}
            onChange={(value) => handleChange({ name: 'usageLimit', value })}
            style={{ width: '100%' }}
            min={1}
            placeholder="Số lần sử dụng tối đa"
          />
        </Form.Item>

        <Form.Item
          label="Mỗi user dùng tối đa"
          name="userLimit"
        >
          <InputNumber
            value={state.userLimit}
            onChange={(value) => handleChange({ name: 'userLimit', value })}
            style={{ width: '100%' }}
            min={1}
          />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
        >
          <TextArea
            value={state.description}
            onChange={handleChange}
            name="description"
            rows={4}
          />
        </Form.Item>

        <Form.Item
          label="Hoạt động"
          name="isActive"
          valuePropName="checked"
        >
          <Switch
            checked={state.isActive}
            onChange={(checked) => handleChange({ name: 'isActive', value: checked })}
          />
        </Form.Item>
      </>
    )
  }

  const tabItems = [
    {
      key: 'all',
      label: 'Tất cả',
      children: null
    },
    {
      key: 'percentage',
      label: 'Giảm %',
      children: null
    },
    {
      key: 'fixed',
      label: 'Giảm tiền',
      children: null
    },
    {
      key: 'voucher_new_user',
      label: 'Voucher user mới',
      children: null
    },
    {
      key: 'voucher_shop_wide',
      label: 'Voucher toàn shop',
      children: null
    },
    {
      key: 'shipping_voucher',
      label: 'Voucher vận chuyển',
      children: null
    },
    {
      key: 'buy1get1',
      label: 'Mua 1 tặng 1',
      children: null
    },
    {
      key: 'buy2discount',
      label: 'Mua 2 giảm',
      children: null
    },
    {
      key: 'combo',
      label: 'Combo',
      children: null
    },
    {
      key: 'flash_sale',
      label: 'Flash Sale',
      children: null
    }
  ];

  const menuItems = [
    {
      key: 'products',
      label: 'Sản phẩm',
    },
    {
      key: 'shipping_voucher',
      label: 'Voucher vận chuyển',
    }
  ]

  return (
    <Page>
      <HeaderRow>
        <TitleBlock>
          <Title>Quản lý khuyến mãi</Title>

          <Space size="small" wrap style={{ marginTop: 6 }}>

          </Space>
        </TitleBlock>
        <ActionsRow>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['promotions'] })
              queryPromotion.refetch()
              setRefreshKey((prev) => prev + 1)
            }}
            loading={isPendingPromotion}
          >

          </Button>
        </ActionsRow>
      </HeaderRow>

      <TabWrap>
        <Menu
          mode="horizontal"
          selectedKeys={[activeSubMenu]}
          items={menuItems}
          onClick={({ key }) => {
            setActiveSubMenu(key)
            if (key === 'products') {
              setActiveTab('all')
            }
          }}
          style={{ borderBottom: '1px solid #f0f0f0' }}
        />
      </TabWrap>

      {activeSubMenu === 'products' ? (
        <>
          <CardGrid>
            <QuickCard
              onClick={() => {
                setPromotionType(activeTab === 'all' ? 'percentage' : activeTab)
                setisModalOpen(true)
              }}
              style={{ display: 'grid', placeItems: 'center', minHeight: 160, gap: 8 }}
            >
              <div className="icon-pill">
                <PlusOutlined />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Tạo khuyến mãi</div>
            </QuickCard>
          </CardGrid>

          <TabWrap>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems.filter((item) => item.key !== 'shipping_voucher')}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['promotions'] })
                  queryPromotion.refetch()
                  setRefreshKey((prev) => prev + 1)
                }}
                loading={isPendingPromotion}
              >
                Làm mới
              </Button>
            </div>
          </TabWrap>

          <TableShell>
            <TableHeader>
              <div>
                <div className="title">Danh sách khuyến mãi</div>

              </div>
            </TableHeader>
            <Loading isPending={isPendingPromotion}>
              {dataTable && dataTable.length > 0 ? (
                <TableComponent
                  key={refreshKey} // Force re-render khi refresh
                  columns={columns}
                  isPending={false}
                  data={dataTable}
                  onRow={(record) => {
                    return {
                      onClick: () => {
                        setRowSelected(record._id || record.id)
                      },
                      onDoubleClick: () => {
                        setRowSelected(record._id || record.id)
                        handleDetailsPromotion()
                      }
                    };
                  }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `${total} khuyến mãi`
                  }}
                />
              ) : (
                <EmptyWrap>
                  {isPendingPromotion
                    ? 'Đang tải dữ liệu...'
                    : `Chưa có khuyến mãi loại "${tabItems.find((t) => t.key === activeTab)?.label || 'này'}". Tạo mới để bắt đầu.`}
                </EmptyWrap>
              )}
            </Loading>
          </TableShell>
        </>
      ) : (
        <AdminShippingVoucher />
      )}
      <ModalComponent
        forceRender
        title="Tạo khuyến mãi"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Loading isPending={isPending}>
          <Form
            name="basic"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
            autoComplete="on"
            form={form}
          >
            {renderPromotionForm(false)}
            <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Tạo
              </Button>
            </Form.Item>
          </Form>
        </Loading>
      </ModalComponent>

      <DrawerComponent
        title='Chi tiết khuyến mãi'
        isOpen={isOpenDrawer}
        onClose={() => setIsOpenDrawer(false)}
        width="90%"
      >
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            name="basic"
            labelCol={{ span: 2 }}
            wrapperCol={{ span: 22 }}
            onFinish={onUpdatePromotion}
            autoComplete="on"
            form={form}
          >
            {renderPromotionForm(true)}
            <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        </Loading>
      </DrawerComponent>

      <ModalComponent
        title="Xóa khuyến mãi"
        open={isModalOpenDelete}
        onCancel={handleCancelDelete}
        onOk={handleDeletePromotion}
      >
        <Loading isPending={isPendingDeleted}>
          <div>Bạn có chắc muốn xóa khuyến mãi này không?</div>
        </Loading>
      </ModalComponent>

      {/* Modal chọn sản phẩm với bộ lọc */}
      <Modal
        title="Chọn sản phẩm"
        open={isProductModalOpen}
        onOk={() => {
          const isDetails = isOpenDrawer;

          if (isDetails) {
            handleOnchangeDetails({ name: 'products', value: selectedProductIds });
          } else {
            handleOnchange({ name: 'products', value: selectedProductIds });
          }

          // 👉 FIX QUAN TRỌNG
          form.setFieldsValue({ products: selectedProductIds });

          setIsProductModalOpen(false);
        }}


        onCancel={() => {
          setIsProductModalOpen(false);
          // Reset v? gi? tr? ban ??u khi h?y
          const isDetails = isOpenDrawer;
          const currentProducts = isDetails
            ? (statePromotionDetails.applicableScope === 'products' ? (statePromotionDetails.products || []) : [])
            : (statePromotion.applicableScope === 'products' ? (statePromotion.products || []) : []);
          setSelectedProductIds(currentProducts);
        }}>
        <div style={{
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Bộ lọc sản phẩm</div>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Tìm kiếm */}
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={productFilters.search}
              onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
              allowClear
            />

            <Space wrap>
              {/* Lọc theo danh mục */}
              <TreeSelect
                placeholder="Lọc theo danh mục"
                value={productFilters.category || undefined}
                onChange={(value) => setProductFilters({ ...productFilters, category: value || null })}
                allowClear
                style={{ width: 220 }}
                showSearch
                treeLine={{ showLeafIcon: false }}
                treeDefaultExpandAll
                treeData={categoryTreeOptions}
                filterTreeNode={(input, node) =>
                  String(node?.title || '').toLowerCase().includes(input.toLowerCase())
                }
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              />

              {/* Lọc theo thương hiệu */}
              <Select
                placeholder="Lọc theo thương hiệu"
                value={productFilters.brand}
                onChange={(value) => setProductFilters({ ...productFilters, brand: value })}
                allowClear
                style={{ width: 200 }}
                showSearch
                filterOption={(input, option) =>
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {brands.map(brand => (
                  <Option key={brand._id} value={brand._id}>{brand.name}</Option>
                ))}
              </Select>

              {/* Lọc theo giá */}
              <div style={{ width: 300 }}>
                <div style={{ marginBottom: '8px', fontSize: '12px' }}>Giá: {productFilters.minPrice || 0} - {productFilters.maxPrice || '∞'} VNĐ</div>
                <Space>
                  <InputNumber
                    placeholder="Từ"
                    value={productFilters.minPrice}
                    onChange={(value) => setProductFilters({ ...productFilters, minPrice: value })}
                    min={0}
                    style={{ width: 120 }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                  <span>-</span>
                  <InputNumber
                    placeholder="Đến"
                    value={productFilters.maxPrice}
                    onChange={(value) => setProductFilters({ ...productFilters, maxPrice: value })}
                    min={0}
                    style={{ width: 120 }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Space>
              </div>

              {/* Lọc theo trạng thái */}
              <Select
                placeholder="Trạng thái"
                value={productFilters.isActive}
                onChange={(value) => setProductFilters({ ...productFilters, isActive: value })}
                allowClear
                style={{ width: 150 }}
              >
                <Option value={true}>Đang hoạt động</Option>
                <Option value={false}>Tạm dừng</Option>
              </Select>

              <Button onClick={() => {
                setProductFilters({
                  category: null,
                  brand: null,
                  minPrice: null,
                  maxPrice: null,
                  isActive: null,
                  search: ''
                });
              }}>
                Xóa bộ lọc
              </Button>
            </Space>
          </Space>
        </div>

        {/* Danh sách sản phẩm */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          padding: '12px'
        }}>
          <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
            Đã chọn: {selectedProductIds.length} sản phẩm / {filteredProducts.length} sản phẩm hiển thị
          </div>
          <Checkbox.Group
            value={selectedProductIds}
            onChange={(checkedValues) => setSelectedProductIds(checkedValues)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {filteredProducts.map(product => (
                <Checkbox key={product._id} value={product._id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: '500' }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {product.price?.toLocaleString()} VNĐ
                        {product.category && ` • ${(typeof product.category === 'object' ? product.category.name : 'N/A')}`}
                        {product.brand && ` • ${(typeof product.brand === 'object' ? product.brand.name : 'N/A')}`}
                      </div>
                    </div>
                  </div>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              Không tìm thấy sản phẩm nào
            </div>
          )}
        </div>
      </Modal>
    </Page>
  )
}

export default AdminPromotion

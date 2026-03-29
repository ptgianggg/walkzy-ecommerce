import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  DatePicker,
  Typography
} from 'antd'
import {
  AppstoreOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  RedoOutlined,
  SearchOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import TableComponent from '../TableComponent/TableComponent'
import Inputcomponent from '../Inputcomponent/Inputcomponent'
import * as ProductService from '../../services/ProductService'
import * as CategoryService from '../../services/CategoryService'
import * as BrandService from '../../services/BrandService'
import * as CollectionService from '../../services/CollectionService'
import * as AttributeService from '../../services/AttributeService'
import { useMutationHooks } from '../../hooks/useMutationHook'
import { getBase64, renderOptions } from '../../utils'
import {
  ActionsGroup,
  FiltersBar,
  HeaderMeta,
  HeaderRow,
  PageWrapper,
  StatCard,
  StatLabel,
  StatTrend,
  StatValue,
  StatsGrid,
  TableCard,
  TableHeader,
  TableSubtitle,
  TableTitle,
  WrapperHeader,
  WrapperUploadFile
} from './style'
import Loading from '../../components/LoadingComponent/Loading'
import * as message from '../../components/Message/Message'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DrawerComponent from '../DrawerComponent/DrawerComponent'
import { useSelector } from 'react-redux'
import ModalComponent from '../ModalComponent/ModalComponent'
import VariationsMatrix from './VariationsMatrix'

const { TextArea } = Input;
const { Option } = Select;

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return value._id || value.id || '';
  }
  return String(value);
};

const normalizeActive = (value) => value === true || value === 'true' || value === 1 || value === '1';

const AdminProduct = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setisModalOpen] = useState(false);
  const [rowSelected, setRowSelected] = useState('')
  const [isOpenDrawer, setIsOpenDrawer] = useState(false)
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const user = useSelector((state) => state?.user)
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [quickSearch, setQuickSearch] = useState('');
  const searchInput = useRef(null);
  const initial = () => ({
    name: '',
    originalPrice: '',
    price: '',
    description: '',
    shortDescription: '',
    metaDescription: '',
    metaTitle: '',
    images: [],
    image: '',
    type: 'product', // Thêm type mặc định
    category: '',
    parentCategory: '',
    brand: '',
    collections: [],
    countInStock: 0,
    discount: 0,
    hasVariations: false,
    variations: [],
    selectedColors: [],
    selectedSizes: [],
    selectedMaterials: [],
    baseSKU: '',
    isActive: true,
    isManualDiscount: false, // Flag để track xem user có nhập discount thủ công không
    saleStartDate: null,
    saleEndDate: null,
    weight: 0,
    length: 0,
    width: 0,
    height: 0
  })
  const [stateProduct, setStateProduct] = useState(initial())
  const [stateProductDetails, setStateProductDetails] = useState(initial())
  const [form] = Form.useForm();

  const mutation = useMutationHooks(
    (data) => {
      const res = ProductService.createProduct(data)
      return res
    }
  )
  const mutationUpdate = useMutationHooks(
    (data) => {
      const { id,
        token,
        ...rests } = data
      const res = ProductService.updateProduct(
        id,
        token,
        { ...rests })
      return res
    },
  )
  const mutationDeleteted = useMutationHooks(
    (data) => {
      const { id,
        token,
      } = data
      const res = ProductService.deleteProduct(
        id,
        token)
      return res
    },
  )
  const mutationDeletetedMany = useMutationHooks(
    (data) => {
      const { ids, token } = data
      const res = ProductService.deleteManyProduct(
        { ids },
        token)
      return res
    },
  )


  const getAllProducts = async () => {
    const res = await ProductService.getAllProduct(
      { includeInactive: true },
      user?.access_token
    );
    return res;
  };


  const fetchGetDetailsProduct = async (rowSelected) => {
    const res = await ProductService.getDetailsProduct(rowSelected)
    if (res?.data) {
      const data = res.data
      setStateProductDetails({
        name: data.name,
        originalPrice: data.originalPrice || data.price,
        price: data.price,
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        metaDescription: data.metaDescription || '',
        metaTitle: data.metaTitle || data.name || '',
        images: data.images || (data.image ? [data.image] : []),
        image: data.image || (data.images?.[0] || ''),
        type: data.type || 'product',
        category: data.category?._id || '',
        parentCategory: data.category?.parentCategory?._id || data.category?.parentCategory || '',
        brand: data.brand?._id || '',
        collections: data.collections?.map(c => c._id || c) || [],
        countInStock: data.countInStock || 0,
        discount: data.discount || 0,
        hasVariations: data.hasVariations || false,
        variations: data.variations || [],
        selectedColors: data.variations?.map(v => ({ value: v.color })).filter((v, i, arr) => v.value && arr.findIndex(x => x.value === v.value) === i) || [],
        selectedSizes: data.variations?.map(v => ({ value: v.size })).filter((v, i, arr) => v.value && arr.findIndex(x => x.value === v.value) === i) || [],
        selectedMaterials: data.variations?.map(v => ({ value: v.material })).filter((v, i, arr) => v.value && arr.findIndex(x => x.value === v.value) === i) || [],
        baseSKU: data.baseSKU || '',
        isActive: data.isActive !== undefined ? normalizeActive(data.isActive) : true,
        saleStartDate: data.saleStartDate ? dayjs(data.saleStartDate) : null,
        saleEndDate: data.saleEndDate ? dayjs(data.saleEndDate) : null,
        weight: data.weight || 0,
        length: data.length || 0,
        width: data.width || 0,
        height: data.height || 0
      })
    }
    setIsPendingUpdate(false)
  }

  useEffect(() => {
    if (!isModalOpen) {
      form.setFieldsValue(stateProductDetails);
    } else {
      form.setFieldsValue(initial());
    }
  }, [form, stateProductDetails, isModalOpen]);




  useEffect(() => {
    if (rowSelected && isOpenDrawer) {
      setIsPendingUpdate(true)
      fetchGetDetailsProduct(rowSelected)
    }
  }, [rowSelected, isOpenDrawer])

  const handleDetailsProduct = () => {
    setIsOpenDrawer(true)
  }

  const handleDeleteManyProducts = (ids) => {
    mutationDeletetedMany.mutate({ ids: ids, token: user?.access_token }, {
      onSettled: () => {
        refetchProducts()
      }
    })
  }



  const { data, isPending, isSuccess, isError } = mutation
  const { data: dataUpdated, isPending: isPendingUpdated, isSuccess: isSuccessUpdated, isError: isErrorUpdated } = mutationUpdate
  const { data: dataDeleted, isPending: isPendingDeleted, isSuccess: isSuccessDeleted, isError: isErrorDeleted } = mutationDeleteted
  const { data: dataDeletedMany, isPending: isPendingDeletedMany, isSuccess: isSuccessDeletedMany, isError: isErrorDeletedMany } = mutationDeletetedMany



  const queryProduct = useQuery({
    queryKey: ['products', user?.access_token],
    queryFn: getAllProducts
  });
  const { isPending: isPendingProduct, data: products, dataUpdatedAt, refetch: refetchProducts } = queryProduct;

  // Thêm queries cho Category, Brand, Collection, Attributes
  // Đảm bảo luôn enabled và có staleTime để cache data
  const { data: categoriesData, isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoryService.getAllCategory(),
    enabled: true, // Luôn enabled
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    cacheTime: 10 * 60 * 1000, // Giữ cache 10 phút
    refetchOnMount: 'always', // Luôn refetch khi mount
    retry: 2, // Retry 2 lần nếu fail
    retryDelay: 1000 // Delay 1s giữa các lần retry
  });

  const { data: parentsData, isLoading: isLoadingParents, refetch: refetchParents } = useQuery({
    queryKey: ['parent-categories'],
    queryFn: () => CategoryService.getParentCategories(),
    staleTime: 5 * 60 * 1000
  });

  const { data: brandsData, isLoading: isLoadingBrands, refetch: refetchBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => BrandService.getAllBrand(),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    retry: 2,
    retryDelay: 1000
  });

  const { data: collectionsData, isLoading: isLoadingCollections, refetch: refetchCollections } = useQuery({
    queryKey: ['collections'],
    queryFn: () => CollectionService.getAllCollection(),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    retry: 2,
    retryDelay: 1000
  });

  const parentCategoryOptions = useMemo(() => {
    const parentList = Array.isArray(parentsData?.data) ? parentsData.data : [];
    const fallbackParents = Array.isArray(categoriesData?.data)
      ? categoriesData.data.filter((cat) => !normalizeId(cat.parentCategory))
      : [];
    const raw = parentList.length > 0 ? parentList : fallbackParents;
    return raw
      .map((cat) => ({
        _id: normalizeId(cat),
        name: cat?.name || 'Danh mục'
      }))
      .filter((cat) => !!cat._id)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [parentsData, categoriesData]);

  const childCategoriesMap = useMemo(() => {
    const map = {};
    const list = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
    list.forEach((cat) => {
      const parentId = normalizeId(cat?.parentCategory);
      const catId = normalizeId(cat);
      if (!parentId || !catId) return;
      if (!map[parentId]) {
        map[parentId] = [];
      }
      map[parentId].push({
        _id: catId,
        name: cat?.name || 'Danh mục'
      });
    });
    Object.values(map).forEach((children) => {
      children.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });
    return map;
  }, [categoriesData]);

  const availableChildCategoriesCreate = stateProduct.parentCategory
    ? (childCategoriesMap[stateProduct.parentCategory] || [])
    : [];

  const availableChildCategoriesDetails = stateProductDetails.parentCategory
    ? (childCategoriesMap[stateProductDetails.parentCategory] || [])
    : [];
  const collectAttributesForSelection = async (type, primaryCategoryId, fallbackCategoryId) => {
    const seen = new Map();
    const idsToFetch = [];
    if (primaryCategoryId) idsToFetch.push(primaryCategoryId);
    if (fallbackCategoryId && fallbackCategoryId !== primaryCategoryId) idsToFetch.push(fallbackCategoryId);
    if (!idsToFetch.length) idsToFetch.push(null);

    const responses = await Promise.all(
      idsToFetch.map((categoryId) => AttributeService.getAllAttribute(type, categoryId))
    );

    responses.forEach((res) => {
      (res?.data || []).forEach((attr) => {
        const key = attr?._id || attr?.id || attr?.value;
        if (key && !seen.has(key)) {
          seen.set(key, attr);
        }
      });
    });

    return { data: Array.from(seen.values()) };
  };

  useEffect(() => {
    if (!stateProduct.category || stateProduct.parentCategory) return;
    const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
    const current = categories.find((cat) => normalizeId(cat) === normalizeId(stateProduct.category));
    if (!current?.parentCategory) return;
    const derivedParent = normalizeId(current.parentCategory);
    if (derivedParent && derivedParent !== stateProduct.parentCategory) {
      setStateProduct((prev) => ({
        ...prev,
        parentCategory: derivedParent
      }));
    }
  }, [stateProduct.category, stateProduct.parentCategory, categoriesData]);

  useEffect(() => {
    if (!stateProductDetails.category || stateProductDetails.parentCategory) return;
    const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];
    const current = categories.find((cat) => normalizeId(cat) === normalizeId(stateProductDetails.category));
    if (!current?.parentCategory) return;
    const derivedParent = normalizeId(current.parentCategory);
    if (derivedParent && derivedParent !== stateProductDetails.parentCategory) {
      setStateProductDetails((prev) => ({
        ...prev,
        parentCategory: derivedParent
      }));
    }
  }, [stateProductDetails.category, stateProductDetails.parentCategory, categoriesData]);

  // Query attributes với filter theo category
  // Lấy cả attributes có category và không có category (null)
  const { data: colorsData, refetch: refetchColors } = useQuery({
    queryKey: ['colors', stateProduct.category, stateProduct.parentCategory],
    queryFn: () => collectAttributesForSelection('color', stateProduct.category, stateProduct.parentCategory),
    enabled: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  const { data: sizesData, refetch: refetchSizes } = useQuery({
    queryKey: ['sizes', stateProduct.category, stateProduct.parentCategory],
    queryFn: () => collectAttributesForSelection('size', stateProduct.category, stateProduct.parentCategory),
    enabled: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  const { data: materialsData, refetch: refetchMaterials } = useQuery({
    queryKey: ['materials', stateProduct.category, stateProduct.parentCategory],
    queryFn: () => collectAttributesForSelection('material', stateProduct.category, stateProduct.parentCategory),
    enabled: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  // Query attributes v?i filter theo category cho form update
  const { data: colorsDataDetails, refetch: refetchColorsDetails } = useQuery({
    queryKey: ['colors-details', stateProductDetails.category, stateProductDetails.parentCategory],
    queryFn: () => collectAttributesForSelection('color', stateProductDetails.category, stateProductDetails.parentCategory),
    enabled: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  const { data: sizesDataDetails, refetch: refetchSizesDetails } = useQuery({
    queryKey: ['sizes-details', stateProductDetails.category, stateProductDetails.parentCategory],
    queryFn: () => collectAttributesForSelection('size', stateProductDetails.category, stateProductDetails.parentCategory),
    enabled: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });

  const { data: materialsDataDetails, refetch: refetchMaterialsDetails } = useQuery({
    queryKey: ['materials-details', stateProductDetails.category, stateProductDetails.parentCategory],
    queryFn: () => collectAttributesForSelection('material', stateProductDetails.category, stateProductDetails.parentCategory),
    enabled: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });
  const productList = products?.data || [];
  const getTotalStock = (product = {}) => {
    const baseStock = Number(product?.countInStock || 0);
    const variationsStock = Array.isArray(product?.variations)
      ? product.variations.reduce((sum, variation) => sum + (Number(variation?.stock) || 0), 0)
      : 0;
    return baseStock + variationsStock;
  };

  const renderAction = () => {
    return (
      <Space size="middle">
        <Tooltip title="Xem & Chỉnh sửa">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#2563eb' }} />}
            onClick={handleDetailsProduct}
            style={{
              borderRadius: '8px',
              background: '#eff6ff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
          />
        </Tooltip>
        <Tooltip title="Xóa sản phẩm">
          <Button
            type="text"
            icon={<DeleteOutlined style={{ color: '#ef4444' }} />}
            onClick={() => setIsModalOpenDelete(true)}
            style={{
              borderRadius: '8px',
              background: '#fef2f2',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
          />
        </Tooltip>
      </Space>
    )
  }
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    //setSearchText(selectedKeys[0]);
    //setSearchedColumn(dataIndex);
  };
  const handleReset = clearFilters => {
    clearFilters();
    //setSearchText('');
  };
  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
        <Inputcomponent
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
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
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    // render: text =>
    //   searchedColumn === dataIndex ? (
    //     // <Highlighter
    //     //   highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
    //     //   searchWords={[searchText]}
    //     //   autoEscape
    //     //   textToHighlight={text ? text.toString() : ''}
    //     // />
    //   ) : (
    //     text
    //   ),
  });
  const columns = [
    {
      title: 'Ảnh sản phẩm',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image, record) => (
        <Image
          src={image || record.images?.[0] || ''}
          alt={record.name}
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
        />
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      sorter: (a, b) => a.name?.localeCompare(b.name),
      ...getColumnSearchProps('name'),
      render: (name, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Tooltip title={name} placement="topLeft">
            <Typography.Text
              strong
              style={{
                fontSize: '14px',
                color: '#1e293b',
                width: '100%',
                lineHeight: '1.4',
                marginBottom: '2px'
              }}
              ellipsis={{ rows: 2, tooltip: false }}
            >
              {name}
            </Typography.Text>
          </Tooltip>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
              #{record._id?.slice(-6).toUpperCase()}
            </span>
            {record.type && (
              <Tag color="default" style={{ fontSize: '10px', margin: 0, padding: '0 4px', borderRadius: '4px', height: '18px', lineHeight: '16px', background: '#f1f5f9', border: 'none' }}>
                {record.type.toUpperCase()}
              </Tag>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => category?.name || 'N/A',
      filters: categoriesData?.data?.map(cat => ({ text: cat.name, value: cat._id })),
      onFilter: (value, record) => record.category?._id === value,
    },
    {
      title: 'Thương hiệu',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
      render: (brand) => brand?.name || 'N/A',
      filters: brandsData?.data?.map(brand => ({ text: brand.name, value: brand._id })),
      onFilter: (value, record) => record.brand?._id === value,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'countInStock',
      key: 'countInStock',
      width: 100,
      sorter: (a, b) => getTotalStock(a) - getTotalStock(b),
      render: (_, record) => {
        const totalStock = getTotalStock(record);
        const variationStock = Array.isArray(record?.variations)
          ? record.variations.reduce((sum, variation) => sum + (Number(variation?.stock) || 0), 0)
          : 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Tag color={totalStock > 0 ? 'green' : 'red'}>
              {totalStock}
            </Tag>
            {variationStock > 0 && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                +{variationStock} từ biến thể
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Đã bán',
      dataIndex: 'selled',
      key: 'selled',
      width: 100,
      sorter: (a, b) => (a.selled || 0) - (b.selled || 0),
      render: (selled) => (
        <Tag color="blue">
          {selled || 0}
        </Tag>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      sorter: (a, b) => (a.views || 0) - (b.views || 0),
      render: (views) => (
        <Tag color="purple">
          {views || 0}
        </Tag>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: (a, b) => (a.price || 0) - (b.price || 0),
      render: (price) => {
        const formattedPrice = new Intl.NumberFormat('vi-VN').format(price || 0);
        return (
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
            {formattedPrice} <small style={{ color: '#64748b', fontWeight: 500 }}>đ</small>
          </span>
        );
      },
    },
    {
      title: 'Vận chuyển',
      dataIndex: 'shipping',
      key: 'shipping',
      width: 140,
      render: (_, record) => (
        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Cân nặng:</span>
            <span>{record.weight || 0}g</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Kích thước:</span>
            <span>{record.length || 0}x{record.width || 0}x{record.height || 0}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Tạm dừng', value: false },
      ],
      onFilter: (value, record) => normalizeActive(record.isActive) === value,
      render: (isActive) => {
        const active = normalizeActive(isActive);
        return (
          <Tag
            icon={active ? <CheckCircleOutlined /> : <PauseCircleOutlined />}
            color={active ? 'success' : 'warning'}
            style={{
              borderRadius: '6px',
              padding: '2px 8px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {active ? 'Đang bán' : 'Tạm dừng'}
          </Tag>
        )
      },
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: renderAction
    },
  ];
  const dataTable = useMemo(() => {
    return productList.map((product) => {
      const totalStock = getTotalStock(product);
      return {
        ...product,
        key: product._id,
        category: product.category || null,
        brand: product.brand || null,
        countInStock: product.countInStock || 0,
        selled: product.selled || 0,
        views: product.views || 0,
        baseSKU: product.baseSKU || '',
        isActive: product.isActive !== undefined ? normalizeActive(product.isActive) : true,
        totalStock,
      }
    })
  }, [productList]);

  const stats = useMemo(() => {
    const total = dataTable.length;
    const active = dataTable.filter((item) => normalizeActive(item.isActive)).length;
    const inactive = total - active;
    const outOfStock = dataTable.filter((item) => (item.totalStock || 0) <= 0).length;
    const lowStock = dataTable.filter((item) => (item.totalStock || 0) > 0 && (item.totalStock || 0) < 5).length;
    return { total, active, inactive, outOfStock, lowStock };
  }, [dataTable]);

  const filteredData = useMemo(() => {
    const normalizedSearch = quickSearch.trim().toLowerCase();
    return dataTable.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name?.toLowerCase().includes(normalizedSearch) ||
        item.baseSKU?.toLowerCase().includes(normalizedSearch) ||
        item._id?.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;

      switch (filterMode) {
        case 'active':
          return normalizeActive(item.isActive);
        case 'inactive':
          return !normalizeActive(item.isActive);
        case 'low':
          return (item.totalStock || 0) > 0 && (item.totalStock || 0) < 5;
        case 'out':
          return (item.totalStock || 0) <= 0;
        default:
          return true;
      }
    });
  }, [dataTable, filterMode, quickSearch]);

  const lastUpdatedLabel = dataUpdatedAt ? dayjs(dataUpdatedAt).format('HH:mm DD/MM') : 'Chưa đồng bộ';
  const totalRows = dataTable.length;
  const filteredCount = filteredData.length;
  const statCards = [
    { key: 'total', label: 'Tổng sản phẩm', value: stats.total, icon: <AppstoreOutlined style={{ color: '#2563eb' }} />, hint: `Đồng bộ ${lastUpdatedLabel}` },
    { key: 'active', label: 'Đang bán', value: stats.active, icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />, hint: 'Hiển thị trên cửa hàng' },
    { key: 'inactive', label: 'Tạm dừng', value: stats.inactive, icon: <PauseCircleOutlined style={{ color: '#f97316' }} />, hint: 'Đang ẩn hoặc nháp' },
    { key: 'stock', label: 'Cảnh báo tồn kho', value: stats.lowStock, icon: <WarningOutlined style={{ color: '#dc2626' }} />, hint: `${stats.outOfStock} sản phẩm hết hàng`, negative: true },
  ];
  useEffect(() => {
    if (isSuccess && data?.status === 'OK') {
      message.success()
      handleCancel()
      // Invalidate queries để cập nhật sản phẩm mới trên trang chủ
      queryClient.invalidateQueries({ queryKey: ['new-products'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-products'] });
    } else if (isError) {
      message.error()
    }
  }, [isSuccess, data, isError, queryClient])

  useEffect(() => {
    if (isSuccessDeletedMany && dataDeletedMany?.status === 'OK') {
      message.success('Xóa sản phẩm thành công!')
      refetchProducts()
    } else if (isErrorDeletedMany) {
      message.error('Xóa sản phẩm thất bại!')
    }
  }, [isSuccessDeletedMany, isErrorDeletedMany])

  useEffect(() => {
    if (isSuccessDeleted && dataDeleted?.status === 'OK') {
      message.success()
      handleCancelDelete()
    } else if (isErrorDeleted) {
      message.error()
    }
  }, [isSuccessDeleted])


  const handleCloseDrawer = () => {
    setIsOpenDrawer(false);
    setStateProductDetails(initial())
    form.resetFields()
  };

  useEffect(() => {
    if (isSuccessUpdated && dataUpdated?.status === 'OK') {
      message.success()
      handleCloseDrawer()
      // Invalidate queries để cập nhật sản phẩm trên trang chủ
      queryClient.invalidateQueries({ queryKey: ['new-products'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-products'] });
      refetchProducts()
    } else if (isErrorUpdated) {
      message.error()
    }
  }, [isSuccessUpdated, queryClient])

  const handleCancelDelete = () => {
    setIsModalOpenDelete(false)
  }




  const handleDeleteProduct = () => {
    mutationDeleteted.mutate({ id: rowSelected, token: user?.access_token }, {
      onSettled: () => {
        refetchProducts()
      }
    })
  }

  const handleCancel = () => {
    setisModalOpen(false);
    setAiSuggestion(null);
    setIsGeneratingAI(false);
    const resetState = initial();
    setStateProduct(resetState);
    form.resetFields();
    // Đảm bảo form được reset về giá trị ban đầu
    setTimeout(() => {
      form.setFieldsValue(resetState);
    }, 100);
  };

  const mapAttributeValues = (items = []) => {
    return (items || []).map((item) => {
      if (typeof item === 'string') return item;
      return item?.value || item?.name || item?._id || '';
    }).filter(Boolean);
  };

  const getCategoryNameById = (id) => categoriesData?.data?.find(cat => cat._id === id)?.name || '';
  const getBrandNameById = (id) => brandsData?.data?.find(brand => brand._id === id)?.name || '';
  const getCollectionNamesByIds = (ids = []) => {
    if (!Array.isArray(ids)) return [];
    return ids.map(colId => collectionsData?.data?.find(c => c._id === colId)?.name || '').filter(Boolean);
  };

  const handleGenerateAISuggestion = async () => {
    if (!stateProduct.name || !stateProduct.category || !stateProduct.brand) {
      message.error('Vui long nhap ten, danh muc va thuong hieu truoc khi goi y AI!');
      return;
    }

    const payload = {
      productName: stateProduct.name,
      category: getCategoryNameById(stateProduct.category),
      brand: getBrandNameById(stateProduct.brand),
      collections: getCollectionNamesByIds(stateProduct.collections),
      colors: mapAttributeValues(stateProduct.selectedColors),
      sizes: mapAttributeValues(stateProduct.selectedSizes),
      material: mapAttributeValues(stateProduct.selectedMaterials)[0] || '',
      targetGender: 'unisex',
      hasVariant: stateProduct.hasVariations,
      baseSKU: stateProduct.baseSKU || ''
    };

    setIsGeneratingAI(true);
    try {
      const res = await ProductService.generateProductDescriptionAI(payload, user?.access_token);
      if (res?.status === 'OK' && res.data) {
        setAiSuggestion(res.data);
        message.success('Da tao goi y mo ta AI');
      } else {
        message.error(res?.message || 'Khong the tao goi y AI');
      }
    } catch (error) {
      console.error('AI description error:', error);
      message.error('Khong the tao goi y AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleApplyAISuggestion = () => {
    if (!aiSuggestion) return;
    const nextState = {
      ...stateProduct,
      name: aiSuggestion.productNameSuggestion || stateProduct.name,
      description: aiSuggestion.longDescription || stateProduct.description,
      shortDescription: aiSuggestion.shortDescription || stateProduct.shortDescription,
      metaDescription: aiSuggestion.seoDescription || stateProduct.metaDescription,
      metaTitle: aiSuggestion.productNameSuggestion || stateProduct.metaTitle || stateProduct.name,
      baseSKU: stateProduct.baseSKU || aiSuggestion.suggestedSKU || ''
    };
    setStateProduct(nextState);
    form.setFieldsValue({
      name: nextState.name,
      description: nextState.description,
      shortDescription: nextState.shortDescription,
      metaDescription: nextState.metaDescription,
      baseSKU: nextState.baseSKU
    });
  };

  const handleCopyAISuggestion = async () => {
    if (!aiSuggestion) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(aiSuggestion, null, 2));
      message.success('Da copy JSON goi y');
    } catch (error) {
      message.error('Khong copy duoc goi y AI');
    }
  };

  // Refetch categories, brands, collections khi mở modal tạo sản phẩm
  useEffect(() => {
    if (isModalOpen) {
      // Refetch để đảm bảo data mới nhất khi mở modal
      refetchCategories();
      refetchBrands();
      refetchCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const onFinish = () => {
    // Validate trước khi submit
    if (!stateProduct.name || !stateProduct.name.trim()) {
      message.error('Vui lòng nhập tên sản phẩm!')
      return
    }

    if (!stateProduct.category) {
      message.error('Vui lòng chọn danh mục con!')
      return
    }

    if (!stateProduct.brand) {
      message.error('Vui lòng chọn thương hiệu!')
      return
    }

    const originalPrice = Number(stateProduct.originalPrice) || 0;
    const discount = Number(stateProduct.discount) || 0;

    if (originalPrice <= 0) {
      message.error('Vui lòng nhập giá gốc hợp lệ!')
      return
    }

    // Tính giá bán tự động từ giá gốc và % giảm
    const price = Math.round(originalPrice * (1 - Math.max(0, Math.min(100, discount)) / 100));

    if (price <= 0) {
      message.error('Giá sau giảm không hợp lệ (<= 0). Vui lòng điều chỉnh % giảm hoặc giá gốc.');
      return
    }

    // Validate images
    const productImages = (stateProduct.images && stateProduct.images.length > 0)
      ? stateProduct.images
      : (stateProduct.image ? [stateProduct.image] : []);

    if (productImages.length === 0) {
      message.error('Vui lòng chọn ít nhất 1 hình ảnh!')
      return
    }

    // Validate countInStock nếu không có variations
    if (!stateProduct.hasVariations) {
      const stock = Number(stateProduct.countInStock) || 0;
      if (stock < 0) {
        message.error('Số lượng tồn kho không hợp lệ!')
        return
      }
    }

    // Tính toán lại discount dựa trên originalPrice và price
    let calculatedDiscount = 0;
    if (originalPrice > 0 && price >= 0 && price <= originalPrice) {
      calculatedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
      calculatedDiscount = Math.max(0, Math.min(100, calculatedDiscount));
    }

    const params = {
      name: stateProduct.name.trim(),
      type: stateProduct.type || 'product',
      originalPrice: originalPrice,
      price: price,
      description: stateProduct.description || '',
      shortDescription: stateProduct.shortDescription || '',
      metaTitle: stateProduct.metaTitle || stateProduct.name.trim(),
      metaDescription: stateProduct.metaDescription || stateProduct.shortDescription || (stateProduct.description ? stateProduct.description.slice(0, 150) : ''),
      image: productImages[0] || '',
      images: productImages,
      category: stateProduct.category || null,
      brand: stateProduct.brand || null,
      collections: Array.isArray(stateProduct.collections) ? stateProduct.collections : [],
      baseSKU: stateProduct.baseSKU || '',
      countInStock: stateProduct.hasVariations ? 0 : (Number(stateProduct.countInStock) || 0),
      discount: calculatedDiscount,
      hasVariations: stateProduct.hasVariations || false,
      variations: stateProduct.hasVariations ? (Array.isArray(stateProduct.variations) ? stateProduct.variations : []) : [],
      isActive: stateProduct.isActive !== undefined ? stateProduct.isActive : true,
      saleStartDate: stateProduct.saleStartDate ? dayjs(stateProduct.saleStartDate).toISOString() : null,
      saleEndDate: stateProduct.saleEndDate ? dayjs(stateProduct.saleEndDate).toISOString() : null,
      weight: Number(stateProduct.weight) || 0,
      length: Number(stateProduct.length) || 0,
      width: Number(stateProduct.width) || 0,
      height: Number(stateProduct.height) || 0
    }

    mutation.mutate(params, {
      onSettled: () => {
        refetchProducts()
      }
    })
  }
  const handleOnchange = (e) => {
    setStateProduct({
      ...stateProduct,
      [e.target.name]: e.target.value
    })
  }

  // Tự động tính lại Giá sau giảm (price) khi Giá gốc hoặc % Giảm thay đổi
  useEffect(() => {
    const originalPrice = Number(stateProduct.originalPrice) || 0;
    const discount = Number(stateProduct.discount) || 0;

    if (originalPrice > 0) {
      const calculatedPrice = Math.round(originalPrice * (1 - Math.max(0, Math.min(100, discount)) / 100));
      setStateProduct(prev => ({
        ...prev,
        price: calculatedPrice
      }))
    } else {
      setStateProduct(prev => ({ ...prev, price: 0 }))
    }
  }, [stateProduct.originalPrice, stateProduct.discount])
  const handleOnchangeDetails = (e) => {
    setStateProductDetails({
      ...stateProductDetails,
      [e.target.name]: e.target.value
    })
  }

  // Tự động tính lại Giá sau giảm (price) khi Giá gốc hoặc % Giảm thay đổi (cho update)
  useEffect(() => {
    const originalPrice = Number(stateProductDetails.originalPrice) || 0;
    const discount = Number(stateProductDetails.discount) || 0;

    if (originalPrice > 0) {
      const calculatedPrice = Math.round(originalPrice * (1 - Math.max(0, Math.min(100, discount)) / 100));
      setStateProductDetails(prev => ({
        ...prev,
        price: calculatedPrice
      }))
    } else {
      setStateProductDetails(prev => ({ ...prev, price: 0 }))
    }
  }, [stateProductDetails.originalPrice, stateProductDetails.discount])
  const handleOnchangeAvatar = async ({ fileList }) => {
    const images = await Promise.all(
      fileList.map(async (file) => {
        if (!file.url && !file.preview) {
          file.preview = await getBase64(file.originFileObj);
        }
        return file.preview || file.url;
      })
    );
    setStateProduct({
      ...stateProduct,
      images: images,
      image: images[0] || ''
    })
  }
  const handleOnchangeAvatarDetails = async ({ fileList }) => {
    const images = await Promise.all(
      fileList.map(async (file) => {
        if (!file.url && !file.preview) {
          file.preview = await getBase64(file.originFileObj);
        }
        return file.preview || file.url;
      })
    );
    setStateProductDetails({
      ...stateProductDetails,
      images: images,
      image: images[0] || ''
    })
  }
  const onUpdateProduct = () => {
    // Validate
    if (!stateProductDetails.name || !stateProductDetails.name.trim()) {
      message.error('Vui lòng nhập tên sản phẩm!')
      return
    }

    const originalPrice = Number(stateProductDetails.originalPrice) || 0;
    const discount = Number(stateProductDetails.discount) || 0;

    if (originalPrice <= 0) {
      message.error('Vui lòng nhập giá gốc hợp lệ!')
      return
    }

    // Tính giá bán tự động từ giá gốc và % giảm
    const price = Math.round(originalPrice * (1 - Math.max(0, Math.min(100, discount)) / 100));

    if (price <= 0) {
      message.error('Giá sau giảm không hợp lệ (<= 0). Vui lòng điều chỉnh % giảm hoặc giá gốc.');
      return
    }

    // Tính toán lại discount dựa trên giá gốc và giá (là giá đã được tính)
    let calculatedDiscount = Math.max(0, Math.min(100, Math.round(((originalPrice - price) / originalPrice) * 100)));

    const productImages = stateProductDetails.images?.length > 0
      ? stateProductDetails.images
      : (stateProductDetails.image ? [stateProductDetails.image] : []);

    const updateData = {
      ...stateProductDetails,
      originalPrice: originalPrice,
      price: price,
      image: productImages[0] || stateProductDetails.image || '',
      images: productImages,
      countInStock: stateProductDetails.hasVariations ? 0 : (Number(stateProductDetails.countInStock) || 0),
      discount: calculatedDiscount,
      collections: Array.isArray(stateProductDetails.collections) ? stateProductDetails.collections : [],
      variations: stateProductDetails.hasVariations ? (Array.isArray(stateProductDetails.variations) ? stateProductDetails.variations : []) : [],
      isActive: stateProductDetails.isActive !== undefined ? stateProductDetails.isActive : true,
      metaTitle: stateProductDetails.metaTitle || stateProductDetails.name,
      metaDescription: stateProductDetails.metaDescription || stateProductDetails.shortDescription || (stateProductDetails.description ? stateProductDetails.description.slice(0, 150) : ''),
      saleStartDate: stateProductDetails.saleStartDate ? dayjs(stateProductDetails.saleStartDate).toISOString() : null,
      saleEndDate: stateProductDetails.saleEndDate ? dayjs(stateProductDetails.saleEndDate).toISOString() : null
    }
    mutationUpdate.mutate({ id: rowSelected, token: user?.access_token, ...updateData }, {
      onSettled: () => {
        refetchProducts()
        setFilterMode('all');
        setQuickSearch('');
      }
    })
  }

  return (
    <PageWrapper>
      <HeaderRow>
        <div>
          <WrapperHeader>Quản lý sản phẩm</WrapperHeader>
          <HeaderMeta>
            <span>Đang hiển thị {filteredCount}/{totalRows} sản phẩm</span>
            <Tag color="blue">Đồng bộ: {lastUpdatedLabel}</Tag>
          </HeaderMeta>
        </div>
        <ActionsGroup>
          <Button icon={<RedoOutlined />} onClick={() => refetchProducts()} loading={isPendingProduct}>

          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setisModalOpen(true)}>
            Thêm sản phẩm
          </Button>
        </ActionsGroup>
      </HeaderRow>

      <StatsGrid>
        {statCards.map((card) => (
          <StatCard key={card.key}>
            <StatLabel>{card.label}</StatLabel>
            <StatValue>
              {card.icon}
              {card.value}
            </StatValue>
            <StatTrend negative={card.negative}>{card.hint}</StatTrend>
          </StatCard>
        ))}
      </StatsGrid>

      <FiltersBar>
        <Input.Search
          allowClear
          placeholder="Tìm theo tên, SKU hoặc ID"
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          onSearch={(value) => setQuickSearch(value)}
          style={{ minWidth: 240, maxWidth: 360 }}
        />
        <Segmented
          value={filterMode}
          onChange={(value) => setFilterMode(value)}
          options={[
            { label: 'Tất cả', value: 'all', icon: <AppstoreOutlined /> },
            { label: `Hoạt động (${stats.active})`, value: 'active', icon: <CheckCircleOutlined /> },
            { label: `Tạm dừng (${stats.inactive})`, value: 'inactive', icon: <PauseCircleOutlined /> },
            { label: `Gần hết (${stats.lowStock})`, value: 'low', icon: <WarningOutlined /> },
            { label: `Hết hàng (${stats.outOfStock})`, value: 'out', icon: <InboxOutlined /> },
          ]}
        />
        <Tag color="geekblue">Đã lọc: {filteredCount}/{totalRows}</Tag>
        <Button type="text" icon={<RedoOutlined />} onClick={() => { setFilterMode('all'); setQuickSearch(''); }}>

        </Button>
      </FiltersBar>

      <TableCard>
        <TableHeader>
          <div>
            <TableTitle>Danh sách sản phẩm</TableTitle>

          </div>
          <Tag color={filterMode === 'all' ? 'blue' : 'orange'}>
            {filteredCount} kết quả
          </Tag>
        </TableHeader>
        <TableComponent
          handleDeleteMany={handleDeleteManyProducts}
          columns={columns}
          isPending={isPendingProduct}
          data={filteredData}
          onRow={(record) => ({
            onClick: () => {
              setRowSelected(record._id)
            }
          })}
          scroll={{ x: 1300 }}
        />
      </TableCard>
      <ModalComponent forceRender
        title="Tạo sản phẩm"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={1280}>
        <Loading isPending={isPending}>
          <Form
            name="basic"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
            autoComplete="on"
            form={form}
          >
            <Form.Item
              label="Tên sản phẩm"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
            >
              <Inputcomponent value={stateProduct.name} onChange={handleOnchange} name="name" />
            </Form.Item>

            <Form.Item
              label="Danh mục cha"
              name="parentCategory"
            >
              <Select
                value={stateProduct.parentCategory}
                onChange={(value) => {
                  // Set parent and clear selected child category
                  setStateProduct({
                    ...stateProduct,
                    parentCategory: value || '',
                    category: ''
                  })
                }}
                placeholder={
                  parentCategoryOptions.length === 0 && isLoadingParents
                    ? 'Đang tải danh mục...'
                    : 'Chọn danh mục cha'
                }
                loading={isLoadingParents && parentCategoryOptions.length === 0}
                showSearch
                allowClear
                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                onFocus={() => { if (!isLoadingParents && parentsData?.data?.length === 0) refetchParents(); }}
              >
                {parentCategoryOptions.map((cat) => (
                  <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Danh mục con"
              name="category"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục con!' }]}
            >
              <Select
                value={stateProduct.category}
                onChange={(value) => {
                  setStateProduct({ ...stateProduct, category: value })
                  // Refetch attributes with selected child category
                  refetchColors()
                  refetchSizes()
                  refetchMaterials()
                }}
                placeholder={
                  isLoadingCategories
                    ? 'Đang tải...'
                    : (stateProduct.parentCategory ? 'Chọn danh mục con' : 'Chọn danh mục cha trước')
                }
                loading={isLoadingCategories}
                showSearch
                disabled={!stateProduct.parentCategory}
                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
                onFocus={() => { if (!isLoadingCategories && categoriesData?.data?.length === 0) refetchCategories(); }}
                notFoundContent={
                  stateProduct.parentCategory
                    ? 'Không có danh mục con phù hợp'
                    : 'Vui lòng chọn danh mục cha'
                }
              >
                {availableChildCategoriesCreate.map((cat) => (
                  <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Thương hiệu"
              name="brand"
              rules={[{ required: true, message: 'Vui lòng chọn thương hiệu!' }]}
            >
              <Select
                value={stateProduct.brand}
                onChange={(value) => setStateProduct({ ...stateProduct, brand: value })}
                placeholder={isLoadingBrands ? "Đang tải thương hiệu..." : "Chọn thương hiệu"}
                loading={isLoadingBrands}
                notFoundContent={isLoadingBrands ? "Đang tải..." : (brandsData?.data?.length === 0 ? "Không có thương hiệu nào" : "Không tìm thấy")}
                showSearch
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onFocus={() => {
                  if (!isLoadingBrands && brandsData?.data?.length === 0) {
                    refetchBrands();
                  }
                }}
              >
                {brandsData?.data?.map(brand => (
                  <Option key={brand._id} value={brand._id}>{brand.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Bộ sưu tập"
              name="collections"
            >
              <Select
                mode="multiple"
                value={stateProduct.collections}
                onChange={(value) => setStateProduct({ ...stateProduct, collections: value })}
                placeholder={isLoadingCollections ? "Đang tải bộ sưu tập..." : "Chọn bộ sưu tập (có thể chọn nhiều)"}
                loading={isLoadingCollections}
                notFoundContent={isLoadingCollections ? "Đang tải..." : (collectionsData?.data?.length === 0 ? "Không có bộ sưu tập nào" : "Không tìm thấy")}
                showSearch
                filterOption={(input, option) =>
                  (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onFocus={() => {
                  if (!isLoadingCollections && collectionsData?.data?.length === 0) {
                    refetchCollections();
                  }
                }}
              >
                {collectionsData?.data?.map(col => (
                  <Option key={col._id} value={col._id}>{col.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Gợi ý mô tả AI">
              <Space wrap>
                <Button
                  icon={<BulbOutlined />}
                  onClick={handleGenerateAISuggestion}
                  loading={isGeneratingAI}
                >
                  Gợi ý mô tả AI
                </Button>
                {aiSuggestion && (
                  <>
                    <Button onClick={handleApplyAISuggestion}>Dùng gợi ý</Button>
                    <Button icon={<CopyOutlined />} onClick={handleCopyAISuggestion}>Copy JSON</Button>
                  </>
                )}
              </Space>
              {aiSuggestion && (
                <div style={{ marginTop: 10, padding: 12, border: '1px solid #e0e7ff', background: '#f8faff', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Bản nháp AI</div>
                  <div><strong>Tiêu đề:</strong> {aiSuggestion.productNameSuggestion}</div>
                  <div style={{ marginTop: 6 }}><strong>Mô tả ngắn:</strong> {aiSuggestion.shortDescription}</div>
                  <div style={{ marginTop: 6 }}><strong>Mô tả dài:</strong> {aiSuggestion.longDescription}</div>
                  <div style={{ marginTop: 6 }}><strong>Nổi bật:</strong>
                    <ul style={{ margin: '6px 0 0 20px' }}>
                      {(aiSuggestion.highlights || []).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginTop: 6 }}><strong>SEO:</strong> {aiSuggestion.seoDescription}</div>
                  <div style={{ marginTop: 6 }}><strong>Tags:</strong> {(aiSuggestion.tags || []).join(', ')}</div>
                  <div style={{ marginTop: 6 }}><strong>SKU gợi ý:</strong> {aiSuggestion.suggestedSKU}</div>
                  {aiSuggestion.variantMatrix?.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <strong>Biến thể:</strong> {aiSuggestion.variantMatrix.length} gợi ý màu/size
                    </div>
                  )}
                </div>
              )}
            </Form.Item>

            <Form.Item
              label="Mô tả"
              name="description"
              rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
            >
              <TextArea
                value={stateProduct.description}
                onChange={handleOnchange}
                name="description"
                rows={4}
                placeholder="Mô tả chi tiết sản phẩm..."
              />
            </Form.Item>

            <Form.Item
              label="Mô tả ngắn"
              name="shortDescription"
            >
              <TextArea
                value={stateProduct.shortDescription}
                onChange={handleOnchange}
                name="shortDescription"
                rows={3}
                placeholder="Tóm tắt 20-25 từ cho sản phẩm"
              />
            </Form.Item>

            <Form.Item
              label="SEO Description"
              name="metaDescription"
            >
              <TextArea
                value={stateProduct.metaDescription}
                onChange={handleOnchange}
                name="metaDescription"
                rows={3}
                showCount
                maxLength={160}
                placeholder="Mô tả ngắn gọn cho SEO (<=150 ký tự)"
              />
            </Form.Item>

            <Form.Item
              label="Hình ảnh"
              name="images"
              rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 hình ảnh!' }]}
            >
              <WrapperUploadFile onChange={handleOnchangeAvatar} maxCount={6}>
                <Button>Chọn File (3-6 hình)</Button>
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {stateProduct?.images?.map((img, idx) => (
                    <img key={idx} src={img} style={{
                      height: '80px',
                      width: '80px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #ddd'
                    }} alt={`product-${idx}`} />
                  ))}
                </div>
              </WrapperUploadFile>
            </Form.Item>

            {/* PHẦN 2: THUỘC TÍNH BIẾN THỂ */}
            <Form.Item
              label="Có biến thể"
              name="hasVariations"
              valuePropName="checked"
            >
              <Switch
                checked={stateProduct.hasVariations}
                onChange={(checked) => setStateProduct({ ...stateProduct, hasVariations: checked })}
              />
            </Form.Item>

            {stateProduct.hasVariations && (
              <>
                <Form.Item
                  label="Mã SKU gốc"
                  name="baseSKU"
                >
                  <Inputcomponent
                    value={stateProduct.baseSKU}
                    onChange={handleOnchange}
                    name="baseSKU"
                    placeholder="VD: NIKE-JD1 (để tự động tạo SKU cho biến thể)"
                  />
                </Form.Item>

                <Form.Item
                  label="Chọn màu sắc"
                  name="selectedColors"
                >
                  <Select
                    mode="multiple"
                    value={stateProduct.selectedColors?.map(c => c._id || c.value || c) || []}
                    onChange={(value) => {
                      const colorObjects = value.map(v => {
                        const found = colorsData?.data?.find(c => c._id === v)
                        return found || { value: v, _id: v }
                      })
                      setStateProduct({ ...stateProduct, selectedColors: colorObjects })
                    }}
                    placeholder="Chọn màu sắc"
                    style={{ width: '100%' }}
                  >
                    {colorsData?.data?.map(color => (
                      <Option key={color._id} value={color._id}>
                        <Space>
                          {color.hexCode && (
                            <div style={{
                              width: 16,
                              height: 16,
                              backgroundColor: color.hexCode,
                              border: '1px solid #ddd',
                              borderRadius: 2
                            }} />
                          )}
                          {color.value}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Chọn size"
                  name="selectedSizes"
                >
                  <Select
                    mode="multiple"
                    value={stateProduct.selectedSizes?.map(s => s._id || s.value || s) || []}
                    onChange={(value) => {
                      const sizeObjects = value.map(v => {
                        const found = sizesData?.data?.find(s => s._id === v)
                        return found || { value: v, _id: v }
                      })
                      setStateProduct({ ...stateProduct, selectedSizes: sizeObjects })
                    }}
                    placeholder="Chọn size"
                    style={{ width: '100%' }}
                  >
                    {sizesData?.data?.map(size => (
                      <Option key={size._id} value={size._id}>{size.value}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Chọn chất liệu"
                  name="selectedMaterials"
                >
                  <Select
                    mode="multiple"
                    value={stateProduct.selectedMaterials?.map(m => m._id || m.value || m) || []}
                    onChange={(value) => {
                      const materialObjects = value.map(v => {
                        const found = materialsData?.data?.find(m => m._id === v)
                        return found || { value: v, _id: v }
                      })
                      setStateProduct({ ...stateProduct, selectedMaterials: materialObjects })
                    }}
                    placeholder="Chọn chất liệu (tùy chọn)"
                    style={{ width: '100%' }}
                  >
                    {materialsData?.data?.map(material => (
                      <Option key={material._id} value={material._id}>{material.value}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Ma trận biến thể"
                  name="variations"
                >
                  <VariationsMatrix
                    selectedColors={stateProduct.selectedColors || []}
                    selectedSizes={stateProduct.selectedSizes || []}
                    selectedMaterials={stateProduct.selectedMaterials || []}
                    basePrice={Number(stateProduct.price) || 0}
                    baseSKU={stateProduct.baseSKU || ''}
                    variations={stateProduct.variations || []}
                    colorsData={colorsData}
                    onChange={(variations) => setStateProduct({ ...stateProduct, variations })}
                  />
                </Form.Item>
              </>
            )}

            {!stateProduct.hasVariations && (
              <Form.Item
                label="Tồn kho"
                name="countInStock"
                rules={[{ required: true, message: 'Vui lòng nhập tồn kho!' }]}
              >
                <InputNumber
                  value={stateProduct.countInStock}
                  onChange={(value) => setStateProduct({ ...stateProduct, countInStock: value !== null && value !== undefined ? Number(value) : 0 })}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}

            {/* PHẦN 3: THÔNG TIN BÁN HÀNG */}
            <Form.Item
              label="Giá gốc (VNĐ)"
              name="originalPrice"
              rules={[{ required: true, message: 'Vui lòng nhập giá gốc!' }]}
            >
              <InputNumber
                value={stateProduct.originalPrice}
                onChange={(value) => {
                  const numValue = value !== null && value !== undefined ? Number(value) : 0;
                  setStateProduct({ ...stateProduct, originalPrice: numValue })
                }}
                min={0}
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            {/* Giá bán sẽ được tính tự động từ Giá gốc và % Giảm. Hiển thị read-only */}
            <Form.Item
              label="Giá sau giảm (VNĐ)"
              name="finalPrice"
            >
              <InputNumber
                value={stateProduct.price}
                disabled
                style={{ width: '100%', background: '#fafafa' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
              />
            </Form.Item>

            <Form.Item
              label="Giảm giá (%)"
              name="discount"
              tooltip="Nhập % giảm giá, giá bán sẽ tự động được tính lại từ giá gốc"
            >
              <InputNumber
                value={stateProduct.discount}
                onChange={(value) => {
                  const discountValue = value !== null && value !== undefined ? Number(value) : 0;
                  const validDiscount = Math.max(0, Math.min(100, discountValue));
                  const originalPrice = Number(stateProduct.originalPrice) || 0;

                  // Nếu nhập discount thủ công, tính lại giá bán
                  if (originalPrice > 0 && validDiscount >= 0) {
                    const calculatedPrice = Math.round(originalPrice * (1 - validDiscount / 100));
                    setStateProduct({
                      ...stateProduct,
                      discount: validDiscount,
                      price: calculatedPrice,
                      isManualDiscount: true // Đánh dấu là user nhập discount thủ công
                    })
                  } else {
                    setStateProduct({
                      ...stateProduct,
                      discount: validDiscount,
                      isManualDiscount: true
                    })
                  }
                }}
                min={0}
                max={100}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="Thời gian bắt đầu giảm giá"
              name="saleStartDate"
              tooltip="Chọn thời gian bắt đầu sale (tùy chọn)"
            >
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                value={stateProduct.saleStartDate}
                onChange={(date) => setStateProduct({ ...stateProduct, saleStartDate: date })}
                placeholder="Chọn thời gian bắt đầu"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="Thời gian kết thúc giảm giá"
              name="saleEndDate"
              tooltip="Chọn thời gian kết thúc sale (tùy chọn)"
            >
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                value={stateProduct.saleEndDate}
                onChange={(date) => setStateProduct({ ...stateProduct, saleEndDate: date })}
                placeholder="Chọn thời gian kết thúc"
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  if (stateProduct.saleStartDate) {
                    return current && current < stateProduct.saleStartDate.startOf('day');
                  }
                  return false;
                }}
              />
            </Form.Item>


            <Form.Item
              label="Trạng thái"
              name="isActive"
              valuePropName="checked"
            >
              <Switch
                checked={stateProduct.isActive}
                onChange={(checked) => setStateProduct({ ...stateProduct, isActive: checked })}
              />
            </Form.Item>

            {/* PHẦN 4: THÔNG TIN VẬN CHUYỂN */}
            <div style={{ marginBottom: '16px', fontWeight: 600, color: '#111', fontSize: '15px' }}>
              PHẦN 4: THÔNG TIN VẬN CHUYỂN
            </div>

            <Form.Item
              label="Cân nặng (gr)"
              name="weight"
              rules={[{ required: true, message: 'Vui lòng nhập cân nặng!' }]}
            >
              <InputNumber
                value={stateProduct.weight}
                onChange={(value) => setStateProduct({ ...stateProduct, weight: Number(value) || 0 })}
                min={0}
                style={{ width: '100%' }}
                placeholder="Ví dụ: 500 (gram)"
              />
            </Form.Item>

            <Form.Item label="Kích thước (cm)" style={{ marginBottom: 0 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="length" style={{ flex: 1 }}>
                  <InputNumber
                    placeholder="Dài"
                    value={stateProduct.length}
                    onChange={(value) => setStateProduct({ ...stateProduct, length: Number(value) || 0 })}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item name="width" style={{ flex: 1 }}>
                  <InputNumber
                    placeholder="Rộng"
                    value={stateProduct.width}
                    onChange={(value) => setStateProduct({ ...stateProduct, width: Number(value) || 0 })}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item name="height" style={{ flex: 1 }}>
                  <InputNumber
                    placeholder="Cao"
                    value={stateProduct.height}
                    onChange={(value) => setStateProduct({ ...stateProduct, height: Number(value) || 0 })}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Loading >
      </ModalComponent>
      <DrawerComponent title='Chi tiết sản phẩm' isOpen={isOpenDrawer} onClose={() => setIsOpenDrawer(false)} width="90%">
        <Loading isPending={isPendingUpdate || isPendingUpdated}>
          <Form
            name="basic"
            labelCol={{ span: 2 }}
            wrapperCol={{ span: 22 }}
            onFinish={onUpdateProduct}
            autoComplete="on"
            form={form}
          >
            <Tabs
              items={[
                {
                  key: 'basic',
                  label: 'Thông tin cơ bản',
                  children: (
                    <>
                      <Form.Item
                        label="Tên sản phẩm"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
                      >
                        <Inputcomponent value={stateProductDetails['name']} onChange={handleOnchangeDetails} name="name" />
                      </Form.Item>

                      <Form.Item
                        label="Danh mục cha"
                        name="parentCategory"
                      >
                        <Select
                          value={stateProductDetails.parentCategory}
                          onChange={(value) => {
                            setStateProductDetails({
                              ...stateProductDetails,
                              parentCategory: value || '',
                              category: '',
                              selectedColors: [],
                              selectedSizes: [],
                              selectedMaterials: [],
                              variations: []
                            });
                          }}
                          placeholder={
                            parentCategoryOptions.length === 0 && isLoadingParents
                              ? 'Đang tải danh mục...'
                              : 'Chọn danh mục cha'
                          }
                          loading={isLoadingParents && parentCategoryOptions.length === 0}
                          showSearch
                          allowClear
                          filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          onFocus={() => {
                            if (!isLoadingParents && parentsData?.data?.length === 0) {
                              refetchParents();
                            }
                          }}
                        >
                          {parentCategoryOptions.map((cat) => (
                            <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Danh mục"
                        name="category"
                        rules={[{ required: true }]}
                      >
                        <Select
                          value={stateProductDetails.category}
                          onChange={(value) => {
                            // Khi đổi category, reset selected colors/sizes/materials và refetch attributes
                            setStateProductDetails({
                              ...stateProductDetails,
                              category: value,
                              selectedColors: [],
                              selectedSizes: [],
                              selectedMaterials: [],
                              variations: []
                            })
                            // Refetch attributes với category mới
                            refetchColorsDetails()
                            refetchSizesDetails()
                            refetchMaterialsDetails()
                          }}
                          placeholder={
                            isLoadingCategories
                              ? 'Đang tải danh mục...'
                              : (stateProductDetails.parentCategory ? 'Chọn danh mục con' : 'Chọn danh mục cha trước')
                          }
                          loading={isLoadingCategories}
                          notFoundContent={
                            stateProductDetails.parentCategory
                              ? 'Không có danh mục con phù hợp'
                              : 'Vui lòng chọn danh mục cha'
                          }
                          showSearch
                          disabled={!stateProductDetails.parentCategory}
                          filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          onFocus={() => {
                            if (!isLoadingCategories && categoriesData?.data?.length === 0) {
                              refetchCategories();
                            }
                          }}
                        >
                          {availableChildCategoriesDetails.map((cat) => (
                            <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Thương hiệu"
                        name="brand"
                        rules={[{ required: true }]}
                      >
                        <Select
                          value={stateProductDetails.brand}
                          onChange={(value) => setStateProductDetails({ ...stateProductDetails, brand: value })}
                          placeholder={isLoadingBrands ? "Đang tải thương hiệu..." : "Chọn thương hiệu"}
                          loading={isLoadingBrands}
                          notFoundContent={isLoadingBrands ? "Đang tải..." : (brandsData?.data?.length === 0 ? "Không có thương hiệu nào" : "Không tìm thấy")}
                          showSearch
                          filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          onFocus={() => {
                            if (!isLoadingBrands && brandsData?.data?.length === 0) {
                              refetchBrands();
                            }
                          }}
                        >
                          {brandsData?.data?.map(brand => (
                            <Option key={brand._id} value={brand._id}>{brand.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Bộ sưu tập"
                        name="collections"
                      >
                        <Select
                          mode="multiple"
                          value={stateProductDetails.collections}
                          onChange={(value) => setStateProductDetails({ ...stateProductDetails, collections: value })}
                          placeholder={isLoadingCollections ? "Đang tải bộ sưu tập..." : "Chọn bộ sưu tập"}
                          loading={isLoadingCollections}
                          notFoundContent={isLoadingCollections ? "Đang tải..." : (collectionsData?.data?.length === 0 ? "Không có bộ sưu tập nào" : "Không tìm thấy")}
                          showSearch
                          filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          onFocus={() => {
                            if (!isLoadingCollections && collectionsData?.data?.length === 0) {
                              refetchCollections();
                            }
                          }}
                        >
                          {collectionsData?.data?.map(col => (
                            <Option key={col._id} value={col._id}>{col.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Mô tả"
                        name="description"
                        rules={[{ required: true }]}
                      >
                        <TextArea
                          value={stateProductDetails.description}
                          onChange={handleOnchangeDetails}
                          name="description"
                          rows={6}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Mô tả ngắn"
                        name="shortDescription"
                      >
                        <TextArea
                          value={stateProductDetails.shortDescription}
                          onChange={handleOnchangeDetails}
                          name="shortDescription"
                          rows={3}
                          placeholder="Tóm tắt 20-25 từ cho sản phẩm"
                        />
                      </Form.Item>

                      <Form.Item
                        label="SEO Description"
                        name="metaDescription"
                      >
                        <TextArea
                          value={stateProductDetails.metaDescription}
                          onChange={handleOnchangeDetails}
                          name="metaDescription"
                          rows={3}
                          showCount
                          maxLength={160}
                          placeholder="Mô tả ngắn gọn cho SEO (<=150 ký tự)"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Hình ảnh"
                        name="images"
                        rules={[{ required: true }]}
                      >
                        <WrapperUploadFile onChange={handleOnchangeAvatarDetails} maxCount={6}>
                          <Button>Chọn File (3-6 hình)</Button>
                          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {stateProductDetails?.images?.map((img, idx) => (
                              <img key={idx} src={img} style={{
                                height: '80px',
                                width: '80px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid #ddd'
                              }} alt={`product-${idx}`} />
                            ))}
                          </div>
                        </WrapperUploadFile>
                      </Form.Item>
                    </>
                  )
                },
                {
                  key: 'variations',
                  label: 'Biến thể',
                  children: (
                    <>
                      <Form.Item
                        label="Có biến thể"
                        name="hasVariations"
                        valuePropName="checked"
                      >
                        <Switch
                          checked={stateProductDetails.hasVariations}
                          onChange={(checked) => setStateProductDetails({ ...stateProductDetails, hasVariations: checked })}
                        />
                      </Form.Item>

                      {stateProductDetails.hasVariations && (
                        <>
                          <Form.Item label="Mã SKU gốc" name="baseSKU">
                            <Inputcomponent
                              value={stateProductDetails.baseSKU}
                              onChange={handleOnchangeDetails}
                              name="baseSKU"
                            />
                          </Form.Item>

                          <Form.Item label="Chọn màu sắc" name="selectedColors">
                            <Select
                              mode="multiple"
                              value={stateProductDetails.selectedColors?.map(c => c._id || c.value || c)}
                              onChange={(value) => {
                                const colorObjects = value.map(v => colorsDataDetails?.data?.find(c => c._id === v) || { value: v, _id: v })
                                setStateProductDetails({ ...stateProductDetails, selectedColors: colorObjects })
                              }}
                              placeholder="Chọn màu sắc"
                              style={{ width: '100%' }}
                            >
                              {colorsDataDetails?.data?.map(color => (
                                <Option key={color._id} value={color._id}>
                                  <Space>
                                    {color.hexCode && (
                                      <div style={{
                                        width: 16,
                                        height: 16,
                                        backgroundColor: color.hexCode,
                                        border: '1px solid #ddd',
                                        borderRadius: 2
                                      }} />
                                    )}
                                    {color.value}
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item label="Chọn size" name="selectedSizes">
                            <Select
                              mode="multiple"
                              value={stateProductDetails.selectedSizes?.map(s => s._id || s.value || s)}
                              onChange={(value) => {
                                const sizeObjects = value.map(v => sizesDataDetails?.data?.find(s => s._id === v) || { value: v, _id: v })
                                setStateProductDetails({ ...stateProductDetails, selectedSizes: sizeObjects })
                              }}
                              placeholder="Chọn size"
                              style={{ width: '100%' }}
                            >
                              {sizesDataDetails?.data?.map(size => (
                                <Option key={size._id} value={size._id}>{size.value}</Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item label="Chọn chất liệu" name="selectedMaterials">
                            <Select
                              mode="multiple"
                              value={stateProductDetails.selectedMaterials?.map((m) => m._id || m.value || m)}
                              onChange={(value) => {
                                const materialObjects = value.map(
                                  (v) => materialsDataDetails?.data?.find((m) => m._id === v) || { value: v, _id: v }
                                )
                                setStateProductDetails({
                                  ...stateProductDetails,
                                  selectedMaterials: materialObjects
                                })
                              }}
                              placeholder="Chọn chất liệu (tùy chọn)"
                              style={{ width: '100%' }}
                            >
                              {materialsDataDetails?.data?.map((material) => (
                                <Option key={material._id} value={material._id}>
                                  {material.value}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item label="Ma trận biến thể" name="variations">
                            <VariationsMatrix
                              selectedColors={stateProductDetails.selectedColors || []}
                              selectedSizes={stateProductDetails.selectedSizes || []}
                              selectedMaterials={stateProductDetails.selectedMaterials || []}
                              basePrice={Number(stateProductDetails.price) || 0}
                              baseSKU={stateProductDetails.baseSKU || ''}
                              variations={stateProductDetails.variations || []}
                              colorsData={colorsDataDetails}
                              onChange={(variations) => setStateProductDetails({ ...stateProductDetails, variations })}
                            />
                          </Form.Item>
                        </>
                      )}

                      {!stateProductDetails.hasVariations && (
                        <Form.Item
                          label="Tồn kho"
                          name="countInStock"
                          rules={[{ required: true }]}
                        >
                          <InputNumber
                            value={stateProductDetails.countInStock}
                            onChange={(value) => setStateProductDetails({ ...stateProductDetails, countInStock: value !== null && value !== undefined ? Number(value) : 0 })}
                            min={0}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      )}
                    </>
                  )
                },
                {
                  key: 'selling',
                  label: 'Thông tin bán hàng',
                  children: (
                    <>
                      <Form.Item
                        label="Giá gốc (VNĐ)"
                        name="originalPrice"
                        rules={[{ required: true }]}
                      >
                        <InputNumber
                          value={stateProductDetails.originalPrice}
                          onChange={(value) => {
                            const numValue = value !== null && value !== undefined ? Number(value) : 0;
                            setStateProductDetails({ ...stateProductDetails, originalPrice: numValue })
                          }}
                          min={0}
                          style={{ width: '100%' }}
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                      </Form.Item>

                      {/* Giá bán được tính tự động từ Giá gốc và % Giảm (read-only) */}
                      <Form.Item
                        label="Giá sau giảm (VNĐ)"
                        name="finalPrice"
                      >
                        <InputNumber
                          value={stateProductDetails.price}
                          disabled
                          style={{ width: '100%', background: '#fafafa' }}
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value ? value.replace(/\$\s?|(,*)/g, '') : ''}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Giảm giá (%)"
                        name="discount"
                        tooltip="Nhập % giảm giá, giá bán sẽ tự động được tính lại từ giá gốc"
                      >
                        <InputNumber
                          value={stateProductDetails.discount}
                          onChange={(value) => {
                            const discountValue = value !== null && value !== undefined ? Number(value) : 0;
                            const validDiscount = Math.max(0, Math.min(100, discountValue));
                            const originalPrice = Number(stateProductDetails.originalPrice) || 0;

                            // Nếu nhập discount thủ công, tính lại giá bán
                            if (originalPrice > 0 && validDiscount >= 0) {
                              const calculatedPrice = Math.round(originalPrice * (1 - validDiscount / 100));
                              setStateProductDetails({
                                ...stateProductDetails,
                                discount: validDiscount,
                                price: calculatedPrice
                              })
                            } else {
                              setStateProductDetails({ ...stateProductDetails, discount: validDiscount })
                            }
                          }}
                          min={0}
                          max={100}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Thời gian bắt đầu giảm giá"
                        name="saleStartDate"
                        tooltip="Chọn thời gian bắt đầu sale (tùy chọn)"
                      >
                        <DatePicker
                          showTime
                          format="DD/MM/YYYY HH:mm"
                          value={stateProductDetails.saleStartDate}
                          onChange={(date) => setStateProductDetails({ ...stateProductDetails, saleStartDate: date })}
                          placeholder="Chọn thời gian bắt đầu"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Thời gian kết thúc giảm giá"
                        name="saleEndDate"
                        tooltip="Chọn thời gian kết thúc sale (tùy chọn)"
                      >
                        <DatePicker
                          showTime
                          format="DD/MM/YYYY HH:mm"
                          value={stateProductDetails.saleEndDate}
                          onChange={(date) => setStateProductDetails({ ...stateProductDetails, saleEndDate: date })}
                          placeholder="Chọn thời gian kết thúc"
                          style={{ width: '100%' }}
                          disabledDate={(current) => {
                            if (stateProductDetails.saleStartDate) {
                              return current && current < stateProductDetails.saleStartDate.startOf('day');
                            }
                            return false;
                          }}
                        />
                      </Form.Item>


                      <Form.Item
                        label="Trạng thái"
                        name="isActive"
                        valuePropName="checked"
                      >
                        <Switch
                          checked={stateProductDetails.isActive}
                          onChange={(checked) => setStateProductDetails({ ...stateProductDetails, isActive: checked })}
                        />
                      </Form.Item>
                    </>
                  )
                },
                {
                  key: 'shipping',
                  label: 'Vận chuyển',
                  children: (
                    <>
                      <Form.Item
                        label="Cân nặng (gram)"
                        name="weight"
                        rules={[{ required: true, message: 'Vui lòng nhập cân nặng!' }]}
                      >
                        <InputNumber
                          value={stateProductDetails.weight}
                          onChange={(value) => setStateProductDetails({ ...stateProductDetails, weight: Number(value) || 0 })}
                          min={0}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item label="Kích thước (cm)">
                        <Space.Compact style={{ width: '100%' }}>
                          <Form.Item name="length" noStyle>
                            <InputNumber
                              placeholder="Dài"
                              value={stateProductDetails.length}
                              onChange={(value) => setStateProductDetails({ ...stateProductDetails, length: Number(value) || 0 })}
                              min={0}
                              style={{ width: '33%' }}
                            />
                          </Form.Item>
                          <Form.Item name="width" noStyle>
                            <InputNumber
                              placeholder="Rộng"
                              value={stateProductDetails.width}
                              onChange={(value) => setStateProductDetails({ ...stateProductDetails, width: Number(value) || 0 })}
                              min={0}
                              style={{ width: '33%' }}
                            />
                          </Form.Item>
                          <Form.Item name="height" noStyle>
                            <InputNumber
                              placeholder="Cao"
                              value={stateProductDetails.height}
                              onChange={(value) => setStateProductDetails({ ...stateProductDetails, height: Number(value) || 0 })}
                              min={0}
                              style={{ width: '34%' }}
                            />
                          </Form.Item>
                        </Space.Compact>
                      </Form.Item>
                    </>
                  )
                }
              ]}
            />

            <Form.Item wrapperCol={{ offset: 20, span: 16 }}>
              <Button type="primary" htmlType="submit">
                Apply
              </Button>
            </Form.Item>
          </Form>
        </Loading >
      </DrawerComponent>
      <ModalComponent title="Xóa sản phẩm" open={isModalOpenDelete} onCancel={handleCancelDelete} onOk={handleDeleteProduct} >
        <Loading isPending={isPendingDeleted}>
          <div>Bạn có chắc xóa sản phẩm này không?</div>
        </Loading >
      </ModalComponent>
    </PageWrapper>
  )
}

export default AdminProduct

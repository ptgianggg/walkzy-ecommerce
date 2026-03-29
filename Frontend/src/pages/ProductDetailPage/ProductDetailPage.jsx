import React, { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ProductDetailComponent from '../../components/ProductDetailComponent/ProductDetailComponent'
import ProductReviews from '../../components/ProductReviews/ProductReviews'
import RelatedProducts from '../../components/RelatedProducts/RelatedProducts'
import * as ProductService from '../../services/ProductService'
import { useNavigate, useParams } from 'react-router-dom'

const ProductDetailPage = () => {
  // Tất cả hooks phải được gọi ở top-level
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Validate ID trước khi sử dụng - kiểm tra kỹ hơn (chỉ là biến, không phải hook)
  const productId = id && String(id).trim() && String(id).trim() !== 'undefined' && String(id).trim() !== 'null' 
    ? String(id).trim() 
    : null;

  // Tất cả hooks phải được gọi trước khi có bất kỳ early return nào
  // Fetch product details để lấy category và brand
  // Chỉ fetch nếu cần, không duplicate với ProductDetailComponent
  const { data: productDetails } = useQuery({
    queryKey: ['product-details', productId],
    queryFn: async () => {
      // Double check
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const res = await ProductService.getDetailsProduct(productId);
      return res.data;
    },
    enabled: !!productId,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    retry: false, // Không retry nếu lỗi
  });

  useEffect(() => {
    if (productId && productDetails) {
      queryClient.setQueryData(['product-details', productId], productDetails)
    }
  }, [productId, productDetails, queryClient])

  // Nếu không có ID hợp lệ, redirect về trang chủ ngay - SAU KHI hooks đã được gọi
  useEffect(() => {
    if (!productId) {
      navigate('/', { replace: true });
    }
  }, [productId, navigate]);

  // Early return check - SAU KHI tất cả hooks đã được gọi
  if (!productId) {
    return (
      <div style={{ minHeight: '100vh', width:'100%',background:'#efefef', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h3>Sản phẩm không tồn tại</h3>
          <button onClick={() => navigate('/')} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width:'100%',background:'#efefef' }}>
      <div style={{width:'1270px',margin:'0 auto', paddingTop: '20px', paddingBottom: '20px'}}>
      <h5 style={{ fontSize: '20px', marginBottom: '16px' }}>
        <span style={{cursor:'pointer',fontWeight:'bold'}}   onClick={()=>{navigate('/')}}>Trang chủ </span> - Chi tiết sản phẩm
      </h5>
      <ProductDetailComponent idProduct={productId} />
      <ProductReviews productId={productId} />
      {productDetails && (
        <RelatedProducts 
          productId={productId}
          categoryId={productDetails.category?._id || productDetails.category}
          brandId={productDetails.brand?._id || productDetails.brand}
          basePrice={productDetails.price}
          limit={8}
        />
      )}
      </div>
    </div>
  )
}

export default ProductDetailPage

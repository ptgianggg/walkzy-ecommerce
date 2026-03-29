import React, { Fragment, useState } from 'react'
import NavbarComponent from '../../components/NavbarComponent/NavbarComponent'
import CardComponent from '../../components/CardComponent/CardComponent'
import { Col, Pagination, Row } from 'antd'
import { WrapperNavbar, WrapperProducts } from './style'
import { useLocation } from 'react-router-dom'
import * as ProductService from '../../services/ProductService'
import EnhancedHeaderComponent from '../../components/HeaderComponent/EnhancedHeaderComponent'
import Loading from '../../components/LoadingComponent/Loading'
import { useSelector } from 'react-redux'
import { useDebounce } from '../../hooks/useDebounce'
import { useQuery } from '@tanstack/react-query'

const TypeProductPage = () => {
  const searchProduct = useSelector((state) => state?.product?.search)
  const searchDebounce = useDebounce(searchProduct, 500)

  const {state} = useLocation()
  const [panigate,setPanigate] = useState({
    page:0,
    limit:10,
    total:1,
  })

  // Sử dụng React Query để cache và tối ưu performance
  const { data: productsData, isPending } = useQuery({
    queryKey: ['product-type', state, panigate.page, panigate.limit],
    queryFn: () => ProductService.getProductType(state, panigate.page, panigate.limit),
    enabled: !!state,
    staleTime: 2 * 60 * 1000, // Cache 2 phút
    cacheTime: 5 * 60 * 1000, // Giữ cache 5 phút
    keepPreviousData: true, // Giữ data cũ khi đang fetch data mới
  })

  const products = productsData?.data || []
  const total = productsData?.total || 0
  const totalPage = productsData?.totalPage || 1
  
  const onChange = (current, pageSize) => {
    setPanigate({...panigate, page: current - 1, limit: pageSize})
  }
  return (
    <Loading isPending={isPending}>
     <EnhancedHeaderComponent />   
    <div style={{ width: '100%', background: '#efefef', height: 'calc(100vh - 64px)' }}>
        <div style={{ width: '1270px', margin: '0 auto' ,height:'100%'}}>
          <Row style={{ flexWrap: 'nowrap', paddingTop: '10px', height: 'calc(100% - 20px)' }}>

          <WrapperNavbar span={4}>
            <NavbarComponent />
          </WrapperNavbar>

          <Col span={20} style ={{display:'flex',flexDirection:'column',justifyContent:'space-between' }}>
            <WrapperProducts >
              {products?.filter((pro) =>{
                if (searchDebounce === ''){
                  return pro
                } else if (pro?.name?.toLowerCase().includes(searchDebounce?.toLowerCase())){
                    return pro 
                }
              })?.map((product) => {
                return (
                  <CardComponent
                    key={product._id}
                    countInStock={product.countInStock}
                    description={product.description}
                    image={product.image}
                    images={product.images}
                    name={product.name}
                    price={product.price}
                    rating={product.rating}
                    type={product.type}
                    selled={product.selled}
                    discount={product.discount}
                    id={product._id}
                  />
                )
              })}
            </WrapperProducts>
            <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 10 }}>

             
            <Pagination
              current={panigate.page + 1}
              total={total}
              pageSize={panigate.limit}
              onChange={onChange}
              showSizeChanger={false}
              style={{textAlign:'center',marginTop:'10px'}}
            />
            </div>

          </Col>

        </Row>
      </div>
    
    </div>
    </Loading >
    
  )
}

export default TypeProductPage

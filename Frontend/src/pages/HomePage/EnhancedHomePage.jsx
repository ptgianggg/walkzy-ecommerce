import React from 'react';
import { useQuery } from '@tanstack/react-query';
import BannerSlider from '../../components/BannerSlider/BannerSlider';
import AnnouncementBar from '../../components/AnnouncementBar/AnnouncementBar';
import PopupBanner from '../../components/PopupBanner/PopupBanner';
import HomepageBanner from '../../components/HomepageBanner/HomepageBanner';
import ProductSection from '../../components/EnhancedHomePage/ProductSection';
import FlashSaleSection from '../../components/EnhancedHomePage/FlashSaleSection';
import FeaturedCategories from '../../components/EnhancedHomePage/FeaturedCategories';
import CollectionsSection from '../../components/EnhancedHomePage/CollectionsSection';
import * as ProductService from '../../services/ProductService';
import * as CategoryService from '../../services/CategoryService';
import * as CollectionService from '../../services/CollectionService';
import Loading from '../../components/LoadingComponent/Loading';
import { FireOutlined, ThunderboltOutlined, HeartOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const WrapperHomePage = styled.div`
    width: 100%;
    background: #f5f5f5;
`;

const WrapperContainer = styled.div`
    max-width: 1270px;
    width: 100%;
    margin: 0 auto;
    padding: 20px;
    
    @media (max-width: 1270px) {
        padding: 16px;
    }
    
    @media (max-width: 768px) {
        padding: 12px;
    }
`;

const BannerWrapper = styled.div`
    width: 100%;
    margin-bottom: 32px;
    
    @media (max-width: 768px) {
        margin-bottom: 24px;
    }
`;

const SectionWrapper = styled.div`
    margin-bottom: 32px;
    
    @media (max-width: 768px) {
        margin-bottom: 24px;
    }
`;

const EnhancedHomePage = () => {
    // Fetch new products - chỉ lấy 6 sản phẩm mới nhất theo ngày tạo
    const { data: newProducts, isPending: isPendingNew } = useQuery({
        queryKey: ['new-products'],
        queryFn: () => ProductService.getNewProducts(6),
    });

    // Fetch best selling products
    const { data: bestSelling, isPending: isPendingBestSelling } = useQuery({
        queryKey: ['best-selling'],
        queryFn: () => ProductService.getBestSellingProducts(6),
    });

    // Fetch most favorite products
    const { data: mostFavorite, isPending: isPendingMostFavorite } = useQuery({
        queryKey: ['most-favorite'],
        queryFn: () => ProductService.getMostFavoriteProducts(6),
    });

    // Fetch categories - dùng chung cache với HomePage và Header
    const { data: categoriesData, isPending: isPendingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => CategoryService.getAllCategory(),
        staleTime: 30 * 60 * 1000, // Cache 30 phút
        cacheTime: 60 * 60 * 1000, // Giữ cache 1 giờ
        refetchOnMount: false, // Không refetch nếu đã có cache
    });

    // Fetch collections - dùng chung cache với HomePage và Header
    const { data: collectionsData } = useQuery({
        queryKey: ['collections'],
        queryFn: () => CollectionService.getAllCollection(),
        staleTime: 30 * 60 * 1000, // Cache 30 phút
        cacheTime: 60 * 60 * 1000, // Giữ cache 1 giờ
    });

    // Get flash sale products (products currently on sale)
    const { data: flashSaleProducts } = useQuery({
        queryKey: ['flash-sale-products'],
        queryFn: () => ProductService.getFlashSaleProducts(6),
        staleTime: 0, // Không cache để đảm bảo luôn có dữ liệu mới nhất
        cacheTime: 5 * 60 * 1000,
        refetchOnMount: true, // Refetch khi component mount
        refetchOnWindowFocus: true, // Refetch khi window focus
    });

    // Use Query states directly in sections instead of global blocker
    const categories = categoriesData?.data?.filter(cat => cat.isActive) || [];
    const collections = collectionsData?.data?.filter(col => col.isActive) || [];
    const newProds = newProducts?.data || [];
    const bestSellingProds = bestSelling?.data || [];
    const mostFavoriteProds = mostFavorite?.data || [];
    const flashSale = flashSaleProducts?.data || [];

    return (
        <WrapperHomePage>
            {/* Announcement Bar - Thanh thông báo chạy ngang */}
            <AnnouncementBar />

            {/* Banner/Slider - Hero Slider */}
            <BannerWrapper>
                <BannerSlider />
            </BannerWrapper>

            <WrapperContainer>
                {/* 1. Flash Sale */}
                {(flashSale.length > 0 || isPendingMostFavorite) && (
                    <SectionWrapper id="flash-sale" style={{ scrollMarginTop: '100px' }}>
                        <FlashSaleSection
                            products={flashSale}
                            isLoading={!flashSaleProducts && isPendingMostFavorite}
                        />
                    </SectionWrapper>
                )}

                {/* 2. Danh mục nổi bật - hiển thị ngay với skeleton nếu đang load */}
                <SectionWrapper id="featured-categories" style={{ scrollMarginTop: '100px' }}>
                    <FeaturedCategories
                        categories={categories}
                        isLoading={isPendingCategories && !categoriesData}
                    />
                </SectionWrapper>

                {/* 3. Sản phẩm mới */}
                <SectionWrapper id="new-products" style={{ scrollMarginTop: '100px' }}>
                    <ProductSection
                        title="Sản phẩm mới"
                        products={newProds}
                        isLoading={isPendingNew && !newProducts}
                        icon={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
                        viewAllPath="/product?new=true"
                        hideRating
                    />
                </SectionWrapper>

                {/* 4. S?n ph?m b?n ch?y */}
                <SectionWrapper id="best-selling" style={{ scrollMarginTop: '100px' }}>
                    <ProductSection
                        title="SẢN PHẨM BÁN CHẠY"
                        products={bestSellingProds}
                        isLoading={isPendingBestSelling && !bestSelling}
                        icon={<FireOutlined style={{ color: '#ff4d4f' }} />}
                        viewAllPath="/product?sort=selled"
                        titleSize="small"
                        preserveOrder
                        showSoldCount
                    />
                </SectionWrapper>

                {/* 5. Bộ sưu tập */}
                {collections.length > 0 && (
                    <SectionWrapper id="collections" style={{ scrollMarginTop: '100px' }}>
                        <CollectionsSection collections={collections.slice(0, 3)} />
                    </SectionWrapper>
                )}

                {/* 6. Banner mini */}
                <SectionWrapper>
                    <HomepageBanner />
                </SectionWrapper>

                {/* 7. S?n ph?m y?u th?ch */}
                <SectionWrapper id="most-favorite" style={{ marginBottom: 0, scrollMarginTop: '100px' }}>
                    <ProductSection
                        title="SẢN PHẨM YÊU THÍCH"
                        products={mostFavoriteProds}
                        isLoading={isPendingMostFavorite && !mostFavorite}
                        viewAllPath="/product?sort=rating"
                        titleSize="small"
                        showFavoriteTop
                    />
                </SectionWrapper>
            </WrapperContainer>
        </WrapperHomePage>
    );
};

export default EnhancedHomePage;


import HomePage from "../pages/HomePage/EnhancedHomePage";
import NotFoundPage from "../pages/NotFoundPage/NotFoundPage";
import OrderPage from "../pages/OrderPage/OrderPage";
import ProductDetailPage from "../pages/ProductDetailPage/ProductDetailPage";
import ProductPage from "../pages/ProductPage/ProductPage";
import SignUpPage from "../pages/Auth/SignUpPage";
import TypeProductPage from "../pages/TypeProductPage/TypeProductPage";
import SignInPage from '../pages/Auth/SignInPage'
import ProfilePage from "../pages/Profile/ProfilePage";
import AdminPage from "../pages/AdminPage/AdminPage";
import PaymentPage from "../pages/PaymentPage/PaymentPage";
import OrderSuccess from "../pages/OrderSuccess/OrderSuccess";
import MyOrderPage from "../pages/MyOrderPage/MyOrderPage";
import DetailsOrderPage from "../pages/DetailsOrderPage/DetailsOrderPage";
import WishlistPage from "../pages/WishlistPage/WishlistPage";
import MoMoReturnPage from "../pages/MoMoReturnPage/MoMoReturnPage";
import FlashSalePage from "../pages/FlashSalePage/FlashSalePage";
import CategoryDetailPage from "../pages/CategoryDetailPage/CategoryDetailPage";
import AllCategoriesPage from "../pages/AllCategoriesPage/AllCategoriesPage";
import CollectionDetailPage from "../pages/CollectionDetailPage/CollectionDetailPage";
import CollectionsPage from "../pages/CollectionsPage/CollectionsPage";
import AboutPage from "../pages/AboutPage/AboutPage";

export const routes = [
    {
        path: '/',
        page: HomePage,
        isShowHeader: true
    },
    {
        path: '/order',
        page: OrderPage,
        isShowHeader: true
    },
    {
        path: '/my-order',
        page: MyOrderPage,
        isShowHeader: true
    },
    {
        path: '/details-order/:id',
        page: DetailsOrderPage,
        isShowHeader: true
    },

    {
        path: '/payment',
        page: PaymentPage,
        isShowHeader: true
    },
    {
        path: '/orderSuccess',
        page: OrderSuccess,
        isShowHeader: true
    },
    {
        path: '/payment/momo/return',
        page: MoMoReturnPage,
        isShowHeader: false
    },
    {
        path: '/product',
        page: ProductPage,
        isShowHeader: true
    },
    {
        path: '/product/:type',
        page: TypeProductPage,
        isShowHeader: false
    },
    {
        path: '/sign-in',
        page: SignInPage,
        isShowHeader: false
    },
    {
        path: '/login',
        page: SignInPage,
        isShowHeader: false
    },
    {
        path: '/sign-up',
        page: SignUpPage,
        isShowHeader: false
    },
    {
        path: '/product-details/:id',
        page: ProductDetailPage,
        isShowHeader: true
    },
    {
        path: '/profile-user',
        page: ProfilePage,
        isShowHeader: true
    },
    {
        path: '/wishlist',
        page: WishlistPage,
        isShowHeader: true
    },
    {
        path: '/flash-sale',
        page: FlashSalePage,
        isShowHeader: true
    },
    {
        path: '/category/:id',
        page: CategoryDetailPage,
        isShowHeader: true
    },
    {
        path: '/categories',
        page: AllCategoriesPage,
        isShowHeader: true
    },
    {
        path: '/collections',
        page: CollectionsPage,
        isShowHeader: true
    },
    {
        path: '/about',
        page: AboutPage,
        isShowHeader: true
    },
    {
        path: '/collection/:slug',
        page: CollectionDetailPage,
        isShowHeader: true
    },
    {
        path: '/system/admin',
        page: AdminPage,
        isShowHeader: false,
        isPrivate: true
    },
    {
        path: '*',
        page: NotFoundPage
    },


]

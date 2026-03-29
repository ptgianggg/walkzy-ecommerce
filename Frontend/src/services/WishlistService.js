// Wishlist Service - manage wishlist persistence in localStorage
const WISHLIST_KEY_BASE = 'walkzy_wishlist';
const GUEST_KEY = `${WISHLIST_KEY_BASE}_guest`;

// Normalize legacy wishlist items (string productId) to the current object format
const normalizeWishlistItem = (item) => {
    if (typeof item === 'string') {
        return { productId: item, variation: null };
    }
    return item;
};

// Build a stable key for wishlist items (supports variations)
const buildWishlistKey = (productId, variation = null) => {
    if (!variation) return productId;
    const { color = '', size = '', material = '' } = variation;
    return `${productId}_${color}_${size}_${material}`;
};

const getStorageKey = (userId) => {
    if (!userId) return null; // if no userId, we treat wishlist as user-scoped only
    return `${WISHLIST_KEY_BASE}_${userId}`;
};

export const getWishlist = (userId) => {
    // If no userId, return empty -> do not expose guest/shared wishlist
    if (!userId) return [];

    try {
        const key = getStorageKey(userId);
        const wishlist = localStorage.getItem(key);
        if (!wishlist) return [];

        const parsed = JSON.parse(wishlist);
        return parsed.map(normalizeWishlistItem);
    } catch (error) {
        console.error('Error getting wishlist:', error);
        return [];
    }
};

// Get list of productId for quick lookup
export const getWishlistIds = (userId) => {
    const wishlist = getWishlist(userId);
    return wishlist.map((item) => item.productId || item);
};

export const addToWishlist = (productId, variation = null, userId = null) => {
    try {
        // If userId provided, write to user-scoped key; otherwise write to guest key
        const key = userId ? getStorageKey(userId) : GUEST_KEY;
        const raw = localStorage.getItem(key);
        const wishlist = raw ? JSON.parse(raw) : [];
        const wishlistKey = buildWishlistKey(productId, variation);

        const exists = wishlist.find((item) => buildWishlistKey(item.productId, item.variation) === wishlistKey);

        if (exists) {
            return { success: false, message: 'Sản phẩm đã có trong danh sách yêu thích' };
        }

        wishlist.push({ productId, variation });
        localStorage.setItem(key, JSON.stringify(wishlist));
        // Notify other windows/components that wishlist changed
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new Event('wishlist-updated'));
        }
        return { success: true, message: 'Đã thêm sản phẩm vào danh sách yêu thích' };
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return { success: false, message: 'Không thể thêm vào danh sách yêu thích, vui lòng thử lại sau' };
    }
};

export const removeFromWishlist = (productId, variation = null, userId = null) => {
    try {
        const key = userId ? getStorageKey(userId) : GUEST_KEY;
        const raw = localStorage.getItem(key);
        const current = raw ? JSON.parse(raw) : [];

        const wishlistKey = buildWishlistKey(productId, variation);
        const updatedWishlist = current.filter(
            (item) => buildWishlistKey(item.productId, item.variation) !== wishlistKey
        );

        localStorage.setItem(key, JSON.stringify(updatedWishlist));
        // Notify other windows/components that wishlist changed
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new Event('wishlist-updated'));
        }
        return { success: true, message: 'Đã xóa sản phẩm khỏi danh sách yêu thích' };
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return { success: false, message: 'Không thể xóa sản phẩm khỏi danh sách yêu thích, vui lòng thử lại sau' };
    }
};

export const isInWishlist = (productId, variation = null, userId = null) => {
    if (!userId) return false;
    const wishlistKey = buildWishlistKey(productId, variation);
    return getWishlist(userId).some((item) => buildWishlistKey(item.productId, item.variation) === wishlistKey);
};

export const clearWishlist = (userId = null) => {
    try {
        const key = userId ? getStorageKey(userId) : GUEST_KEY;
        localStorage.removeItem(key);
        // Notify other windows/components that wishlist changed
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new Event('wishlist-updated'));
        }
        return { success: true, message: 'Đã xóa toàn bộ danh sách yêu thích' };
    } catch (error) {
        console.error('Error clearing wishlist:', error);
        return { success: false, message: 'Không thể xóa danh sách yêu thích, vui lòng thử lại sau' };
    }
};

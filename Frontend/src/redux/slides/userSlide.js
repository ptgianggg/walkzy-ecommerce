import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  avatar: '',
  access_token: '',
  id: '',
  isAdmin: false,
  roleId: null, // Thêm roleId để lưu thông tin vai trò
  permissions: [], // Thêm permissions array để lưu danh sách quyền
  city: '',
  province: '',
  district: '',
  ward: '',
  latitude: null,
  longitude: null,
}

export const userSlide = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser: (state, action) => {
      const { 
        name = '', 
        email = '', 
        access_token = '', 
        address = '', 
        phone = '', 
        avatar = '', 
        _id = '', 
        isAdmin, 
        roleId = null, // Thêm roleId
        permissions = [], // Thêm permissions
        city = '',
        province = '',
        district = '',
        ward = '',
        latitude = null,
        longitude = null
      } = action.payload
      
      // Lấy permissions từ roleId nếu có
      let userPermissions = permissions || [];
      if (roleId && typeof roleId === 'object' && roleId.permissions) {
        userPermissions = roleId.permissions.map(p => p.code || `${p.module}.${p.action}`) || [];
      }
      
      // Cập nhật các field - giữ lại giá trị cũ cho các field quan trọng nếu giá trị mới là rỗng
      state.name = name || state.name;
      state.email = email || state.email;
      state.address = address; // Cho phép xóa địa chỉ
      state.phone = phone || state.phone;
      state.avatar = avatar || state.avatar;
      
      // QUAN TRỌNG: Những field này KHÔNG được ghi đè bằng giá trị rỗng
      // Chỉ cập nhật nếu có giá trị mới hợp lệ
      state.id = _id || state.id;
      state.access_token = access_token || state.access_token;
      state.isAdmin = isAdmin !== undefined ? isAdmin : state.isAdmin;
      state.roleId = roleId !== null ? roleId : state.roleId;
      state.permissions = userPermissions.length > 0 ? userPermissions : state.permissions;
      
      // Các field địa chỉ - cho phép cập nhật kể cả rỗng
      state.city = city;
      state.province = province;
      state.district = district;
      state.ward = ward;
      state.latitude = latitude;
      state.longitude = longitude;
    },
    resetUser: (state) => {
      state.name = '';
      state.email = '';
      state.address = '';
      state.phone = '';
      state.avatar = '';
      state.id = '';
      state.access_token = '';
      state.isAdmin = false;
      state.roleId = null; // Reset roleId
      state.permissions = []; // Reset permissions
      state.city = '';
      state.province = '';
      state.district = '';
      state.ward = '';
      state.latitude = null;
      state.longitude = null;
    },
  },
})

export const { updateUser, resetUser } = userSlide.actions
export default userSlide.reducer
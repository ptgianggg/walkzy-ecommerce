
const { response } = require('express')
const UserService = require('../services/UserService')
const JwtService = require('../services/JwtService')
const axios = require('axios')
const User = require('../models/UserModel')
const { generalAccesstoken, generalRefreshtoken } = require('../services/JwtService')

const createUser = async (req, res) => {

  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/


    const isCheckEmail = reg.test(email);
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The input is required',
      });
    } else if (!isCheckEmail) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The input is email'
      });
    } else if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The password is equal confirmPassword'
      });
    }
    const result = await UserService.createUser(req.body);

    return res.status(200).json(result)
  } catch (e) {
    console.error('Error in createUser:', e);
    return res.status(404).json({ message: e.message || e })
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    const isCheckEmail = reg.test(email);
    if (!email || !password) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The input is required',
      });
    } else if (!isCheckEmail) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The input is email',
      });
    }
    const result = await UserService.loginUser(req.body);
    const { refresh_token, ...newRsult } = result

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
      // Không set maxAge để cookie là session cookie (tự động xóa khi đóng browser)
    })
    return res.status(200).json({
      ...newRsult,
      refresh_token
    })
  } catch (e) {

    return res.status(404).json({
      message: e

    })
  }
}

const updateUser = async (req, res) => {

  try {
    const userId = req.params.id
    const data = req.body
    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The userId is required'
      })
    }

    const result = await UserService.updateUser(userId, data);

    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}

const deleteUser = async (req, res) => {

  try {
    const userId = req.params.id
    const currentUserId = req.user?.id

    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The userId is required'
      })
    }

    // Check if trying to delete self
    if (userId === currentUserId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Không thể xóa chính mình!'
      })
    }

    const result = await UserService.deleteUser(userId, currentUserId);

    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}


const deleteMany = async (req, res) => {

  try {
    const ids = req.body.ids
    const currentUserId = req.user?.id

    if (!ids) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The ids is required'
      })
    }

    const result = await UserService.deleteManyUser(ids, currentUserId);

    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}
const getAllUser = async (req, res) => {

  try {


    const result = await UserService.getAllUser();

    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}

const getDetailsUser = async (req, res) => {

  try {
    const userId = req.params.id

    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The userId is required'
      })
    }

    const result = await UserService.getDetailsUser(userId);

    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}
const refreshToken = async (req, res) => {
  console.log('refresh_token trong cookie:', req.cookies.refresh_token)

  try {
    // Lấy token từ body/header/cookie (ưu tiên body/header để hỗ trợ per-session refresh tokens từ FE)
    const tokenFromCookie = req.cookies.refresh_token
    const tokenFromBody = req.body?.refreshToken || req.body?.refresh_token
    const tokenFromHeader = req.headers['x-refresh-token'] || req.headers['refresh-token']
    // IMPORTANT: ưu tiên body/header trước cookie để tránh cookie của tab khác ghi đè
    const token = tokenFromBody || tokenFromHeader || tokenFromCookie

    // Nếu không có refresh-token -> FE chưa gửi cookie hoặc payload
    if (!token) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The token is required'
      })
    }

    // Verify refresh-token
    const result = await JwtService.refreshTokenJwtService(token)

    if (result.status !== 'OK') {
      return res.status(401).json(result)
    }

    // Trả access_token mới về FE
    return res.status(200).json(result)

  } catch (e) {
    console.log('Lỗi refresh token:', e)
    return res.status(500).json({
      status: 'ERR',
      message: 'Internal Server Error'
    })
  }
}
const logoutUser = async (req, res) => {
  try {
    res.clearCookie('refresh_token')
    return res.status(200).json({
      status: 'OK',
      message: 'Logout successfully'
    })
  } catch (e) {
    return res.status(404).json({
      message: e
    })
  }
}
const loginGoogle = async (req, res) => {
  const { token } = req.body; // đây là id_token từ frontend

  if (!token) {
    return res.status(400).json({ 
      status: 'ERR', 
      message: 'Token Google không được cung cấp' 
    });
  }

  try {
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const { sub: googleId, email, name, picture, email_verified } = response.data;

    if (!email_verified) {
      return res.status(400).json({ status: 'ERR', message: 'Email chưa được xác minh' });
    }

    if (!email || !googleId) {
      return res.status(400).json({ status: 'ERR', message: 'Thông tin từ Google không đầy đủ' });
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email }); // nếu đã đăng ký bằng email thường
    }

    if (!user) {
      // Tạo user mới
      user = await User.create({
        googleId,
        name: name || email.split('@')[0],
        email,
        avatar: picture,
        password: require('crypto').randomBytes(32).toString('hex'), // random password cho Google user
        isAdmin: false
      });
    } else {
      // Cập nhật googleId nếu chưa có (trường hợp đăng ký thường trước)
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
      }
    }

    const access_token = await generalAccesstoken({ id: user._id, isAdmin: user.isAdmin || false });
    const refresh_token = await generalRefreshtoken({ id: user._id, isAdmin: user.isAdmin || false });

    // Set refresh token cookie (giống login thường)
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      // Không set maxAge để cookie là session cookie (tự động xóa khi đóng browser)
    });


    return res.json({
      status: 'OK',
      access_token,
      refresh_token, // Bao gồm refresh_token trong response để frontend có thể lưu per-session
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.log('Google login error:', error.response?.data || error.message || error);
    
    // Xử lý các loại lỗi khác nhau
    if (error.response?.status === 400) {
      return res.status(400).json({
        status: 'ERR',
        message: 'Token Google không hợp lệ hoặc đã hết hạn'
      });
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(500).json({
        status: 'ERR',
        message: 'Không thể kết nối với Google. Vui lòng thử lại sau'
      });
    }

    return res.status(400).json({
      status: 'ERR',
      message: error.response?.data?.error_description || 'Đăng nhập Google thất bại. Vui lòng thử lại'
    });
  }
};
// Lock user
const lockUser = async (req, res) => {
  try {
    const userId = req.params.id
    const { lockReason } = req.body
    const currentUserId = req.user?.id
    
    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'User ID is required'
      })
    }
    const result = await UserService.lockUser(userId, lockReason, currentUserId)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({ message: e })
  }
}

// Unlock user
const unlockUser = async (req, res) => {
  try {
    const userId = req.params.id
    const currentUserId = req.user?.id
    
    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'User ID is required'
      })
    }
    const result = await UserService.unlockUser(userId, currentUserId)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({ message: e })
  }
}

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id
    const { role } = req.body
    const currentUserId = req.user?.id

    if (!userId || !role) {
      return res.status(400).json({
        status: 'ERR',
        message: 'User ID and role are required'
      })
    }
    const result = await UserService.updateUserRole(userId, role, currentUserId)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({ message: e })
  }
}

// Update user roleId (link to Role model)
const updateUserRoleId = async (req, res) => {
  try {
    const userId = req.params.id
    const { roleId } = req.body
    const currentUserId = req.user?.id

    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'User ID is required'
      })
    }
    const result = await UserService.updateUserRoleId(userId, roleId, currentUserId)
    const statusCode = result.status === 'OK' ? 200 : 400
    return res.status(statusCode).json(result)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || 'Lỗi server'
    })
  }
}

// Get user statistics
const getUserStatistics = async (req, res) => {
  try {
    const result = await UserService.getUserStatistics()
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({ message: e })
  }
}

// Get user order history
const getUserOrderHistory = async (req, res) => {
  try {
    const userId = req.params.id
    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'User ID is required'
      })
    }
    const result = await UserService.getUserOrderHistory(userId)
    return res.status(200).json(result)
  } catch (e) {
    return res.status(404).json({ message: e })
  }
}

// Get user permissions
const getUserPermissions = async (req, res) => {
  try {
    const userId = req.params.id
    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'User ID is required'
      })
    }
    const result = await UserService.getUserPermissions(userId)
    const statusCode = result.status === 'OK' ? 200 : 404
    return res.status(statusCode).json(result)
  } catch (e) {
    return res.status(500).json({
      status: 'ERR',
      message: e.message || 'Lỗi server'
    })
  }
}

module.exports = {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getAllUser,
  getDetailsUser,
  refreshToken,
  logoutUser,
  deleteMany,
  loginGoogle,
  lockUser,
  unlockUser,
  updateUserRole,
  updateUserRoleId,
  getUserStatistics,
  getUserOrderHistory,
  getUserPermissions
}

const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()


const authMiddleWare = (req, res, next) => {
  try {
    // Kiểm tra token có tồn tại không
    if (!req.headers.token) {
      console.log('❌ authMiddleWare: No token in headers for', req.path);
      return res.status(401).json({
        message: 'Token không tồn tại',
        status: 'ERROR'
      })
    }

    // Xử lý token có thể là "Bearer token" hoặc chỉ "token"
    let token
    if (req.headers.token.includes(' ')) {
      token = req.headers.token.split(' ')[1]
    } else {
      token = req.headers.token
    }
    
    // Kiểm tra token có đúng format không
    if (!token) {
      console.log('❌ authMiddleWare: Token is empty after split for', req.path);
      return res.status(401).json({
        message: 'Token không hợp lệ',
        status: 'ERROR'
      })
    }

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
      if (err) {
        console.log('❌ authMiddleWare: Token verification failed for', req.path, '- Error:', err.message);
        return res.status(401).json({
          message: 'Token không hợp lệ hoặc đã hết hạn',
          status: 'ERROR'
        })
      }
      if (user?.isAdmin) {
        console.log('✅ authMiddleWare: Admin authenticated for', req.path, '- User:', user.email || user.id);
        req.user = user
        next()
      } else {
        console.log('❌ authMiddleWare: User is not admin for', req.path, '- User:', user.email || user.id);
        return res.status(403).json({
          message: 'Bạn không có quyền truy cập',
          status: 'ERROR'
        })
      }
    });
  } catch (error) {
    console.log('❌ authMiddleWare: Exception for', req.path, '- Error:', error.message);
    return res.status(401).json({
      message: 'Lỗi xác thực: ' + error.message,
      status: 'ERROR'
    })
  }
}

const authUserMiddleWare = (req, res, next) => {
  try {
    // Kiểm tra token có tồn tại không
    if (!req.headers.token) {
      console.log('No token header found')
      return res.status(401).json({
        message: 'Token không tồn tại',
        status: 'ERROR'
      })
    }

    // Xử lý token có thể là "Bearer token" hoặc chỉ "token"
    let token
    if (req.headers.token.includes(' ')) {
      token = req.headers.token.split(' ')[1]
    } else {
      token = req.headers.token
    }
    
    // Kiểm tra token có đúng format không
    if (!token) {
      console.log('Token is empty after split')
      return res.status(401).json({
        message: 'Token không hợp lệ',
        status: 'ERROR'
      })
    }

    const userId = req.params.userId // only treat param named userId as a user identifier
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
      if (err) {
        // Chỉ log error nếu không phải expired token (để giảm noise)
        if (err.message !== 'jwt expired') {
          console.log('Token verification error:', err.message)
        }
        return res.status(401).json({
          message: 'Token không hợp lệ hoặc đã hết hạn',
          status: 'ERROR'
        })
      }
      
      // Set user vào request để controller sử dụng
      req.user = user
      
      // Nếu có userId trong params, kiểm tra quyền
      if (userId) {
        if (user?.isAdmin || user?.id === userId) {
          next()
        } else {
          return res.status(403).json({
            message: 'Bạn không có quyền truy cập',
            status: 'ERROR'
          })
        }
      } else {
        // Nếu không có userId trong params, chỉ cần verify token và set user
        next()
      }
    });
  } catch (error) {
    console.log('Auth middleware error:', error)
    return res.status(401).json({
      message: 'Lỗi xác thực: ' + error.message,
      status: 'ERROR'
    })
  }
}

// Optional auth middleware - lấy user nếu có token nhưng không bắt buộc
const optionalAuthMiddleware = (req, res, next) => {
  try {
    // Nếu không có token, tiếp tục mà không set req.user
    if (!req.headers.token) {
      return next();
    }

    // Xử lý token có thể là "Bearer token" hoặc chỉ "token"
    let token
    if (req.headers.token.includes(' ')) {
      token = req.headers.token.split(' ')[1]
    } else {
      token = req.headers.token
    }
    
    // Nếu token rỗng, tiếp tục
    if (!token) {
      return next();
    }

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
      // Nếu token không hợp lệ, vẫn tiếp tục (không bắt buộc)
      if (err) {
        return next();
      }
      
      // Set user vào request nếu token hợp lệ
      req.user = user;
      next();
    });
  } catch (error) {
    // Nếu có lỗi, vẫn tiếp tục (không bắt buộc)
    next();
  }
}

const authTokenMiddleWare = (req, res, next) => {
  try {
    if (!req.headers.token) {
      console.log('No token header found')
      return res.status(401).json({
        message: 'Token not found',
        status: 'ERROR'
      })
    }

    let token
    if (req.headers.token.includes(' ')) {
      token = req.headers.token.split(' ')[1]
    } else {
      token = req.headers.token
    }

    if (!token) {
      console.log('Token is empty after split')
      return res.status(401).json({
        message: 'Token is invalid',
        status: 'ERROR'
      })
    }

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
      if (err) {
        if (err.message !== 'jwt expired') {
          console.log('Token verification error:', err.message)
        }
        return res.status(401).json({
          message: 'Token is invalid or expired',
          status: 'ERROR'
        })
      }

      req.user = user
      next()
    })
  } catch (error) {
    console.log('Auth middleware error:', error)
    return res.status(401).json({
      message: 'Auth error: ' + error.message,
      status: 'ERROR'
    })
  }
}

module.exports = {
  authMiddleWare,
  authAdminMiddleWare: authMiddleWare, // Alias for consistency
  authUserMiddleWare,
  authTokenMiddleWare,
  optionalAuthMiddleware
}

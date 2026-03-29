const User = require('../models/UserModel')
const bcrypt = require('bcrypt')
const { generalAccesstoken, generalRefreshtoken } = require('./JwtService')


const createUser = (newUser) => {
    return new Promise(async (resolve, reject) => {
        const { name, email, password, confirmPassword, phone } = newUser
        try {
            const checkUser = await User.findOne({
                email: email
            })
            if (checkUser !== null) {
                resolve({
                    status: 'ERR',
                    message: 'The Email is already'
                })
            }
            const hash = bcrypt.hashSync(password, 10)
            const createUser = await User.create({
                name,
                email,
                password: hash,
                phone
            })
            if (createUser) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: createUser

                })

            }


        } catch (e) {
            reject(e)
        }
    })
}

const loginUser = (userLogin) => {
    return new Promise(async (resolve, reject) => {
        const { email, password } = userLogin
        try {
            // Lấy user trước (có password) để kiểm tra
            const checkUser = await User.findOne({
                email: email
            })
            
            if (checkUser === null) {
                resolve({
                    status: 'ERR',
                    message: 'The user is not defined'
                })
                return;
            }
            
            // Kiểm tra password trước
            const comparePassword = bcrypt.compareSync(password, checkUser.password)
            if (!comparePassword) {
                resolve({
                    status: 'ERR',
                    message: 'The password or user is incorrect',

                })
                return;
            }
            
            // Sau khi xác thực thành công, populate roleId và permissions
            const userWithRole = await User.findById(checkUser._id)
                .select('-password')
                .populate({
                    path: 'roleId',
                    select: 'name code permissions isActive',
                    populate: {
                        path: 'permissions',
                        select: 'code name module action isSensitive isActive'
                    }
                })
            
            // Tạo JWT token với roleId
            const tokenPayload = {
                id: userWithRole.id,
                isAdmin: userWithRole.isAdmin,
                roleId: userWithRole.roleId ? userWithRole.roleId._id.toString() : null
            }
            
            const access_token = await generalAccesstoken(tokenPayload)
            const refresh_token = await generalRefreshtoken(tokenPayload)

            // Trả về thông tin user kèm roleId và permissions
            const userInfo = {
                _id: userWithRole._id,
                name: userWithRole.name,
                email: userWithRole.email,
                isAdmin: userWithRole.isAdmin,
                role: userWithRole.role,
                roleId: userWithRole.roleId ? {
                    _id: userWithRole.roleId._id,
                    name: userWithRole.roleId.name,
                    code: userWithRole.roleId.code,
                    isActive: userWithRole.roleId.isActive,
                    permissions: (userWithRole.roleId.permissions || []).filter(p => p.isActive).map(p => ({
                        code: p.code,
                        name: p.name,
                        module: p.module,
                        action: p.action,
                        isSensitive: p.isSensitive
                    }))
                } : null
            }

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                access_token,
                refresh_token,
                data: userInfo

            })

        } catch (e) {
            reject(e)
        }
    })
}

const updateUser = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkUser = await User.findOne({
                _id: id
            })
            console.log('checkUser', checkUser)
            if (checkUser === null) {
                resolve({
                    status: 'OK',
                    message: 'The user is not defined'
                })

            }
            const updatedUser = await User.findByIdAndUpdate(id, data, { new: true })
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: updatedUser

            })

        } catch (e) {
            reject(e)
        }
    })
}
const deleteUser = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkUser = await User.findOne({
                _id: id
            })
            if (checkUser === null) {
                resolve({
                    status: 'OK',
                    message: 'The user is not defined'
                })

            }
            await User.findByIdAndDelete(id)
            resolve({
                status: 'OK',
                message: 'Delete user SUCCESS',

            })

        } catch (e) {
            reject(e)
        }
    })
}


const deleteManyUser = (ids, currentUserId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!ids || ids.length === 0) {
                resolve({
                    status: 'ERR',
                    message: 'Danh sách ID không được để trống'
                })
                return
            }

            // Get all users to check
            const usersToDelete = await User.find({ _id: { $in: ids } })
            
            // Filter out admin users and self
            const validIds = []
            const adminIds = []
            const selfId = []

            for (const user of usersToDelete) {
                // Check if trying to delete self
                if (user._id.toString() === currentUserId) {
                    selfId.push(user._id.toString())
                    continue
                }

                // Check if user is admin
                const isAdminUser = user.role === 'admin' || user.isAdmin === true
                if (isAdminUser) {
                    adminIds.push(user._id.toString())
                    continue
                }

                // Only customers can be deleted
                validIds.push(user._id.toString())
            }

            // If no valid users to delete
            if (validIds.length === 0) {
                let errorMessage = 'Không có người dùng hợp lệ để xóa. '
                if (adminIds.length > 0) {
                    errorMessage += `Không thể xóa ${adminIds.length} tài khoản admin. `
                }
                if (selfId.length > 0) {
                    errorMessage += 'Không thể xóa chính mình. '
                }
                errorMessage += 'Chỉ có thể xóa khách hàng.'

                resolve({
                    status: 'ERR',
                    message: errorMessage
                })
                return
            }

            // Delete only valid users
            await User.deleteMany({ _id: { $in: validIds } })
            
            let message = `Đã xóa ${validIds.length} người dùng thành công.`
            if (adminIds.length > 0 || selfId.length > 0) {
                message += ` (Đã bỏ qua ${adminIds.length + selfId.length} người dùng: `
                if (adminIds.length > 0) {
                    message += `${adminIds.length} admin`
                }
                if (selfId.length > 0) {
                    message += `${adminIds.length > 0 ? ', ' : ''}chính bạn`
                }
                message += ')'
            }

            resolve({
                status: 'OK',
                message: message,
                deletedCount: validIds.length,
                skippedCount: adminIds.length + selfId.length
            })

        } catch (e) {
            reject(e)
        }
    })
}
const getAllUser = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const Order = require('../models/OrderProduct')
            const allUser = await User.find()
                .select('-password')
                .populate({
                    path: 'roleId',
                    select: 'name code',
                    populate: {
                        path: 'permissions',
                        select: 'name code module action isSensitive'
                    }
                })
            
            // Tính toán totalOrders và totalSpent cho mỗi user từ orders
            const usersWithStats = await Promise.all(
                allUser.map(async (user) => {
                    try {
                        // Lấy tất cả orders của user
                        const orders = await Order.find({ user: user._id })
                        
                        // Chỉ tính các đơn đã thành công (delivered, completed, hoặc đã thanh toán và không bị hủy)
                        const successfulOrders = orders.filter(order => 
                            order.status === 'delivered' || 
                            order.status === 'completed' || 
                            (order.isPaid && order.status !== 'cancelled' && order.status !== 'refunded')
                        )
                        
                        const totalOrders = successfulOrders.length
                        const totalSpent = successfulOrders.reduce((sum, order) => {
                            return sum + (order.totalPrice || 0)
                        }, 0)
                        
                        // Trả về user với stats đã tính toán
                        return {
                            ...user.toObject(),
                            totalOrders,
                            totalSpent
                        }
                    } catch (error) {
                        // Nếu có lỗi, trả về user với giá trị mặc định
                        return {
                            ...user.toObject(),
                            totalOrders: user.totalOrders || 0,
                            totalSpent: user.totalSpent || 0
                        }
                    }
                })
            )
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: usersWithStats
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getDetailsUser = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await User.findOne({ _id: id })
                .select('-password')
                .populate({
                    path: 'roleId',
                    select: 'name code permissions',
                    populate: {
                        path: 'permissions',
                        select: 'name code module action isSensitive'
                    }
                })
            
            if (user === null) {
                resolve({
                    status: 'OK',
                    message: 'The user is not defined'
                })
            }
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: user
            })
        } catch (e) {
            reject(e)
        }
    })
}

// Lock/Unlock user
const lockUser = (id, lockReason, currentUserId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await User.findById(id)
            if (!user) {
                return resolve({
                    status: 'ERR',
                    message: 'User not found'
                })
            }

            // Không cho phép khóa chính mình
            if (id === currentUserId) {
                return resolve({
                    status: 'ERR',
                    message: 'Không thể khóa chính mình!'
                })
            }

            // Không cho phép khóa admin
            const isAdminUser = user.role === 'admin' || user.isAdmin === true
            if (isAdminUser) {
                return resolve({
                    status: 'ERR',
                    message: 'Không thể khóa tài khoản admin!'
                })
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                {
                    isLocked: true,
                    lockedAt: new Date(),
                    lockReason: lockReason || 'Tài khoản bị khóa bởi admin'
                },
                { new: true }
            ).select('-password')
            resolve({
                status: 'OK',
                message: 'Khóa tài khoản thành công',
                data: updatedUser
            })
        } catch (e) {
            reject(e)
        }
    })
}

const unlockUser = (id, currentUserId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await User.findById(id)
            if (!user) {
                return resolve({
                    status: 'ERR',
                    message: 'User not found'
                })
            }

            // Không cho phép tự mở khóa chính mình
            if (id === currentUserId) {
                return resolve({
                    status: 'ERR',
                    message: 'Không thể tự mở khóa chính mình!'
                })
            }

            // Không cho phép mở khóa admin (chỉ admin khác mới có thể mở)
            const isAdminUser = user.role === 'admin' || user.isAdmin === true
            if (isAdminUser) {
                return resolve({
                    status: 'ERR',
                    message: 'Không thể mở khóa tài khoản admin!'
                })
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                {
                    isLocked: false,
                    lockedAt: null,
                    lockReason: null
                },
                { new: true }
            ).select('-password')
            resolve({
                status: 'OK',
                message: 'Mở khóa tài khoản thành công',
                data: updatedUser
            })
        } catch (e) {
            reject(e)
        }
    })
}

// Update user role
const updateUserRole = (id, role, currentUserId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const validRoles = ['customer', 'admin', 'manager', 'sale_staff', 'shipper']
            if (!validRoles.includes(role)) {
                return resolve({
                    status: 'ERR',
                    message: 'Role không hợp lệ'
                })
            }
            const user = await User.findById(id)
            if (!user) {
                return resolve({
                    status: 'ERR',
                    message: 'User not found'
                })
            }

            // Check if trying to change own role
            if (id === currentUserId) {
                const isAdminUser = user.role === 'admin' || user.isAdmin === true
                // Admin không được tự thay đổi quyền của chính mình (kể cả giữ nguyên admin)
                if (isAdminUser) {
                    return resolve({
                        status: 'ERR',
                        message: 'Không thể tự thay đổi quyền của chính mình! Bạn đang là quản trị viên, không thể thay đổi vai trò.'
                    })
                }
            }

            // Khi cập nhật role cơ bản, clear roleId để tránh conflict
            const updatedUser = await User.findByIdAndUpdate(
                id,
                { 
                    role, 
                    isAdmin: role === 'admin',
                    roleId: null // Clear roleId khi dùng role cơ bản
                },
                { new: true }
            ).select('-password')
            resolve({
                status: 'OK',
                message: 'Cập nhật role thành công',
                data: updatedUser
            })
        } catch (e) {
            reject(e)
        }
    })
}

// Update user roleId (link to Role model)
const updateUserRoleId = (id, roleId, currentUserId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const Role = require('../models/RoleModel');
            
            // Validate roleId exists
            if (roleId) {
                const role = await Role.findById(roleId);
                if (!role) {
                    return resolve({
                        status: 'ERR',
                        message: 'Vai trò không tồn tại'
                    });
                }
            }

            const user = await User.findById(id);
            if (!user) {
                return resolve({
                    status: 'ERR',
                    message: 'User not found'
                });
            }

            // Check if trying to change own role
            if (id === currentUserId) {
                const isAdminUser = user.role === 'admin' || user.isAdmin === true;
                // Kiểm tra nếu user hiện tại có roleId và là Super Admin
                let isSuperAdmin = false;
                if (user.roleId) {
                    const currentRole = await Role.findById(user.roleId);
                    if (currentRole && currentRole.code === 'SUPER_ADMIN') {
                        isSuperAdmin = true;
                    }
                }
                
                // Super Admin không được thay đổi role của chính mình
                if (isSuperAdmin) {
                    return resolve({
                        status: 'ERR',
                        message: 'Super Admin không thể tự thay đổi quyền của chính mình!'
                    });
                }
                
                // Admin không được tự thay đổi quyền của chính mình (kể cả giữ nguyên admin)
                if (isAdminUser) {
                    return resolve({
                        status: 'ERR',
                        message: 'Không thể tự thay đổi quyền của chính mình! Bạn đang là quản trị viên, không thể thay đổi vai trò.'
                    });
                }
            }

            // Khi cập nhật roleId, set role về customer để tránh conflict
            // (roleId sẽ được ưu tiên sử dụng)
            const updatedUser = await User.findByIdAndUpdate(
                id,
                { 
                    roleId: roleId || null,
                    role: roleId ? 'customer' : user.role // Giữ nguyên role nếu clear roleId
                },
                { new: true }
            )
            .select('-password')
            .populate('roleId', 'name code');

            resolve({
                status: 'OK',
                message: 'Cập nhật vai trò thành công',
                data: updatedUser
            });
        } catch (e) {
            reject(e);
        }
    });
};

// Get user statistics
const getUserStatistics = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const Order = require('../models/OrderProduct')
            
            // Calculate top buyers from actual orders
            // Only count orders that are delivered and paid successfully
            const topBuyersAggregation = await Order.aggregate([
                {
                    $match: {
                        status: { $in: ['delivered', 'completed'] },
                        isPaid: true,
                        isDelivered: true
                    }
                },
                {
                    $group: {
                        _id: '$user',
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: '$totalPrice' }
                    }
                },
                {
                    $sort: { totalSpent: -1 }
                },
                {
                    $limit: 10
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                },
                {
                    $unwind: {
                        path: '$userInfo',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: '$_id',
                        name: { $ifNull: ['$userInfo.name', 'N/A'] },
                        email: { $ifNull: ['$userInfo.email', 'N/A'] },
                        totalOrders: 1,
                        totalSpent: 1
                    }
                }
            ])
            
            // New users this week
            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
            const newUsersThisWeek = await User.countDocuments({
                createdAt: { $gte: oneWeekAgo }
            })
            
            // New users this month
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
            const newUsersThisMonth = await User.countDocuments({
                createdAt: { $gte: oneMonthAgo }
            })
            
            // Total users
            const totalUsers = await User.countDocuments()
            
            // Locked users
            const lockedUsers = await User.countDocuments({ isLocked: true })
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    topBuyers: topBuyersAggregation,
                    newUsersThisWeek,
                    newUsersThisMonth,
                    totalUsers,
                    lockedUsers
                }
            })
        } catch (e) {
            reject(e)
        }
    })
}

// Get user order history
const getUserOrderHistory = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const Order = require('../models/OrderProduct')
            const orders = await Order.find({ user: userId })
                .sort({ createdAt: -1 })
                .populate('orderItems.product', 'name image')
            
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: orders
            })
        } catch (e) {
            reject(e)
        }
    })
}

// Get user permissions (from role)
const getUserPermissions = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await User.findById(userId)
                .populate({
                    path: 'roleId',
                    populate: {
                        path: 'permissions',
                        select: 'name code module action isSensitive description'
                    }
                })
                .select('-password')

            if (!user) {
                return resolve({
                    status: 'ERR',
                    message: 'User not found'
                })
            }

            // Super admin có tất cả quyền
            if (user.isAdmin) {
                return resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: {
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            isAdmin: true
                        },
                        role: null,
                        permissions: [],
                        isSuperAdmin: true
                    }
                })
            }

            // Lấy permissions từ role
            const role = user.roleId
            const permissions = role ? (role.permissions || []) : []

            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        isAdmin: user.isAdmin
                    },
                    role: role ? {
                        id: role._id,
                        name: role.name,
                        code: role.code
                    } : null,
                    permissions: permissions.map(p => ({
                        id: p._id,
                        name: p.name,
                        code: p.code,
                        module: p.module,
                        action: p.action,
                        isSensitive: p.isSensitive,
                        description: p.description
                    })),
                    isSuperAdmin: false
                }
            })
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUser,
    getDetailsUser,
    deleteManyUser,
    lockUser,
    unlockUser,
    updateUserRole,
    updateUserRoleId,
    getUserStatistics,
    getUserOrderHistory,
    getUserPermissions
}
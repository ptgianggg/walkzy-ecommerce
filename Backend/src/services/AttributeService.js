const mongoose = require('mongoose')
const Attribute = require('../models/AttributeModel')

const normalizeCategories = (input) => {
  if (!input) return []
  if (Array.isArray(input)) return input.filter(Boolean)
  return [input].filter(Boolean)
}

const globalQueryConditions = [
  { categories: { $exists: false } },
  { categories: { $size: 0 } },
  { category: { $exists: false } },
  { category: null }
]

const createAttribute = (newAttribute) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { name, type, value, hexCode, image, order } = newAttribute
      const categories = normalizeCategories(newAttribute.categories ?? newAttribute.category)

      const existing = await Attribute.findOne({ type, value })
      if (existing) {
        resolve({
          status: 'ERR',
          message: `${type === 'color' ? 'Màu' : type === 'size' ? 'Size' : 'Chất liệu'} "${value}" đã tồn tại`
        })
        return
      }

      const attribute = await Attribute.create({
        name: name || value,
        type,
        value,
        hexCode,
        image,
        order: order || 0,
        categories
      })

      resolve({
        status: 'OK',
        message: 'SUCCESS',
        data: attribute
      })
    } catch (e) {
      reject(e)
    }
  })
}

const updateAttribute = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const current = await Attribute.findById(id)
      if (!current) {
        resolve({
          status: 'ERR',
          message: 'Thuộc tính không tồn tại'
        })
        return
      }

      if (data.type || data.value) {
        const exists = await Attribute.findOne({
          type: data.type || current.type,
          value: data.value || current.value,
          _id: { $ne: id }
        })
        if (exists) {
          resolve({
            status: 'ERR',
            message: 'Thuộc tính đã tồn tại'
          })
          return
        }
      }

      if (data.categories !== undefined || data.category !== undefined) {
        data.categories = normalizeCategories(data.categories ?? data.category)
        delete data.category
      }

      const updated = await Attribute.findByIdAndUpdate(id, data, { new: true })
      resolve({
        status: 'OK',
        message: 'SUCCESS',
        data: updated
      })
    } catch (e) {
      reject(e)
    }
  })
}

const deleteAttribute = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const current = await Attribute.findById(id)
      if (!current) {
        resolve({
          status: 'ERR',
          message: 'Thuộc tính không tồn tại'
        })
        return
      }

      await Attribute.findByIdAndDelete(id)
      resolve({
        status: 'OK',
        message: 'Xoá thuộc tính thành công'
      })
    } catch (e) {
      reject(e)
    }
  })
}

const getAllAttribute = (type = null, categoryId = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = { isActive: true }
      if (type) query.type = type

      if (categoryId) {
        const casted = mongoose.Types.ObjectId.isValid(categoryId) ? new mongoose.Types.ObjectId(categoryId) : null
        query.$or = [{ categories: casted }, ...globalQueryConditions]
      } else if (categoryId === '') {
        query.$or = [...globalQueryConditions]
      }

      const attributes = await Attribute.find(query)
        .populate('categories', 'name slug')
        .sort({ order: 1, value: 1 })

      resolve({
        status: 'OK',
        message: 'SUCCESS',
        data: attributes
      })
    } catch (e) {
      reject(e)
    }
  })
}

const getDetailAttribute = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const attribute = await Attribute.findById(id).populate('categories', 'name slug')
      if (!attribute) {
        resolve({
          status: 'ERR',
          message: 'Thuộc tính không tồn tại'
        })
        return
      }

      resolve({
        status: 'OK',
        message: 'SUCCESS',
        data: attribute
      })
    } catch (e) {
      reject(e)
    }
  })
}

const deleteManyAttribute = (ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Attribute.deleteMany({ _id: { $in: ids } })
      resolve({
        status: 'OK',
        message: 'Xoá thuộc tính thành công'
      })
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = {
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getAllAttribute,
  getDetailAttribute,
  deleteManyAttribute
}

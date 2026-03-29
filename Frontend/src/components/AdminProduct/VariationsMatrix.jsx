import React, { useEffect, useState } from 'react'
import { Table, InputNumber, Input, Button, Upload, Space, Tag } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { getBase64 } from '../../utils'
import { WrapperUploadFile } from './style'

const VariationsMatrix = ({
  selectedColors = [],
  selectedSizes = [],
  selectedMaterials = [],
  basePrice = 0,
  baseSKU = '',
  variations = [],
  onChange,
  colorsData = null
}) => {
  const [matrixData, setMatrixData] = useState([])
  const materialSignature = selectedMaterials
    .map((m) => (typeof m === 'string' ? m : m?.value || m?._id || ''))
    .join('|')

  // Tự động sinh ma trận biến thể khi colors/sizes thay đổi
  useEffect(() => {
    if (selectedColors.length > 0 || selectedSizes.length > 0 || selectedMaterials.length > 0) {
      generateMatrix()
    } else if (selectedColors.length === 0 && selectedSizes.length === 0 && selectedMaterials.length === 0) {
      // Nếu không có màu/size nào được chọn, xóa ma trận
      setMatrixData([])
      onChange([])
    }
  }, [selectedColors.length, selectedSizes.length, selectedMaterials.length, basePrice, baseSKU, materialSignature])

  // Khởi tạo từ variations có sẵn
  useEffect(() => {
    if (variations && variations.length > 0 && matrixData.length === 0) {
      setMatrixData(variations)
      onChange(variations)
    }
  }, [variations])

  const generateMatrix = () => {
    const newMatrix = []

    // Lấy giá trị từ selectedColors, selectedSizes (có thể là object từ API hoặc object đơn giản)
    const colors = selectedColors.map(c => {
      if (typeof c === 'string') return { value: c }
      // Nếu là object từ API (có _id và value)
      if (c._id && !c.value) {
        // Tìm trong colorsData để lấy value
        const colorData = colorsData?.data?.find(col => col._id === c._id)
        return { value: colorData?.value || c._id, _id: c._id, hexCode: colorData?.hexCode, image: colorData?.image }
      }
      return c.value ? c : { value: c._id || c }
    })

    const sizes = selectedSizes.map(s => {
      if (typeof s === 'string') return { value: s }
      if (s._id && !s.value) {
        // Tìm trong sizesData nếu có
        return { value: s._id, _id: s._id }
      }
      return s.value ? s : { value: s._id || s }
    })

    const materials = selectedMaterials.map((m) => {
      if (typeof m === 'string') return { value: m }
      const normalized = {
        value: m?.value || m?._id || '',
        _id: m?._id
      }
      return normalized
    })

    const resolveMaterialValue = () => {
      if (!materials.length) return ''
      return materials[0].value || ''
    }

    // Nếu có cả màu và size
    if (colors.length > 0 && sizes.length > 0) {
      colors.forEach((color) => {
        sizes.forEach((size) => {
          const colorValue = color.value || color
          const sizeValue = size.value || size

          // Kiểm tra xem variation này đã tồn tại chưa
          const targetMaterial = resolveMaterialValue()
          const existing = matrixData.find(
            v => v.color === colorValue && v.size === sizeValue
          )

          if (existing) {
            if ((existing.material || '') !== targetMaterial) {
              existing.material = targetMaterial
            }
            newMatrix.push(existing)
          } else {
            // Tạo SKU tự động với timestamp + random string để đảm bảo unique
            const colorStr = String(colorValue).toUpperCase().replace(/\s+/g, '').substring(0, 3)
            const timestamp = Date.now().toString().slice(-6) // Lấy 6 số cuối của timestamp
            const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase() // Random 4 ký tự
            const sku = baseSKU
              ? `${baseSKU}-${colorStr}-${sizeValue}-${timestamp}-${randomStr}`
              : `SKU-${colorStr}-${sizeValue}-${timestamp}-${randomStr}`

            newMatrix.push({
              color: colorValue,
              size: sizeValue,
              material: targetMaterial,
              sku: sku,
              stock: 0,
              price: basePrice || null,
              image: color.image || '',
              isActive: true
            })
          }
        })
      })
    }
    // Chỉ có màu
    else if (colors.length > 0) {
      colors.forEach((color) => {
        const colorValue = color.value || color
        const targetMaterial = resolveMaterialValue()
        const existing = matrixData.find(v => v.color === colorValue && !v.size)
        if (existing) {
          if ((existing.material || '') !== targetMaterial) {
            existing.material = targetMaterial
          }
          newMatrix.push(existing)
        } else {
          const colorStr = String(colorValue).toUpperCase().replace(/\s+/g, '').substring(0, 3)
          const timestamp = Date.now().toString().slice(-6)
          const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
          const sku = baseSKU
            ? `${baseSKU}-${colorStr}-${timestamp}-${randomStr}`
            : `SKU-${colorStr}-${timestamp}-${randomStr}`

          newMatrix.push({
            color: colorValue,
            size: '',
            material: targetMaterial,
            sku: sku,
            stock: 0,
            price: basePrice || null,
            image: color.image || '',
            isActive: true
          })
        }
      })
    }
    // Chỉ có size
    else if (sizes.length > 0) {
      sizes.forEach((size) => {
        const sizeValue = size.value || size
        const targetMaterial = resolveMaterialValue()
        const existing = matrixData.find(v => v.size === sizeValue && !v.color)
        if (existing) {
          if ((existing.material || '') !== targetMaterial) {
            existing.material = targetMaterial
          }
          newMatrix.push(existing)
        } else {
          const timestamp = Date.now().toString().slice(-6)
          const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
          const sku = baseSKU
            ? `${baseSKU}-${sizeValue}-${timestamp}-${randomStr}`
            : `SKU-${sizeValue}-${timestamp}-${randomStr}`

          newMatrix.push({
            color: '',
            size: sizeValue,
            material: targetMaterial,
            sku: sku,
            stock: 0,
            price: basePrice || null,
            image: '',
            isActive: true
          })
        }
      })
    }
    // Chỉ có chất liệu
    else if (materials.length > 0) {
      materials.forEach((material) => {
        const materialValue = material.value || material
        const existing = matrixData.find(v => v.material === materialValue && !v.color && !v.size)
        if (existing) {
          newMatrix.push(existing)
        } else {
          const materialStr = String(materialValue).toUpperCase().replace(/\s+/g, '').substring(0, 3)
          const timestamp = Date.now().toString().slice(-6)
          const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
          const sku = baseSKU
            ? `${baseSKU}-${materialStr}-${timestamp}-${randomStr}`
            : `SKU-${materialStr}-${timestamp}-${randomStr}`

          newMatrix.push({
            color: '',
            size: '',
            material: materialValue,
            sku: sku,
            stock: 0,
            price: basePrice || null,
            image: material.image || '',
            isActive: true
          })
        }
      })
    }

    setMatrixData(newMatrix)
    onChange(newMatrix)
  }

  const handleChange = (index, field, value) => {
    const newData = [...matrixData]
    newData[index][field] = value
    setMatrixData(newData)
    onChange(newData)
  }

  const handleImageChange = async (index, { fileList }) => {
    const file = fileList[0]
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj)
    }
    handleChange(index, 'image', file.preview || file.url)
  }

  const handleDelete = (index) => {
    const newData = matrixData.filter((_, i) => i !== index)
    setMatrixData(newData)
    onChange(newData)
  }

  const columns = [
    {
      title: 'Màu',
      dataIndex: 'color',
      render: (text, record, index) => {
        if (!text) return '-'
        // Tìm color object từ selectedColors hoặc từ API
        const colorObj = selectedColors.find(c => {
          const cValue = c.value || c._id || c
          return cValue === text || c === text
        })
        // Nếu không tìm thấy trong selectedColors, tìm trong colorsData
        const colorFromData = colorsData?.data?.find(c => c.value === text || c._id === text)
        const hexCode = colorObj?.hexCode || colorFromData?.hexCode

        return (
          <Space>
            {hexCode && (
              <div style={{
                width: 20,
                height: 20,
                backgroundColor: hexCode,
                border: '1px solid #ddd',
                borderRadius: 4
              }} />
            )}
            <span>{text}</span>
          </Space>
        )
      }
    },
    {
      title: 'Size',
      dataIndex: 'size',
      render: (text) => text || '-'
    },
    {
      title: 'Chất liệu',
      dataIndex: 'material',
      render: (text) => text || '-'
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => handleChange(index, 'sku', e.target.value)}
          placeholder="Mã SKU"
          style={{ width: '150px' }}
        />
      )
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      render: (text, record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => handleChange(index, 'price', value)}
          min={0}
          style={{ width: '150px' }}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          placeholder="Để trống = giá gốc"
        />
      )
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      render: (text, record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => handleChange(index, 'stock', value)}
          min={0}
          style={{ width: '120px' }}
        />
      )
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      render: (text, record, index) => (
        <WrapperUploadFile
          onChange={(fileList) => handleImageChange(index, fileList)}
          maxCount={1}
        >
          <Button size="small">Upload</Button>
          {text && (
            <img
              src={text}
              style={{
                height: '40px',
                width: '40px',
                objectFit: 'cover',
                marginLeft: '8px',
                borderRadius: 4
              }}
              alt="variation"
            />
          )}
        </WrapperUploadFile>
      )
    },
    {
      title: 'Hành động',
      render: (_, record, index) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          size="small"
          onClick={() => handleDelete(index)}
        />
      )
    }
  ]

  if (matrixData.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        Vui lòng chọn Màu và/hoặc Size để tự động tạo ma trận biến thể
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Tổng tồn kho: </strong>
          <Tag color="blue" style={{ fontSize: '16px' }}>
            {matrixData.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}
          </Tag>
        </div>
        <div>
          <strong>Số biến thể: </strong>
          <Tag color="green">{matrixData.length}</Tag>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={matrixData}
        rowKey="sku"
        pagination={false}
        scroll={{ x: 1000 }}
      />
    </div>
  )
}

export default VariationsMatrix

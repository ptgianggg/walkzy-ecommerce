import React, { useState, useEffect, useCallback } from 'react'
import { Select, Input, Row, Col } from 'antd'
import { EnvironmentOutlined, HomeOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import InlineMapPicker from '../InlineMapPicker/InlineMapPicker'

const { Option } = Select
const { TextArea } = Input

const WrapperAddressPicker = styled.div`
  .address-section {
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 12px;
    border: 1px solid #e8e8e8;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e8e8e8;

    .anticon {
      font-size: 18px;
      color: #1a94ff;
    }
  }

  .select-row {
    margin-bottom: 16px;
  }

  .ant-select {
    .ant-select-selector {
      height: 44px !important;
      border-radius: 8px !important;
      border: 1.5px solid #d9d9d9 !important;
      transition: all 0.3s ease !important;
      font-size: 14px !important;

      &:hover {
        border-color: #1a94ff !important;
      }
    }

    &.ant-select-focused .ant-select-selector {
      border-color: #1a94ff !important;
      box-shadow: 0 0 0 3px rgba(26, 148, 255, 0.1) !important;
    }

    .ant-select-selection-item {
      line-height: 42px !important;
      font-weight: 500;
    }

    .ant-select-selection-placeholder {
      line-height: 42px !important;
      color: #999;
    }
  }

  .ant-select-disabled {
    .ant-select-selector {
      background-color: #f5f5f5 !important;
      border-color: #e8e8e8 !important;
      cursor: not-allowed !important;
    }
  }

  .address-detail-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e8e8e8;
  }

  .address-detail-label {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;

    .anticon {
      color: #1a94ff;
    }
  }

  .ant-input {
    border-radius: 8px;
    border: 1.5px solid #d9d9d9;
    transition: all 0.3s ease;
    font-size: 14px;

    &:hover {
      border-color: #1a94ff;
    }

    &:focus {
      border-color: #1a94ff;
      box-shadow: 0 0 0 3px rgba(26, 148, 255, 0.1);
    }
  }

  .ant-input:focus,
  .ant-input-focused {
    border-color: #1a94ff;
    box-shadow: 0 0 0 3px rgba(26, 148, 255, 0.1);
  }

  .helper-text {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .address-section {
      padding: 16px;
    }

    .section-title {
      font-size: 14px;
    }
  }
`


const AddressPicker = ({ value, onChange, form }) => {
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [addressDetail, setAddressDetail] = useState('')

  const isInitializingRef = React.useRef(false)
  const initializedRef = React.useRef(false)

  // Load provinces from API
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('https://provinces.open-api.vn/api/p/', {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data) {
          let provincesData = []
          if (Array.isArray(data)) {
            provincesData = data
          } else if (data.data && Array.isArray(data.data)) {
            provincesData = data.data
          } else if (typeof data === 'object') {
            provincesData = Object.values(data).filter(item =>
              item && typeof item === 'object' && item.code
            )
          }

          if (provincesData.length > 0) {
            setProvinces(provincesData)
          }
        }
      } catch (error) {
        console.error('Error fetching provinces:', error)
        try {
          const proxyResponse = await fetch(
            `https://api.allorigins.win/get?url=${encodeURIComponent('https://provinces.open-api.vn/api/p/')}`
          )
          const proxyData = await proxyResponse.json()
          const data = JSON.parse(proxyData.contents)

          if (Array.isArray(data)) {
            setProvinces(data)
          }
        } catch (proxyError) {
          console.error('Proxy also failed:', proxyError)
        }
      }
    }
    fetchProvinces()
  }, [])

  // Load districts when province is selected
  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        try {
          const provinceCode = parseInt(selectedProvince)
          const response = await fetch(
            `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`,
            {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            }
          )

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()

          if (data) {
            let districtsData = []
            if (data.districts && Array.isArray(data.districts)) {
              districtsData = data.districts
            } else if (Array.isArray(data)) {
              districtsData = data
            } else if (data.data && Array.isArray(data.data)) {
              districtsData = data.data
            }

            if (districtsData.length > 0) {
              setDistricts(districtsData)
            } else {
              setDistricts([])
            }
          } else {
            setDistricts([])
          }

          setWards([])
          setSelectedDistrict('')
          setSelectedWard('')



        } catch (error) {
          console.error('Error fetching districts:', error)
          try {
            const provinceCode = parseInt(selectedProvince)
            const proxyResponse = await fetch(
              `https://api.allorigins.win/get?url=${encodeURIComponent(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)}`
            )
            const proxyData = await proxyResponse.json()
            const data = JSON.parse(proxyData.contents)

            if (data && data.districts && Array.isArray(data.districts)) {
              setDistricts(data.districts)
            }
          } catch (proxyError) {
            console.error('Proxy also failed:', proxyError)
            setDistricts([])
          }
        }
      }
      fetchDistricts()
    } else {
      setDistricts([])
      setWards([])
    }
  }, [selectedProvince])

  // Load wards when district is selected
  useEffect(() => {
    if (selectedDistrict) {
      const fetchWards = async () => {
        try {
          const districtCode = parseInt(selectedDistrict)
          const response = await fetch(
            `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
            {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            }
          )

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()

          if (data) {
            let wardsData = []
            if (data.wards && Array.isArray(data.wards)) {
              wardsData = data.wards
            } else if (Array.isArray(data)) {
              wardsData = data
            } else if (data.data && Array.isArray(data.data)) {
              wardsData = data.data
            }

            if (wardsData.length > 0) {
              setWards(wardsData)
            } else {
              setWards([])
            }
          } else {
            setWards([])
          }

          setSelectedWard('')


        } catch (error) {
          console.error('Error fetching wards:', error)
          try {
            const districtCode = parseInt(selectedDistrict)
            const proxyResponse = await fetch(
              `https://api.allorigins.win/get?url=${encodeURIComponent(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)}`
            )
            const proxyData = await proxyResponse.json()
            const data = JSON.parse(proxyData.contents)

            if (data && data.wards && Array.isArray(data.wards)) {
              setWards(data.wards)
            }
          } catch (proxyError) {
            console.error('Proxy also failed:', proxyError)
            setWards([])
          }
        }
      }
      fetchWards()
    } else {
      setWards([])
    }
  }, [selectedDistrict])

  // Update address value
  const updateAddressValue = useCallback((skipAddressUpdate = false) => {
    // Don't call onChange during initialization
    if (isInitializingRef.current) {
      return
    }

    const provinceName = provinces.find((p) => p.code.toString() === selectedProvince)?.name || ''
    const districtName = districts.find((d) => d.code.toString() === selectedDistrict)?.name || ''
    const wardName = wards.find((w) => w.code.toString() === selectedWard)?.name || ''

    // Tạo fullAddress: luôn bao gồm addressDetail nếu có, sau đó là ward, district, province
    // Nếu chưa có addressDetail, chỉ tạo địa chỉ từ tỉnh/huyện/xã
    const fullAddress = [addressDetail, wardName, districtName, provinceName]
      .filter(Boolean)
      .join(', ')

    const city = provinceName || selectedProvince

    if (onChange) {
      // Nếu skipAddressUpdate = true (khi chỉ chọn tỉnh/huyện/xã), không update address
      // Chỉ update các field riêng lẻ
      onChange({
        address: skipAddressUpdate ? undefined : fullAddress, // undefined sẽ không update field này
        city: city,
        province: provinceName,
        district: districtName,
        ward: wardName
      })
    }

    // Không tự động set vào form để tránh conflict
    // Form sẽ được update thông qua onChange callback
  }, [addressDetail, selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards, onChange])

  // Track previous values to prevent unnecessary updates
  const prevValuesRef = React.useRef({ selectedProvince, selectedDistrict, selectedWard, addressDetail })

  useEffect(() => {
    // Don't update if we're still initializing
    if (isInitializingRef.current || !initializedRef.current) {
      return
    }

    const prev = prevValuesRef.current
    const hasChanged =
      prev.selectedProvince !== selectedProvince ||
      prev.selectedDistrict !== selectedDistrict ||
      prev.selectedWard !== selectedWard ||
      prev.addressDetail !== addressDetail

    if (hasChanged) {
      // Kiểm tra xem có phải chỉ thay đổi location (tỉnh/huyện/xã) mà không thay đổi addressDetail không
      const isOnlyLocationChange =
        (prev.selectedProvince !== selectedProvince ||
          prev.selectedDistrict !== selectedDistrict ||
          prev.selectedWard !== selectedWard) &&
        prev.addressDetail === addressDetail

      const timer = setTimeout(() => {
        // Nếu chỉ thay đổi location mà không có addressDetail, skip update address
        // Điều này ngăn việc tự động điền vào ô địa chỉ chi tiết
        updateAddressValue(isOnlyLocationChange && !addressDetail)
        prevValuesRef.current = { selectedProvince, selectedDistrict, selectedWard, addressDetail }
      }, 300) // Tăng delay để tránh update quá nhanh

      return () => clearTimeout(timer)
    }
  }, [selectedProvince, selectedDistrict, selectedWard, addressDetail, updateAddressValue])

  // Track previous value to detect external changes
  const prevValueRef = React.useRef(value)

  // Initialize from value prop - only once when provinces are loaded and value is provided
  useEffect(() => {
    // Only initialize once, and only if provinces are loaded
    if (provinces.length === 0) {
      return
    }

    // Check if value changed externally (not from our own onChange)
    const valueChangedExternally =
      prevValueRef.current !== value &&
      (prevValueRef.current?.address !== value?.address ||
        prevValueRef.current?.province !== value?.province ||
        prevValueRef.current?.district !== value?.district ||
        prevValueRef.current?.ward !== value?.ward)

    if (valueChangedExternally) {
      initializedRef.current = false
    }

    if (!initializedRef.current && value) {
      isInitializingRef.current = true

      // Extract address detail from full address
      if (value.address) {
        // If we have province, district, ward, remove them from address detail
        let detailAddress = value.address
        if (value.province) {
          detailAddress = detailAddress.replace(new RegExp(value.province.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim()
        }
        if (value.district) {
          detailAddress = detailAddress.replace(new RegExp(value.district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim()
        }
        if (value.ward) {
          detailAddress = detailAddress.replace(new RegExp(value.ward.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim()
        }
        // Clean up commas
        detailAddress = detailAddress.replace(/^,|,$|,\s*,/g, '').trim()
        setAddressDetail(detailAddress || value.address)
      }

      // Set province
      if (value.province) {
        const matchedProvince = provinces.find(
          (p) => p.name === value.province || p.name_with_type === value.province || p.name_with_type?.includes(value.province)
        )
        if (matchedProvince) {
          setSelectedProvince(matchedProvince.code.toString())
        }
      } else if (value.city) {
        const matchedProvince = provinces.find(
          (p) => p.name === value.city || p.name_with_type === value.city || p.name_with_type?.includes(value.city)
        )
        if (matchedProvince) {
          setSelectedProvince(matchedProvince.code.toString())
        }
      }

      initializedRef.current = true
      prevValueRef.current = value
      // Set flag to false after a short delay to allow state updates to complete
      setTimeout(() => {
        isInitializingRef.current = false
      }, 500)
    } else if (!initializedRef.current) {
      initializedRef.current = true
    }
  }, [value, provinces])

  // Initialize district and ward when they become available
  useEffect(() => {
    if (!initializedRef.current || isInitializingRef.current || !value) {
      return
    }

    if (value.district && districts.length > 0 && !selectedDistrict) {
      const matchedDistrict = districts.find(
        (d) => d.name === value.district || d.name_with_type === value.district || d.name_with_type?.includes(value.district)
      )
      if (matchedDistrict) {
        setSelectedDistrict(matchedDistrict.code.toString())
      }
    }
  }, [value, districts, selectedDistrict])

  useEffect(() => {
    if (!initializedRef.current || isInitializingRef.current || !value) {
      return
    }

    if (value.ward && wards.length > 0 && !selectedWard) {
      const matchedWard = wards.find(
        (w) => w.name === value.ward || w.name_with_type === value.ward || w.name_with_type?.includes(value.ward)
      )
      if (matchedWard) {
        setSelectedWard(matchedWard.code.toString())
      }
    }
  }, [value, wards, selectedWard])

  return (
    <WrapperAddressPicker>
      {/* Province - District - Ward Selection */}
      <div className="address-section">
        <div className="section-title">
          <EnvironmentOutlined />
          Chọn Tỉnh/Thành - Quận/Huyện - Phường/Xã
        </div>
        <Row gutter={[16, 16]} className="select-row">
          <Col xs={24} sm={8}>
            <Select
              placeholder="Chọn Tỉnh/Thành"
              value={selectedProvince}
              onChange={(value) => {
                setSelectedProvince(value)
              }}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                (option?.children?.toString() || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              loading={provinces.length === 0}
              notFoundContent={provinces.length === 0 ? 'Đang tải...' : 'Không tìm thấy'}
              size="large"
            >
              {provinces.map((province) => (
                <Option key={province.code} value={province.code.toString()}>
                  {province.name || province.name_with_type || `Tỉnh ${province.code}`}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Chọn Quận/Huyện"
              value={selectedDistrict}
              onChange={(value) => {
                setSelectedDistrict(value)
              }}
              style={{ width: '100%' }}
              disabled={!selectedProvince}
              showSearch
              filterOption={(input, option) =>
                (option?.children?.toString() || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              loading={selectedProvince && districts.length === 0}
              notFoundContent={
                !selectedProvince
                  ? 'Vui lòng chọn Tỉnh/Thành trước'
                  : districts.length === 0
                    ? 'Đang tải...'
                    : 'Không tìm thấy'
              }
              size="large"
            >
              {districts.map((district) => (
                <Option key={district.code} value={district.code.toString()}>
                  {district.name || district.name_with_type || `Quận/Huyện ${district.code}`}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Chọn Phường/Xã"
              value={selectedWard}
              onChange={(value) => {
                setSelectedWard(value)
              }}
              style={{ width: '100%' }}
              disabled={!selectedDistrict}
              showSearch
              filterOption={(input, option) =>
                (option?.children?.toString() || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              loading={selectedDistrict && wards.length === 0}
              notFoundContent={
                !selectedDistrict
                  ? 'Vui lòng chọn Quận/Huyện trước'
                  : wards.length === 0
                    ? 'Đang tải...'
                    : 'Không tìm thấy'
              }
              size="large"
            >
              {wards.map((ward) => (
                <Option key={ward.code} value={ward.code.toString()}>
                  {ward.name || ward.name_with_type || `Phường/Xã ${ward.code}`}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      {/* Inline Map Picker - Hiển thị ngay dưới dropdowns giống Shopee */}
      <div style={{ marginBottom: 20 }}>
        <InlineMapPicker
          initialAddress={addressDetail}
          selectedProvince={provinces.find((p) => p.code.toString() === selectedProvince)?.name || ''}
          selectedDistrict={districts.find((d) => d.code.toString() === selectedDistrict)?.name || ''}
          selectedWard={wards.find((w) => w.code.toString() === selectedWard)?.name || ''}
          onAddressSelect={({ address, position }) => {
            // CHỈ CẬP NHẬT ADDRESS DETAIL - KHÔNG THAY ĐỔI TỈNH/QUẬN/PHƯỜNG
            // Map chỉ dùng để xác định vị trí chính xác (số nhà, hẻm) cho shipper
            // Province/District/Ward là ràng buộc cứng, được user chọn từ dropdown

            let cleanedAddress = address || ''

            // Lấy tên tỉnh/quận/phường hiện tại để loại bỏ khỏi địa chỉ map
            const currentProvinceName = provinces.find((p) => p.code.toString() === selectedProvince)?.name || ''
            const currentDistrictName = districts.find((d) => d.code.toString() === selectedDistrict)?.name || ''
            const currentWardName = wards.find((w) => w.code.toString() === selectedWard)?.name || ''

            // Loại bỏ phần địa chỉ hành chính khỏi địa chỉ chi tiết
            const partsToRemove = [
              currentProvinceName,
              currentDistrictName,
              currentWardName,
              'Vietnam', 'Việt Nam', 'VN',
              'Thành phố', 'Tỉnh', 'Huyện', 'Quận', 'Phường', 'Xã', 'Thị trấn'
            ].filter(Boolean)

            partsToRemove.forEach(part => {
              if (part) {
                const regex = new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                cleanedAddress = cleanedAddress.replace(regex, '')
              }
            })

            // Làm sạch dấu phẩy thừa và khoảng trắng
            cleanedAddress = cleanedAddress
              .replace(/,\s*,/g, ',')
              .replace(/^,\s*|,\s*$/g, '')
              .replace(/\s+/g, ' ')
              .trim()

            // Nếu địa chỉ quá ngắn hoặc rỗng, sử dụng tọa độ
            if (!cleanedAddress || cleanedAddress.length < 5) {
              if (position) {
                cleanedAddress = `Tọa độ: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
              }
            }

            setAddressDetail(cleanedAddress)
          }}
        />
      </div>

      {/* Address Detail Input - Có thể chỉnh sửa thêm hoặc để nguyên từ map */}
      <div className="address-section address-detail-section">
        <div className="address-detail-label">
          <HomeOutlined />
          Địa chỉ chi tiết (có thể chỉnh sửa thêm)
        </div>
        <TextArea
          placeholder="Nhập hoặc chỉnh sửa địa chỉ chi tiết (số nhà, tên đường, tên chung cư...)"
          value={addressDetail}
          onChange={(e) => {
            const newValue = e.target.value
            setAddressDetail(newValue)
          }}
          rows={3}
          showCount
          maxLength={200}
          onBlur={() => {
            if (addressDetail || selectedProvince || selectedDistrict || selectedWard) {
              updateAddressValue()
            }
          }}
        />
        <div className="helper-text">
          💡 Bạn có thể click trên bản đồ ở trên để tự động điền, sau đó chỉnh sửa thêm nếu cần.
        </div>
      </div>
    </WrapperAddressPicker>
  )
}

export default AddressPicker


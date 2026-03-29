import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input, message, Spin, Button, Tooltip, Alert } from 'antd';
import { SearchOutlined, AimOutlined, EnvironmentOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

// Fix for Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Danh sách tile servers với fallback
const TILE_SERVERS = [
    {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    {
        name: 'CartoDB Voyager',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    {
        name: 'CartoDB Light',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
];

const WrapperInlineMap = styled.div`
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  background: #f5f5f5;

  .map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-bottom: 1px solid #e8e8e8;
    gap: 12px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
      color: #333;

      .anticon {
        color: #1a94ff;
        font-size: 16px;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .map-search-box {
    position: absolute;
    top: 60px;
    left: 12px;
    right: 12px;
    z-index: 1000;
    display: flex;
    gap: 8px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(5px);

    .ant-input {
      border: none;
      box-shadow: none;
      font-size: 13px;
      
      &:focus {
        box-shadow: none;
      }
    }
  }

  .map-container {
    height: 280px;
    width: 100%;

    .leaflet-container {
      height: 100%;
      width: 100%;
    }
  }

  .map-loading-overlay {
    position: absolute;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    gap: 12px;
  }

  .map-footer {
    padding: 12px 16px;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-top: 1px solid #e8e8e8;

    .selected-address {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      
      .address-icon {
        color: #52c41a;
        font-size: 16px;
        margin-top: 2px;
        flex-shrink: 0;
      }

      .address-text {
        font-size: 13px;
        color: #333;
        line-height: 1.5;
        flex: 1;
      }

      .address-loading {
        color: #999;
        font-style: italic;
      }
    }

    .hint-text {
      font-size: 11px;
      color: #999;
      margin-top: 8px;
      font-style: italic;
    }
  }

  .locate-btn {
    position: absolute;
    bottom: 80px;
    right: 12px;
    z-index: 1000;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: none;
    cursor: pointer;

    &:hover {
      background: #f0f0f0;
    }
  }

  .no-address-warning {
    margin: 0 16px 12px;
  }

  @media (max-width: 576px) {
    .map-container {
      height: 220px;
    }

    .map-search-box {
      left: 8px;
      right: 8px;
      top: 56px;
    }
  }
`;

// Component để handle map clicks
function LocationMarker({ position, setPosition }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}>
            <Popup>Vị trí đã ghim</Popup>
        </Marker>
    );
}

// Component để điều khiển map center từ bên ngoài
function MapController({ center }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, 15);
        }
    }, [center, map]);

    return null;
}

/**
 * InlineMapPicker - Bản đồ inline để ghim vị trí chính xác
 * 
 * @param {Object} props
 * @param {Function} props.onAddressSelect - Callback khi user chọn vị trí trên map
 * @param {string} props.initialAddress - Địa chỉ ban đầu
 * @param {string} props.selectedProvince - Tên tỉnh đã chọn
 * @param {string} props.selectedDistrict - Tên quận/huyện đã chọn
 * @param {string} props.selectedWard - Tên phường/xã đã chọn
 */
const InlineMapPicker = ({
    onAddressSelect,
    initialAddress = '',
    selectedProvince = '',
    selectedDistrict = '',
    selectedWard = ''
}) => {
    const [position, setPosition] = useState(null);
    const [address, setAddress] = useState(initialAddress);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tileServerIndex, setTileServerIndex] = useState(0);
    const [mapReady, setMapReady] = useState(false);
    const [tileError, setTileError] = useState(false);
    const [mapCenter, setMapCenter] = useState(null);
    const [hasSelectedAddress, setHasSelectedAddress] = useState(false);
    const tileLoadTimeoutRef = useRef(null);
    const mapRef = useRef(null);
    const geocodedRef = useRef(false);

    // Default to Ho Chi Minh City
    const defaultCenter = { lat: 10.762622, lng: 106.660172 };
    const currentTileServer = TILE_SERVERS[tileServerIndex];

    // Kiểm tra có địa chỉ hành chính được chọn không
    const hasAdminAddress = !!(selectedProvince || selectedDistrict || selectedWard);

    // Switch to next tile server on error
    const switchToNextTileServer = useCallback(() => {
        if (tileServerIndex < TILE_SERVERS.length - 1) {
            setTileServerIndex(prev => prev + 1);
            setTileError(false);
        } else {
            setTileError(true);
        }
    }, [tileServerIndex]);

    // Check map load timeout
    useEffect(() => {
        setMapReady(false);
        setTileError(false);

        tileLoadTimeoutRef.current = setTimeout(() => {
            if (!mapReady) {
                switchToNextTileServer();
            }
        }, 8000);

        const readyTimeout = setTimeout(() => {
            setMapReady(true);
        }, 2000);

        return () => {
            if (tileLoadTimeoutRef.current) {
                clearTimeout(tileLoadTimeoutRef.current);
            }
            clearTimeout(readyTimeout);
        };
    }, [tileServerIndex]);

    // Geocode địa chỉ hành chính đã chọn để center map
    useEffect(() => {
        const geocodeSelectedAddress = async () => {
            if (!hasAdminAddress || geocodedRef.current) return;

            const addressParts = [selectedWard, selectedDistrict, selectedProvince, 'Vietnam']
                .filter(Boolean);

            if (addressParts.length < 2) return;

            const searchAddress = addressParts.join(', ');

            try {
                setLoading(true);
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&countrycodes=vn&limit=1`,
                    {
                        headers: { 'Accept': 'application/json', 'User-Agent': 'WalkzyApp/1.0' }
                    }
                );
                const data = await response.json();

                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
                    geocodedRef.current = true;
                }
            } catch (error) {
                console.warn('Could not geocode address:', error);
            } finally {
                setLoading(false);
            }
        };

        geocodeSelectedAddress();
    }, [selectedProvince, selectedDistrict, selectedWard, hasAdminAddress]);

    // Reset geocoded ref khi địa chỉ thay đổi
    useEffect(() => {
        geocodedRef.current = false;
    }, [selectedProvince, selectedDistrict, selectedWard]);

    // Reverse Geocoding with retry
    const fetchAddressWithRetry = useCallback(async (lat, lng, retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                    {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'WalkzyApp/1.0'
                        }
                    }
                );
                clearTimeout(timeoutId);

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }, []);

    // Fetch address when position changes
    useEffect(() => {
        if (position) {
            const fetchAddress = async () => {
                setLoading(true);
                try {
                    const data = await fetchAddressWithRetry(position.lat, position.lng);
                    if (data && data.display_name) {
                        // Chỉ lấy phần địa chỉ chi tiết (số nhà, đường)
                        const parts = data.display_name.split(',').slice(0, 3).join(',').trim();
                        setAddress(parts);
                        setHasSelectedAddress(true);

                        // Gọi callback để parent biết địa chỉ đã được chọn
                        if (onAddressSelect) {
                            onAddressSelect({
                                address: parts,
                                fullAddress: data.display_name,
                                position: position,
                                addressDetails: data.address
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching address:", error);
                    const coordsText = `Tọa độ: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
                    setAddress(coordsText);
                    setHasSelectedAddress(true);
                    if (onAddressSelect) {
                        onAddressSelect({ address: coordsText, position });
                    }
                } finally {
                    setLoading(false);
                }
            };

            const timeoutId = setTimeout(fetchAddress, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [position, fetchAddressWithRetry, onAddressSelect]);

    // Search location - ưu tiên tìm trong khu vực đã chọn
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);

        // Thêm context địa chỉ hành chính vào search query
        let enrichedQuery = searchQuery;
        if (hasAdminAddress) {
            const contextParts = [selectedWard, selectedDistrict, selectedProvince]
                .filter(Boolean)
                .join(', ');
            enrichedQuery = `${searchQuery}, ${contextParts}`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enrichedQuery)}&countrycodes=vn&addressdetails=1`,
                {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json', 'User-Agent': 'WalkzyApp/1.0' }
                }
            );
            clearTimeout(timeoutId);

            const data = await response.json();
            if (data && data.length > 0) {
                const firstResult = data[0];
                setPosition({ lat: parseFloat(firstResult.lat), lng: parseFloat(firstResult.lon) });
            } else {
                message.warning("Không tìm thấy địa điểm. Thử nhập chi tiết hơn.");
            }
        } catch (error) {
            message.error("Lỗi khi tìm kiếm");
        } finally {
            setLoading(false);
        }
    };

    // Get current location - có cảnh báo nếu chưa chọn địa chỉ hành chính
    const handleLocateMe = useCallback(() => {
        if (!hasAdminAddress) {
            message.warning('Vui lòng chọn Tỉnh/Quận/Phường trước khi sử dụng vị trí hiện tại.');
            return;
        }

        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setPosition(newPos);
                    setLoading(false);
                    message.info('Đã lấy vị trí GPS. Vui lòng kiểm tra xem vị trí có đúng không.');
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    message.warning("Không thể lấy vị trí. Hãy click trên bản đồ để chọn.");
                    setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
            );
        } else {
            message.warning("Trình duyệt không hỗ trợ định vị.");
        }
    }, [hasAdminAddress]);

    return (
        <WrapperInlineMap>
            {/* Header */}
            <div className="map-header">
                <div className="header-title">
                    <EnvironmentOutlined />
                    <span>Ghim vị trí chính xác (số nhà, hẻm)</span>
                </div>
                <div className="header-actions">
                    <Tooltip title={hasAdminAddress ? "Vị trí hiện tại" : "Chọn Tỉnh/Quận/Phường trước"}>
                        <Button
                            size="small"
                            icon={<AimOutlined />}
                            onClick={handleLocateMe}
                            loading={loading && !position}
                            disabled={!hasAdminAddress}
                        />
                    </Tooltip>
                    {tileError && (
                        <Tooltip title="Thử lại">
                            <Button
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => { setTileServerIndex(0); setTileError(false); }}
                            />
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Warning nếu chưa chọn địa chỉ hành chính */}
            {!hasAdminAddress && (
                <Alert
                    className="no-address-warning"
                    message="Vui lòng chọn Tỉnh/Quận/Phường ở trên trước"
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                />
            )}

            {/* Map Container */}
            <div className="map-container">
                {/* Loading Overlay */}
                {!mapReady && !tileError && (
                    <div className="map-loading-overlay">
                        <Spin size="default" />
                        <div style={{ color: '#666', fontSize: 13 }}>Đang tải bản đồ...</div>
                    </div>
                )}

                <MapContainer
                    center={mapCenter || defaultCenter}
                    zoom={15}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    ref={mapRef}
                    whenReady={() => setMapReady(true)}
                >
                    <TileLayer
                        key={tileServerIndex}
                        attribution={currentTileServer.attribution}
                        url={currentTileServer.url}
                        eventHandlers={{
                            tileerror: () => {
                                if (!mapReady) switchToNextTileServer();
                            },
                            load: () => {
                                setMapReady(true);
                                if (tileLoadTimeoutRef.current) {
                                    clearTimeout(tileLoadTimeoutRef.current);
                                }
                            }
                        }}
                    />
                    <MapController center={mapCenter} />
                    <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>

                {/* Search Box */}
                <div className="map-search-box">
                    <Input
                        placeholder={hasAdminAddress
                            ? `Tìm địa chỉ trong ${selectedDistrict || selectedProvince || 'khu vực đã chọn'}`
                            : "Chọn Tỉnh/Quận/Phường trước"
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ flex: 1 }}
                        disabled={!hasAdminAddress}
                    />
                    <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={handleSearch}
                        loading={loading}
                        size="small"
                        disabled={!hasAdminAddress}
                    >
                        Tìm
                    </Button>
                </div>

                {/* Locate Button */}
                <Tooltip title={hasAdminAddress ? "Vị trí hiện tại" : "Chọn Tỉnh/Quận/Phường trước"}>
                    <button
                        className="locate-btn"
                        onClick={handleLocateMe}
                        disabled={!hasAdminAddress}
                        style={{ opacity: hasAdminAddress ? 1 : 0.5 }}
                    >
                        <AimOutlined style={{ fontSize: 16, color: '#1a94ff' }} />
                    </button>
                </Tooltip>
            </div>

            {/* Footer - Selected Address */}
            <div className="map-footer">
                <div className="selected-address">
                    {hasSelectedAddress && position ? (
                        <>
                            <EnvironmentOutlined className="address-icon" />
                            <span className={`address-text ${loading ? 'address-loading' : ''}`}>
                                {loading ? 'Đang lấy địa chỉ...' : (address || 'Click trên bản đồ để chọn vị trí')}
                            </span>
                        </>
                    ) : (
                        <span className="address-text address-loading">
                            👆 {hasAdminAddress
                                ? 'Click trên bản đồ hoặc tìm kiếm để ghim vị trí chính xác'
                                : 'Chọn Tỉnh/Quận/Phường ở trên trước, sau đó ghim vị trí trên bản đồ'
                            }
                        </span>
                    )}
                </div>
                <div className="hint-text">
                    * Địa chỉ này giúp shipper tìm đúng số nhà, hẻm. Tỉnh/Quận/Phường đã chọn ở trên sẽ không thay đổi.
                </div>
            </div>
        </WrapperInlineMap>
    );
};

export default InlineMapPicker;

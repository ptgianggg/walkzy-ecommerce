
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Input, Modal, message, Spin, Tooltip, Alert } from 'antd';
import { SearchOutlined, EnvironmentOutlined, AimOutlined, ReloadOutlined } from '@ant-design/icons';
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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
        name: 'CartoDB Voyager',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    {
        name: 'CartoDB Light',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
];

const WrapperMap = styled.div`
  position: relative;
  height: 550px;
  width: 100%;
  
  .leaflet-container {
    height: 100%;
    width: 100%;
    border-radius: 12px;
    z-index: 1;
  }

  .map-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    border-radius: 12px;
    gap: 16px;
  }

  .map-error-banner {
    position: absolute;
    top: 80px;
    left: 15px;
    right: 15px;
    z-index: 1001;
    max-width: 450px;
  }
`;

const SearchBox = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  max-width: 450px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(0,0,0,0.05);

  .ant-input {
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    &:focus {
      box-shadow: none;
      border-color: #1a94ff;
    }
  }

  .ant-btn {
    border-radius: 8px;
    height: 100%;
  }

  @media (max-width: 576px) {
      max-width: none;
  }
`;

const LocationInfo = styled.div`
    position: absolute;
    bottom: 25px;
    left: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.98);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    z-index: 1000;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(0,0,0,0.05);
    animation: slideUp 0.3s ease-out;

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
`;

const LocateButton = styled(Button)`
    position: absolute;
    top: 80px; /* Below search box */
    left: 15px;
    z-index: 1000;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    
    &:hover {
        background: #f0f0f0;
    }
`;

// Build a custom component to handle map clicks
function LocationMarker({ position, setPosition, setAddress }) {
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
            <Popup>Vị trí đã chọn</Popup>
        </Marker>
    );
}

const MapSelector = ({ onConfirm, onCancel, isOpen }) => {
    const [position, setPosition] = useState(null); // { lat, lng }
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // State cho việc chuyển đổi tile server khi có lỗi
    const [tileServerIndex, setTileServerIndex] = useState(0);
    const [mapReady, setMapReady] = useState(false);
    const [tileError, setTileError] = useState(false);
    const tileLoadTimeoutRef = useRef(null);
    const mapRef = useRef(null);

    // Default to Ho Chi Minh City if no position
    const defaultCenter = { lat: 10.762622, lng: 106.660172 };

    const [addressDetails, setAddressDetails] = useState(null);

    // Lấy tile server hiện tại
    const currentTileServer = TILE_SERVERS[tileServerIndex];

    // Chuyển sang tile server tiếp theo khi có lỗi
    const switchToNextTileServer = useCallback(() => {
        if (tileServerIndex < TILE_SERVERS.length - 1) {
            setTileServerIndex(prev => prev + 1);
            setTileError(false);
            message.info(`Đang chuyển sang server bản đồ khác...`);
        } else {
            setTileError(true);
            message.warning('Tất cả server bản đồ đều không khả dụng. Vui lòng kiểm tra kết nối mạng.');
        }
    }, [tileServerIndex]);

    // Kiểm tra map load xong chưa
    useEffect(() => {
        if (isOpen) {
            setMapReady(false);
            setTileError(false);

            // Timeout để kiểm tra nếu map không load trong 8 giây
            tileLoadTimeoutRef.current = setTimeout(() => {
                if (!mapReady) {
                    console.warn('Map tiles loading slowly, trying alternative...');
                    switchToNextTileServer();
                }
            }, 8000);

            // Set map ready sau 2 giây (cho tiles time để load)
            const readyTimeout = setTimeout(() => {
                setMapReady(true);
            }, 2000);

            return () => {
                if (tileLoadTimeoutRef.current) {
                    clearTimeout(tileLoadTimeoutRef.current);
                }
                clearTimeout(readyTimeout);
            };
        }
    }, [isOpen, tileServerIndex]);

    // Reverse Geocoding với retry logic
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

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                console.warn(`Geocoding attempt ${i + 1} failed:`, error.message);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }, []);

    // Reverse Geocoding
    useEffect(() => {
        if (position) {
            const fetchAddress = async () => {
                setLoading(true);
                try {
                    const data = await fetchAddressWithRetry(position.lat, position.lng);
                    if (data && data.display_name) {
                        setAddress(data.display_name);
                        setAddressDetails(data.address);
                    }
                } catch (error) {
                    console.error("Error fetching address:", error);
                    // Vẫn cho phép confirm với tọa độ nếu không lấy được địa chỉ
                    setAddress(`Tọa độ: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
                    message.warning("Không thể lấy địa chỉ chi tiết, nhưng vẫn có thể sử dụng tọa độ.");
                } finally {
                    setLoading(false);
                }
            };

            const timeoutId = setTimeout(() => fetchAddress(), 500);
            return () => clearTimeout(timeoutId);
        }
    }, [position, fetchAddressWithRetry]);

    // Forward Geocoding (Search) với retry
    const handleSearch = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&addressdetails=1`,
                {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'WalkzyApp/1.0'
                    }
                }
            );
            clearTimeout(timeoutId);

            const data = await response.json();
            if (data && data.length > 0) {
                const firstResult = data[0];
                const newPos = { lat: parseFloat(firstResult.lat), lng: parseFloat(firstResult.lon) };
                setPosition(newPos);
            } else {
                message.warning("Không tìm thấy địa điểm");
            }
        } catch (error) {
            console.error("Error searching address:", error);
            if (error.name === 'AbortError') {
                message.error("Tìm kiếm quá lâu, vui lòng thử lại");
            } else {
                message.error("Lỗi khi tìm kiếm");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!position) {
            message.warning("Vui lòng chọn một vị trí trên bản đồ");
            return;
        }
        onConfirm({
            address,
            position,
            addressDetails
        });
    };

    // Get current location on open
    const handleLocateMe = useCallback(() => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    setPosition(newPos);
                    setLoading(false);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    message.error("Không thể lấy vị trí hiện tại. Bạn có thể click trên bản đồ để chọn.");
                    setLoading(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000
                }
            );
        } else {
            message.warning("Trình duyệt không hỗ trợ định vị. Vui lòng click trên bản đồ để chọn vị trí.");
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            handleLocateMe();
        }
    }, [isOpen, handleLocateMe]);

    // Reset state khi đóng modal
    useEffect(() => {
        if (!isOpen) {
            setPosition(null);
            setAddress('');
            setAddressDetails(null);
            setSearchQuery('');
            setTileServerIndex(0);
            setMapReady(false);
            setTileError(false);
        }
    }, [isOpen]);

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <EnvironmentOutlined style={{ color: '#1a94ff' }} />
                    <span>Ghim vị trí chính xác (số nhà, hẻm)</span>
                </div>
            }
            open={isOpen}
            onCancel={onCancel}
            footer={null}
            width={800}
            centered
            destroyOnClose
            styles={{ body: { padding: 0 } }}
        >
            <Alert
                message="Lưu ý: Bản đồ chỉ để xác định vị trí chính xác (số nhà, hẻm). Tỉnh/Quận/Phường đã chọn sẽ KHÔNG bị thay đổi."
                type="info"
                showIcon
                style={{ margin: '12px 16px 0', borderRadius: 8 }}
            />
            <WrapperMap>
                {/* Loading Overlay */}
                {!mapReady && !tileError && (
                    <div className="map-loading-overlay">
                        <Spin size="large" />
                        <div style={{ color: '#666', fontSize: 14 }}>Đang tải bản đồ...</div>
                        <div style={{ color: '#999', fontSize: 12 }}>Sử dụng: {currentTileServer.name}</div>
                    </div>
                )}

                {/* Error Banner */}
                {tileError && (
                    <div className="map-error-banner">
                        <Alert
                            message="Không thể tải bản đồ"
                            description="Vui lòng kiểm tra kết nối mạng và thử lại."
                            type="error"
                            showIcon
                            action={
                                <Button
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        setTileServerIndex(0);
                                        setTileError(false);
                                    }}
                                >
                                    Thử lại
                                </Button>
                            }
                        />
                    </div>
                )}

                <MapContainer
                    center={defaultCenter}
                    zoom={16}
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
                                console.warn(`Tile error on ${currentTileServer.name}`);
                                // Chỉ switch nếu chưa sẵn sàng
                                if (!mapReady) {
                                    switchToNextTileServer();
                                }
                            },
                            load: () => {
                                setMapReady(true);
                                if (tileLoadTimeoutRef.current) {
                                    clearTimeout(tileLoadTimeoutRef.current);
                                }
                            }
                        }}
                    />
                    <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} />
                </MapContainer>

                <SearchBox>
                    <Input
                        placeholder="Tìm địa chỉ cụ thể (VD: 123 Nguyễn Huệ, Quận 1)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onPressEnter={handleSearch}
                        bordered={false}
                        style={{ height: '40px', background: 'transparent' }}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading} style={{ height: '40px' }}>
                        Tìm
                    </Button>
                </SearchBox>

                <Tooltip title="Vị trí hiện tại của tôi">
                    <LocateButton
                        icon={<AimOutlined />}
                        onClick={handleLocateMe}
                        loading={loading && !position}
                    />
                </Tooltip>

                {position && (
                    <LocationInfo>
                        <div style={{ marginBottom: 10 }}>
                            <EnvironmentOutlined style={{ color: '#1a94ff', marginRight: 8 }} />
                            <span style={{ fontWeight: 600 }}>Vị trí đã ghim:</span>
                        </div>
                        <div style={{ marginBottom: 15, fontSize: 13, color: '#555' }}>
                            {loading ? <Spin size="small" /> : (address || 'Đang tải địa chỉ...')}
                        </div>
                        <div style={{ marginBottom: 10, fontSize: 11, color: '#999', fontStyle: 'italic' }}>
                            * Địa chỉ này sẽ được dùng để xác định số nhà, hẻm cho shipper. Tỉnh/Quận/Phường không đổi.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <Button onClick={onCancel} style={{ borderRadius: '8px', height: '36px' }}>Hủy</Button>
                            <Button type="primary" onClick={handleConfirm} disabled={!address || loading} style={{ borderRadius: '8px', height: '36px', fontWeight: 500 }}>
                                Xác nhận vị trí
                            </Button>
                        </div>
                    </LocationInfo>
                )}
            </WrapperMap>
        </Modal>
    );
};

export default MapSelector;

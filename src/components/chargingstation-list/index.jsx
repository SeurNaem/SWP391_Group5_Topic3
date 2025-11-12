import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    List,
    Button,
    Space,
    Typography,
    Alert,
    Spin,
    Select,
    Input,
    Empty,
    message,
    Tooltip,
    Tag
} from 'antd';
import {
    EnvironmentOutlined,
    ReloadOutlined,
    SortAscendingOutlined,
    FilterOutlined,
    SearchOutlined,
    AimOutlined,
    ThunderboltOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    CarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    getCurrentLocation,
    calculateDistance,
    DEFAULT_LOCATION,
    formatDistance,
    estimateTravelTime
} from '../../utils/LocationService';

const { Title, Text } = Typography;
const { Option } = Select;

// StationCard Component
const StationCard = ({
    station,
    onStationSelect,
    isSelected = false
}) => {
    const navigate = useNavigate();

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return '#52c41a';
            case 'occupied':
                return '#faad14';
            case 'maintenance':
                return '#ff4d4f';
            default:
                return '#d9d9d9';
        }
    };

    const getStatusText = (status) => {
        switch (status?.toLowerCase()) {
            case 'available':
                return 'Available';
            case 'occupied':
                return 'Occupied';
            case 'maintenance':
                return 'Maintenance';
            default:
                return 'Unknown';
        }
    };

    const handleCardClick = () => {
        if (onStationSelect) {
            onStationSelect(station);
        }
    };

    return (
        <Card
            hoverable
            onClick={handleCardClick}
            className={`station-card ${isSelected ? 'selected' : ''}`}
            style={{
                marginBottom: '16px',
                border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Header with distance and status */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
            }}>
                <div style={{ flex: 1 }}>
                    <Title level={5} style={{ margin: 0, marginBottom: '4px' }}>
                        {station.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        <EnvironmentOutlined style={{ marginRight: '4px' }} />
                        {formatDistance(station.distance)}
                    </Text>
                </div>
                <Tag
                    color={getStatusColor(station.status)}
                    style={{ margin: 0 }}
                >
                    {getStatusText(station.status)}
                </Tag>
            </div>

            {/* Station details */}
            <div style={{ marginBottom: '12px' }}>
                <Text style={{ fontSize: '13px', color: '#666', display: 'block' }}>
                    {station.address}
                </Text>
            </div>

            {/* Charging info */}
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space size="small">
                        <ThunderboltOutlined style={{ color: '#faad14' }} />
                        <Text style={{ fontSize: '12px' }}>{station.power}</Text>
                    </Space>
                    <Space size="small">
                        <DollarOutlined style={{ color: '#52c41a' }} />
                        <Text style={{ fontSize: '12px' }}>{station.price}</Text>
                    </Space>
                </div>

                {/* Connector types */}
                <div style={{ minHeight: '20px' }}>
                    <Text style={{ fontSize: '12px', color: '#666' }}>Connectors: </Text>
                    {(() => {
                        console.log('Station charging points:', station.chargingPoints);
                        console.log('Station chargerTypes:', station.chargerTypes);

                        // If we have detailed charging points data with status - PRIORITIZE THIS
                        if (station.chargingPoints && station.chargingPoints.length > 0) {
                            // Group charging points by connector type to avoid duplicates
                            const connectorGroups = {};
                            station.chargingPoints.forEach(point => {
                                const connectorType = point.connectorType || point.type || 'Unknown';
                                if (!connectorGroups[connectorType]) {
                                    connectorGroups[connectorType] = [];
                                }
                                connectorGroups[connectorType].push(point);
                            });

                            return Object.entries(connectorGroups).map(([connectorType, points], index) => {
                                // Determine the overall status for this connector type
                                // Priority: offline > occupied > reserved > available
                                let overallStatus = 'available';
                                if (points.some(p => ['offline', 'maintenance'].includes(p.status?.toLowerCase()))) {
                                    overallStatus = 'offline';
                                } else if (points.some(p => ['occupied', 'busy'].includes(p.status?.toLowerCase()))) {
                                    overallStatus = 'occupied';
                                } else if (points.some(p => p.status?.toLowerCase() === 'reserved')) {
                                    overallStatus = 'reserved';
                                }

                                console.log('Connector type:', connectorType, 'Overall status:', overallStatus, 'Points:', points);

                                const getConnectorColor = (status) => {
                                    console.log('Getting color for status:', status);
                                    switch (status?.toLowerCase()) {
                                        case 'available':
                                            return 'success'; // Green
                                        case 'reserved':
                                            return 'warning'; // Orange
                                        case 'offline':
                                        case 'maintenance':
                                            return 'error'; // Red
                                        case 'occupied':
                                        case 'busy':
                                            return 'processing'; // Blue
                                        default:
                                            return 'default'; // Gray
                                    }
                                };

                                const color = getConnectorColor(overallStatus);
                                console.log('Final color for connector:', color, 'type:', connectorType, 'status:', overallStatus);

                                return (
                                    <Tag
                                        key={index}
                                        size="small"
                                        color={color}
                                        style={{
                                            fontSize: '10px',
                                            margin: '0 2px 2px 0',
                                            borderRadius: '4px'
                                        }}
                                        title={`${connectorType}: ${points.length} point(s) - ${overallStatus}`}
                                    >
                                        {connectorType}
                                    </Tag>
                                );
                            });
                        }

                        // If we only have chargerTypes array (fallback to station status)
                        if (station.chargerTypes && station.chargerTypes.length > 0) {
                            const getStationColor = (stationStatus) => {
                                switch (stationStatus?.toLowerCase()) {
                                    case 'available':
                                        return 'success'; // Green
                                    case 'occupied':
                                        return 'warning'; // Orange
                                    case 'maintenance':
                                        return 'error'; // Red
                                    default:
                                        return 'processing'; // Blue
                                }
                            };

                            return station.chargerTypes.map((type, index) => (
                                <Tag
                                    key={index}
                                    size="small"
                                    color={getStationColor(station.status)}
                                    style={{
                                        fontSize: '10px',
                                        margin: '0 2px 2px 0',
                                        borderRadius: '4px'
                                    }}
                                >
                                    {type}
                                </Tag>
                            ));
                        }

                        // Default fallback connectors (use station status)
                        const getStationColor = (stationStatus) => {
                            switch (stationStatus?.toLowerCase()) {
                                case 'available':
                                    return 'success'; // Green
                                case 'occupied':
                                    return 'warning'; // Orange
                                case 'maintenance':
                                    return 'error'; // Red
                                default:
                                    return 'processing'; // Blue
                            }
                        };

                        return ['Type 2', 'CCS'].map((type, index) => (
                            <Tag
                                key={index}
                                size="small"
                                color={getStationColor(station.status)}
                                style={{
                                    fontSize: '10px',
                                    margin: '0 2px 2px 0',
                                    borderRadius: '4px'
                                }}
                            >
                                {type}
                            </Tag>
                        ));
                    })()}
                </div>

                {/* Travel time estimate */}
                {station.distance && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid #f0f0f0'
                    }}>
                        <Space size="small">
                            <CarOutlined style={{ color: '#1890ff' }} />
                            <Text style={{ fontSize: '12px', color: '#666' }}>
                                {estimateTravelTime(station.distance, 'driving')}
                            </Text>
                        </Space>
                        <Space size="small">
                            <ClockCircleOutlined style={{ color: '#666' }} />
                            <Text style={{ fontSize: '12px', color: '#666' }}>
                                Last updated: 2min ago
                            </Text>
                        </Space>
                    </div>
                )}
            </Space>

            {/* Action buttons */}
            <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '8px'
            }}>
                <Button
                    type="primary"
                    size="small"
                    style={{ flex: 1 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Handle navigation/directions
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
                        window.open(url, '_blank');
                    }}
                >
                    Directions
                </Button>
                <Tooltip title="Reserve this station">
                    <Button
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to payment page with station data
                            navigate('/payment', { state: { station } });
                        }}
                    >
                        Reserve
                    </Button>
                </Tooltip>
            </div>
        </Card>
    );
};

const ChargingStationList = ({
    stations = [],
    onStationSelect,
    selectedStation,
    searchText = '',
    onSearchChange
}) => {
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [sortBy, setSortBy] = useState('distance'); // 'distance', 'name', 'status'
    const [filterStatus, setFilterStatus] = useState('all');
    const [localSearchText, setLocalSearchText] = useState(searchText);

    // Get user's current location
    const getUserLocation = async () => {
        setLocationLoading(true);
        setLocationError(null);

        try {
            const location = await getCurrentLocation();
            setUserLocation(location);
            message.success('Location updated successfully');
        } catch (error) {
            console.error('Location error:', error);
            setLocationError(error.message);
            setUserLocation(DEFAULT_LOCATION);
            message.warning(`Using default location: ${error.message}`);
        } finally {
            setLocationLoading(false);
        }
    };

    // Initialize user location on component mount
    useEffect(() => {
        getUserLocation();
    }, []);

    // Calculate distances and sort stations
    const processedStations = useMemo(() => {
        if (!userLocation) return stations;

        // Add distance to each station
        const stationsWithDistance = stations.map(station => ({
            ...station,
            distance: calculateDistance(
                userLocation.lat,
                userLocation.lng,
                station.lat,
                station.lng
            )
        }));

        // Filter by search text
        let filteredStations = stationsWithDistance;

        if (localSearchText.trim()) {
            const searchTerm = localSearchText.toLowerCase().trim();
            filteredStations = stationsWithDistance.filter(station =>
                station.title?.toLowerCase().includes(searchTerm) ||
                station.address?.toLowerCase().includes(searchTerm) ||
                station.description?.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by status
        if (filterStatus !== 'all') {
            filteredStations = filteredStations.filter(station =>
                station.status?.toLowerCase() === filterStatus.toLowerCase()
            );
        }

        // Sort stations
        filteredStations.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return (a.distance || 0) - (b.distance || 0);
                case 'name':
                    return a.title?.localeCompare(b.title) || 0;
                case 'status': {
                    const statusOrder = { 'available': 0, 'occupied': 1, 'maintenance': 2 };
                    return (statusOrder[a.status?.toLowerCase()] || 3) - (statusOrder[b.status?.toLowerCase()] || 3);
                }
                default:
                    return 0;
            }
        });

        return filteredStations;
    }, [stations, userLocation, localSearchText, filterStatus, sortBy]);

    // Handle search text change
    const handleSearchChange = (value) => {
        setLocalSearchText(value);
        if (onSearchChange) {
            onSearchChange(value);
        }
    };

    const getLocationStatus = () => {
        if (locationLoading) {
            return { type: 'info', message: 'Getting your location...' };
        }
        if (locationError) {
            return { type: 'warning', message: `Location: ${locationError}` };
        }
        if (userLocation) {
            const isDefault = userLocation.lat === DEFAULT_LOCATION.lat &&
                userLocation.lng === DEFAULT_LOCATION.lng;
            return {
                type: isDefault ? 'warning' : 'success',
                message: isDefault ? 'Using default location (Ho Chi Minh City)' : 'Location detected'
            };
        }
        return null;
    };

    const locationStatus = getLocationStatus();

    return (
        <Card
            title={
                <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <Space>
                            <EnvironmentOutlined style={{ color: '#1890ff' }} />
                            <Title level={4} style={{ margin: 0 }}>
                                Charging Stations
                            </Title>
                            <Text type="secondary">({processedStations.length} found)</Text>
                        </Space>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginTop: '8px'
                    }}>
                        <Text type="secondary" style={{ fontSize: '13px', fontWeight: '500' }}>
                            Connector Status:
                        </Text>
                        <Space size={4}>
                            <Tag color="success" size="small" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                Available
                            </Tag>
                            <Tag color="warning" size="small" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                Reserved
                            </Tag>
                            <Tag color="processing" size="small" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                Occupied
                            </Tag>
                            <Tag color="error" size="small" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                Offline
                            </Tag>
                        </Space>
                    </div>
                </div>
            }
            extra={
                <Tooltip title="Refresh location">
                    <Button
                        icon={<ReloadOutlined />}
                        loading={locationLoading}
                        onClick={getUserLocation}
                        size="small"
                    />
                </Tooltip>
            }
            style={{ height: '100%' }}
        >
            {/* Location Status Alert */}
            {locationStatus && (
                <Alert
                    message={locationStatus.message}
                    type={locationStatus.type}
                    showIcon
                    style={{ marginBottom: '16px' }}
                    action={
                        locationError && (
                            <Button size="small" type="text" onClick={getUserLocation}>
                                Retry
                            </Button>
                        )
                    }
                />
            )}

            {/* Search and Filter Controls */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
                {/* Search Input */}
                <Input
                    placeholder="Search stations..."
                    prefix={<SearchOutlined />}
                    value={localSearchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    allowClear
                />

                {/* Filter and Sort Controls */}
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                        <Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            style={{ width: 120 }}
                            size="small"
                        >
                            <Option value="all">All Status</Option>
                            <Option value="available">Available</Option>
                            <Option value="occupied">Occupied</Option>
                            <Option value="maintenance">Maintenance</Option>
                        </Select>
                    </Space>

                    <Select
                        value={sortBy}
                        onChange={setSortBy}
                        style={{ width: 140 }}
                        size="small"
                        suffixIcon={<SortAscendingOutlined />}
                    >
                        <Option value="distance">
                            <AimOutlined style={{ marginRight: '4px' }} />
                            Distance
                        </Option>
                        <Option value="name">Name</Option>
                        <Option value="status">Status</Option>
                    </Select>
                </Space>
            </Space>

            {/* Stations List */}
            <div style={{
                maxHeight: 'calc(100vh - 400px)',
                overflowY: 'auto',
                paddingRight: '4px'
            }}>
                {locationLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '16px' }}>
                            <Text>Getting your location...</Text>
                        </div>
                    </div>
                ) : processedStations.length === 0 ? (
                    <Empty
                        description="No charging stations found"
                        style={{ padding: '40px' }}
                    />
                ) : (
                    <List
                        dataSource={processedStations}
                        renderItem={(station) => (
                            <List.Item style={{ padding: 0, border: 'none' }}>
                                <StationCard
                                    station={station}
                                    onStationSelect={onStationSelect}
                                    isSelected={selectedStation?.id === station.id}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </div>
        </Card>
    );
};

export default ChargingStationList;

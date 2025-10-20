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
    Tooltip
} from 'antd';
import {
    EnvironmentOutlined,
    ReloadOutlined,
    SortAscendingOutlined,
    FilterOutlined,
    SearchOutlined,
    AimOutlined
} from '@ant-design/icons';
import StationCard from './StationCard';
import {
    getCurrentLocation,
    calculateDistance,
    DEFAULT_LOCATION
} from '../../utils/LocationService';

const { Title, Text } = Typography;
const { Option } = Select;

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
                <Space>
                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                    <Title level={4} style={{ margin: 0 }}>
                        Charging Stations
                    </Title>
                    <Text type="secondary">({processedStations.length} found)</Text>
                </Space>
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

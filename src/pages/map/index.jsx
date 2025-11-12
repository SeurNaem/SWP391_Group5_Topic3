import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Typography, message, Spin, Tag } from 'antd';
import { EnvironmentOutlined, ReloadOutlined, HomeOutlined, ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import MapComponent from '../../components/map';
import ChargingStationList from '../../components/chargingstation-list';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStations } from '../../redux/slices/stationSlice';

const { Title, Text } = Typography;

// Utility function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};

const MapPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedStation, setSelectedStation] = useState(null);
    const [stationDetails, setStationDetails] = useState(null);
    const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]); // Ho Chi Minh City
    const [mapZoom, setMapZoom] = useState(13);
    const [userLocation, setUserLocation] = useState(null);

    const dispatch = useDispatch();
    const { stations: chargingStations } = useSelector(state => state.stations || { stations: [] });

    useEffect(() => {
        dispatch(fetchStations());
    }, [dispatch]);

    // Pre-fetch detailed data for all stations to get real-time connector status
    // Note: Disabled admin API calls due to 403 authentication errors
    const preloadStationDetails = async () => {
        console.log('Skipping admin API calls due to authentication restrictions');
        console.log('Using data from ChargingStation endpoint instead');
        // The ChargingStation endpoint already includes charging points data
        // No additional API calls needed
    };    // Pre-load station details when stations are loaded
    useEffect(() => {
        if (chargingStations.length > 0) {
            preloadStationDetails(chargingStations);
        }
    }, [chargingStations]);

    // Note: Station filtering is now handled by ChargingStationList component

    // Handle map click
    const handleMapClick = (e) => {
        const { lat, lng } = e.latlng;
        console.log('Map clicked at:', lat, lng);
        // You can add functionality to add new stations or get location info
    };

    // Handle station selection
    const handleStationSelect = async (station) => {
        setSelectedStation(station);
        setMapCenter([station.lat, station.lng]);
        setMapZoom(16);

        // Use the charging points data that's already available from the ChargingStation endpoint
        console.log('Station selected:', station);
        console.log('Available charging points:', station.chargingPoints);

        // Set station details from the existing data (no admin API call needed)
        setStationDetails({
            ...station,
            chargingPoints: station.chargingPoints || []
        });
    };    // Use the stations directly from Redux (they already include charging points data)
    // Handle user location updates (without auto-centering the map)
    const handleUserLocationUpdate = (location) => {
        setUserLocation(location);
        // Don't show location success message or auto-center map
    };

    // Enhance stations with distance information
    const enhancedStations = chargingStations.map(station => {
        let enhancedStation = { ...station };

        // Add distance if user location is available
        if (userLocation) {
            const distance = calculateDistance(
                userLocation[0], userLocation[1],
                station.lat, station.lng
            );
            enhancedStation.distance = distance;
            enhancedStation.distanceText = distance < 1
                ? `${(distance * 1000).toFixed(0)}m`
                : `${distance.toFixed(1)}km`;
        }

        return enhancedStation;
    }).sort((a, b) => {
        // Sort by distance if available, otherwise by name
        if (a.distance && b.distance) {
            return a.distance - b.distance;
        }
        return (a.title || '').localeCompare(b.title || '');
    });

    // Refresh stations
    const refreshStations = async () => {
        setLoading(true);
        try {
            await dispatch(fetchStations()).unwrap();
            message.success('Charging stations updated successfully');
        } catch (err) {
            console.error(err);
            message.error('Failed to refresh stations');
        } finally {
            setLoading(false);
        }
    };    // Get directions to station
    const getDirections = (station) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
        window.open(url, '_blank');
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'available':
                return '#52c41a';
            case 'occupied':
            case 'busy':
                return '#faad14';
            case 'maintenance':
            case 'offline':
                return '#ff4d4f';
            case 'reserved':
                return '#1890ff';
            default:
                return '#d9d9d9';
        }
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'available':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'occupied':
            case 'busy':
                return <ThunderboltOutlined style={{ color: '#faad14' }} />;
            case 'maintenance':
            case 'offline':
                return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'reserved':
                return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />;
            default:
                return <CloseCircleOutlined style={{ color: '#d9d9d9' }} />;
        }
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Row gutter={[24, 24]}>
                {/* Header */}
                <Col span={24}>
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Title level={2} style={{ margin: 0 }}>
                                    <EnvironmentOutlined style={{ marginRight: 12, color: '#4da0d6' }} />
                                    EV Charging Station Map
                                </Title>
                                <Text type="secondary">
                                    Find and navigate to the nearest electric vehicle charging stations
                                </Text>
                            </div>
                            <Space>
                                <Link to="/">
                                    <Button
                                        icon={<HomeOutlined />}
                                        type="default"
                                    >
                                        Back to Home
                                    </Button>
                                </Link>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={refreshStations}
                                    loading={loading}
                                >
                                    Refresh
                                </Button>
                                <Button
                                    type="dashed"
                                    size="small"
                                    onClick={() => preloadStationDetails(chargingStations)}
                                    loading={loading}
                                >
                                    Update Connectors
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </Col>

                {/* Charging Stations Info Bar */}
                <Col span={24}>
                    <Card>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div>
                                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                        ⚡ Charging Stations
                                    </Title>
                                    <Text type="secondary">({enhancedStations.length} found)</Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Text strong style={{ marginRight: '8px' }}>Connector Status:</Text>
                                <Space size="small">
                                    <Tag color="success" style={{ margin: 0 }}>Available</Tag>
                                    <Tag color="warning" style={{ margin: 0 }}>Reserved</Tag>
                                    <Tag color="processing" style={{ margin: 0 }}>Occupied</Tag>
                                    <Tag color="error" style={{ margin: 0 }}>Offline</Tag>
                                </Space>
                            </div>
                        </div>
                    </Card>
                </Col>



                {/* Map */}
                <Col xs={24} lg={16}>
                    <Card title="Interactive Map" style={{ height: '600px' }}>
                        <MapComponent
                            center={mapCenter}
                            zoom={mapZoom}
                            height="520px"
                            markers={enhancedStations}
                            onMapClick={handleMapClick}
                            showCurrentLocation={true}
                            onLocationFound={handleUserLocationUpdate}
                        />
                    </Card>
                </Col>

                {/* Charging Station List with Distance Sorting */}
                <Col xs={24} lg={8}>
                    <ChargingStationList
                        stations={enhancedStations}
                        onStationSelect={handleStationSelect}
                        selectedStation={selectedStation}
                        searchText={searchText}
                        onSearchChange={setSearchText}
                    />
                </Col>

                {/* Selected Station Details */}
                {selectedStation && (
                    <Col span={24}>
                        <Card title="Station Details" loading={loading}>
                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        <div>
                                            <Text strong>Station Name:</Text>
                                            <br />
                                            <Text>{selectedStation.title}</Text>
                                        </div>
                                        <div>
                                            <Text strong>Address:</Text>
                                            <br />
                                            <Text>{selectedStation.address}</Text>
                                        </div>
                                        <div>
                                            <Text strong>Status:</Text>
                                            <br />
                                            <span
                                                style={{
                                                    color: getStatusColor(selectedStation.status),
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {selectedStation.status}
                                            </span>
                                        </div>
                                    </Space>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        <div>
                                            <Text strong>Power Output:</Text>
                                            <br />
                                            <Text>{selectedStation.power}</Text>
                                        </div>
                                        <div>
                                            <Text strong>Price:</Text>
                                            <br />
                                            <Text>{selectedStation.price}</Text>
                                        </div>
                                        <div>
                                            <Text strong>Connector Types:</Text>
                                            <br />
                                            <Text>{selectedStation.chargerTypes?.join(', ')}</Text>
                                        </div>
                                    </Space>
                                </Col>
                            </Row>

                            {/* Charging Points Section */}
                            {stationDetails?.chargingPoints && stationDetails.chargingPoints.length > 0 && (
                                <>
                                    <Row style={{ marginTop: '24px' }}>
                                        <Col span={24}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text strong style={{ fontSize: '16px' }}>Available Charging Points:</Text>
                                                <div style={{ fontSize: '12px' }}>
                                                    <Tag color="success" size="small">Available</Tag>
                                                    <Tag color="warning" size="small">Reserved</Tag>
                                                    <Tag color="processing" size="small">Occupied</Tag>
                                                    <Tag color="error" size="small">Offline</Tag>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                                        {stationDetails.chargingPoints.map((point, index) => (
                                            <Col xs={24} sm={12} md={8} lg={6} key={point.pointId || index}>
                                                <Card
                                                    size="small"
                                                    style={{
                                                        borderColor: getStatusColor(point.status),
                                                        borderWidth: '2px'
                                                    }}
                                                >
                                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Text strong>{point.name || `Point ${index + 1}`}</Text>
                                                            <Badge
                                                                status={point.status === 'available' ? 'success' :
                                                                    point.status === 'occupied' || point.status === 'busy' ? 'warning' :
                                                                        'error'}
                                                            />
                                                        </div>

                                                        <div>
                                                            <Text type="secondary">Type:</Text>
                                                            <br />
                                                            <Tag
                                                                color={
                                                                    point.status === 'available' ? 'success' :
                                                                        point.status === 'reserved' ? 'warning' :
                                                                            point.status === 'offline' || point.status === 'maintenance' ? 'error' :
                                                                                point.status === 'occupied' || point.status === 'busy' ? 'processing' :
                                                                                    'default'
                                                                }
                                                            >
                                                                {point.connectorType || point.type || 'Unknown'}
                                                            </Tag>
                                                        </div>                                                        <div>
                                                            <Text type="secondary">Power:</Text>
                                                            <br />
                                                            <Text>{point.powerOutput || point.power || 'N/A'}</Text>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div>
                                                                <Text type="secondary">Status:</Text>
                                                                <br />
                                                                <Tag
                                                                    color={
                                                                        point.status === 'available' ? 'green' :
                                                                            point.status === 'occupied' || point.status === 'busy' ? 'orange' :
                                                                                point.status === 'reserved' ? 'blue' :
                                                                                    'red'
                                                                    }
                                                                    icon={getStatusIcon(point.status)}
                                                                >
                                                                    {point.status || 'Unknown'}
                                                                </Tag>
                                                            </div>
                                                        </div>

                                                        {point.estimatedWaitTime && point.status !== 'available' && (
                                                            <div>
                                                                <Text type="secondary">Est. Wait:</Text>
                                                                <br />
                                                                <Text style={{ color: '#faad14' }}>{point.estimatedWaitTime}</Text>
                                                            </div>
                                                        )}
                                                    </Space>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>

                                    {/* Summary Stats */}
                                    <Row style={{ marginTop: '16px' }}>
                                        <Col span={24}>
                                            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                                                <Row gutter={16} style={{ textAlign: 'center' }}>
                                                    <Col span={6}>
                                                        <Text strong style={{ color: '#52c41a' }}>
                                                            {stationDetails.chargingPoints.filter(p => p.status === 'available').length}
                                                        </Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>Available</Text>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Text strong style={{ color: '#faad14' }}>
                                                            {stationDetails.chargingPoints.filter(p => p.status === 'occupied' || p.status === 'busy').length}
                                                        </Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>Occupied</Text>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Text strong style={{ color: '#1890ff' }}>
                                                            {stationDetails.chargingPoints.filter(p => p.status === 'reserved').length}
                                                        </Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>Reserved</Text>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Text strong style={{ color: '#ff4d4f' }}>
                                                            {stationDetails.chargingPoints.filter(p => p.status === 'offline' || p.status === 'maintenance').length}
                                                        </Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>Offline</Text>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        </Col>
                                    </Row>
                                </>
                            )}

                            <div style={{ marginTop: '24px' }}>
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<EnvironmentOutlined />}
                                        onClick={() => getDirections(selectedStation)}
                                    >
                                        Get Directions
                                    </Button>
                                    <Button
                                        type="default"
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                                        onClick={() => {
                                            // Navigate to payment page with station data
                                            navigate('/payment', {
                                                state: {
                                                    station: selectedStation,
                                                    stationDetails: stationDetails
                                                }
                                            });
                                        }}
                                        disabled={!stationDetails?.chargingPoints?.some(p => p.status === 'available')}
                                    >
                                        Reserve Station
                                    </Button>
                                    <Button onClick={() => {
                                        setSelectedStation(null);
                                        setStationDetails(null);
                                    }}>
                                        Close Details
                                    </Button>
                                </Space>
                            </div>
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default MapPage;

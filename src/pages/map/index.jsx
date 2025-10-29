import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Typography, message } from 'antd';
import { EnvironmentOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import MapComponent from '../../components/map';
import ChargingStationList from '../../components/chargingstation-list';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStations } from '../../redux/slices/stationSlice';

const { Title, Text } = Typography;

const MapPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedStation, setSelectedStation] = useState(null);
    const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]); // Ho Chi Minh City
    const [mapZoom, setMapZoom] = useState(13);

    const dispatch = useDispatch();
    const { stations: chargingStations } = useSelector(state => state.stations || { stations: [] });

    useEffect(() => {
        dispatch(fetchStations());
    }, [dispatch]);

    // Note: Station filtering is now handled by ChargingStationList component

    // Handle map click
    const handleMapClick = (e) => {
        const { lat, lng } = e.latlng;
        console.log('Map clicked at:', lat, lng);
        // You can add functionality to add new stations or get location info
    };

    // Handle station selection
    const handleStationSelect = (station) => {
        setSelectedStation(station);
        setMapCenter([station.lat, station.lng]);
        setMapZoom(16);
    };

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
    };

    // Get directions to station
    const getDirections = (station) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
        window.open(url, '_blank');
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
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
                            </Space>
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
                            markers={chargingStations}
                            onMapClick={handleMapClick}
                            showCurrentLocation={true}
                        />
                    </Card>
                </Col>

                {/* Charging Station List with Distance Sorting */}
                <Col xs={24} lg={8}>
                    <ChargingStationList
                        stations={chargingStations}
                        onStationSelect={handleStationSelect}
                        selectedStation={selectedStation}
                        searchText={searchText}
                        onSearchChange={setSearchText}
                    />
                </Col>

                {/* Selected Station Details */}
                {selectedStation && (
                    <Col span={24}>
                        <Card title="Station Details">
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
                                            <Text>{selectedStation.chargerTypes.join(', ')}</Text>
                                        </div>
                                    </Space>
                                </Col>
                            </Row>
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
                                            navigate('/payment', { state: { station: selectedStation } });
                                        }}
                                    >
                                        Reserve Station
                                    </Button>
                                    <Button onClick={() => setSelectedStation(null)}>
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

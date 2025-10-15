import React, { useState } from 'react';
import { Card, Row, Col, Input, Button, Select, Spin, message, Space, Typography } from 'antd';
import { SearchOutlined, EnvironmentOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import MapComponent from '../../components/map';

const { Title, Text } = Typography;
const { Option } = Select;

const MapPage = () => {
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedStation, setSelectedStation] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]); // Ho Chi Minh City
    const [mapZoom, setMapZoom] = useState(13);

    // Sample EV charging stations data - in real app, this would come from API
    const chargingStations = [
        {
            id: 1,
            title: "VinFast Charging Station - District 1",
            description: "Fast charging station with multiple connectors",
            lat: 10.7769,
            lng: 106.7009,
            address: "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
            status: "Available",
            type: "charging-station",
            chargerTypes: ["CCS", "CHAdeMO", "Type 2"],
            power: "50kW",
            price: "5,000 VND/kWh"
        },
        {
            id: 2,
            title: "EVN Charging Hub - District 3",
            description: "Public charging station near shopping center",
            lat: 10.7830,
            lng: 106.6950,
            address: "456 Le Van Sy Street, District 3, Ho Chi Minh City",
            status: "Occupied",
            type: "charging-station",
            chargerTypes: ["Type 2", "CCS"],
            power: "22kW",
            price: "3,500 VND/kWh"
        },
        {
            id: 3,
            title: "Green Energy Station - District 7",
            description: "Solar-powered charging station",
            lat: 10.7309,
            lng: 106.7182,
            address: "789 Nguyen Thi Thap Street, District 7, Ho Chi Minh City",
            status: "Available",
            type: "charging-station",
            chargerTypes: ["CCS", "Type 2"],
            power: "75kW",
            price: "4,200 VND/kWh"
        },
        {
            id: 4,
            title: "EV Charge Point - Binh Thanh",
            description: "24/7 charging facility",
            lat: 10.8014,
            lng: 106.7109,
            address: "321 Xo Viet Nghe Tinh Street, Binh Thanh District",
            status: "Available",
            type: "charging-station",
            chargerTypes: ["CHAdeMO", "CCS"],
            power: "100kW",
            price: "6,000 VND/kWh"
        },
        {
            id: 5,
            title: "Smart Charge Station - Tan Binh",
            description: "AI-powered charging management",
            lat: 10.8006,
            lng: 106.6533,
            address: "654 Cong Hoa Street, Tan Binh District",
            status: "Maintenance",
            type: "charging-station",
            chargerTypes: ["Type 2"],
            power: "22kW",
            price: "3,800 VND/kWh"
        }
    ];

    // Filter stations based on search and status
    const filteredStations = chargingStations.filter(station => {
        const matchesSearch = searchText === '' ||
            station.title.toLowerCase().includes(searchText.toLowerCase()) ||
            station.address.toLowerCase().includes(searchText.toLowerCase());

        const matchesStatus = filterStatus === 'all' || station.status.toLowerCase() === filterStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

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
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            message.success('Charging stations updated successfully');
        } catch {
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
                                    <EnvironmentOutlined style={{ marginRight: 12, color: '#1890ff' }} />
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

                {/* Search and Filters */}
                <Col span={24}>
                    <Card>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8}>
                                <Input
                                    placeholder="Search stations by name or address..."
                                    prefix={<SearchOutlined />}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Select
                                    style={{ width: '100%' }}
                                    placeholder="Filter by status"
                                    value={filterStatus}
                                    onChange={setFilterStatus}
                                >
                                    <Option value="all">All Stations</Option>
                                    <Option value="available">Available</Option>
                                    <Option value="occupied">Occupied</Option>
                                    <Option value="maintenance">Under Maintenance</Option>
                                </Select>
                            </Col>
                            <Col xs={24} sm={24} md={8}>
                                <Text type="secondary">
                                    Found {filteredStations.length} charging stations
                                </Text>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Map */}
                <Col xs={24} lg={16}>
                    <Card title="Interactive Map" style={{ height: '600px' }}>
                        <MapComponent
                            center={mapCenter}
                            zoom={mapZoom}
                            height="520px"
                            markers={filteredStations}
                            onMapClick={handleMapClick}
                            showCurrentLocation={true}
                        />
                    </Card>
                </Col>

                {/* Station List */}
                <Col xs={24} lg={8}>
                    <Card
                        title="Charging Stations"
                        style={{ height: '600px' }}
                        bodyStyle={{ padding: 0, overflow: 'auto', height: '520px' }}
                    >
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '50px' }}>
                                <Spin size="large" />
                            </div>
                        ) : (
                            <div>
                                {filteredStations.map((station) => (
                                    <div
                                        key={station.id}
                                        style={{
                                            padding: '16px',
                                            borderBottom: '1px solid #f0f0f0',
                                            cursor: 'pointer',
                                            backgroundColor: selectedStation?.id === station.id ? '#e6f7ff' : 'white',
                                            transition: 'background-color 0.3s'
                                        }}
                                        onClick={() => handleStationSelect(station)}
                                    >
                                        <div style={{ marginBottom: '8px' }}>
                                            <Text strong style={{ fontSize: '14px' }}>
                                                {station.title}
                                            </Text>
                                            <div style={{ float: 'right' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        backgroundColor: getStatusColor(station.status),
                                                        marginRight: '4px'
                                                    }}
                                                />
                                                <Text style={{ fontSize: '12px' }}>
                                                    {station.status}
                                                </Text>
                                            </div>
                                        </div>

                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {station.description}
                                        </Text>

                                        <div style={{ marginTop: '8px' }}>
                                            <Text style={{ fontSize: '11px', color: '#666' }}>
                                                📍 {station.address}
                                            </Text>
                                        </div>

                                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <Text style={{ fontSize: '11px' }}>
                                                    ⚡ {station.power} • {station.price}
                                                </Text>
                                            </div>
                                            <Button
                                                size="small"
                                                type="link"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    getDirections(station);
                                                }}
                                            >
                                                Directions
                                            </Button>
                                        </div>

                                        <div style={{ marginTop: '4px' }}>
                                            <Text style={{ fontSize: '10px', color: '#999' }}>
                                                Connectors: {station.chargerTypes.join(', ')}
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
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

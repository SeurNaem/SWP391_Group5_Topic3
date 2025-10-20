import React from 'react';
import { Card, Tag, Space, Typography, Button, Tooltip } from 'antd';
import {
    EnvironmentOutlined,
    ThunderboltOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    CarOutlined
} from '@ant-design/icons';
import { formatDistance, estimateTravelTime } from '../../utils/LocationService';

const { Text, Title } = Typography;

const StationCard = ({
    station,
    onStationSelect,
    isSelected = false
}) => {
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
                <div>
                    <Text style={{ fontSize: '12px', color: '#666' }}>Connectors: </Text>
                    {station.chargerTypes?.map((type, index) => (
                        <Tag
                            key={index}
                            size="small"
                            style={{ fontSize: '10px', margin: '0 2px' }}
                        >
                            {type}
                        </Tag>
                    ))}
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
                            // Handle reservation logic
                            console.log('Reserve station:', station.id);
                        }}
                    >
                        Reserve
                    </Button>
                </Tooltip>
            </div>
        </Card>
    );
};

export default StationCard;

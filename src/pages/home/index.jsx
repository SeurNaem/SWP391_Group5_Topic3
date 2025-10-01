import React, { useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, Button, Space, Timeline, Progress, Avatar } from 'antd';
import {
    UserOutlined,
    ShoppingOutlined,
    HomeOutlined,
    TrophyOutlined,
    ArrowUpOutlined,
    PlusOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../redux/slices/categorySlice';
import { fetchStations } from '../../redux/slices/stationSlice';

const { Title, Text, Paragraph } = Typography;

const Home = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { categories, loading: categoryLoading } = useSelector(state => state.categories);
    const { stations, loading: stationLoading } = useSelector(state => state.stations);

    const loading = categoryLoading || stationLoading;

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchStations());
    }, [dispatch]);

    const quickActions = [
        {
            title: 'Add Category',
            description: 'Create a new category',
            icon: <PlusOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
            action: () => navigate('/category'),
            color: '#f6ffed'
        },
        {
            title: 'Manage Stations',
            description: 'View and manage stations',
            icon: <HomeOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
            action: () => navigate('/station'),
            color: '#f0f9ff'
        },
        {
            title: 'Settings',
            description: 'Configure system settings',
            icon: <SettingOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
            action: () => navigate('/settings'),
            color: '#f9f0ff'
        }
    ];

    const recentActivities = [
        {
            time: '2 hours ago',
            description: 'New category "Vietnamese Cuisine" was created',
            color: 'green'
        },
        {
            time: '4 hours ago',
            description: 'Station "Downtown Branch" was updated',
            color: 'blue'
        },
        {
            time: '1 day ago',
            description: 'System backup completed successfully',
            color: 'gray'
        },
        {
            time: '2 days ago',
            description: 'New user registered: john.doe@example.com',
            color: 'green'
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
            {/* Welcome Header */}
            <div style={{ marginBottom: '32px' }}>
                <Title level={1} style={{ margin: 0, color: '#1890ff' }}>
                    Welcome to Management Dashboard
                </Title>
                <Paragraph style={{ fontSize: '16px', color: '#666', marginTop: '8px' }}>
                    Monitor your business performance and manage your resources efficiently
                </Paragraph>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Categories"
                            value={categories?.length || 0}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<ShoppingOutlined />}
                            suffix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Active Stations"
                            value={stations?.length || 0}
                            precision={0}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<HomeOutlined />}
                            suffix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Active Users"
                            value={248}
                            precision={0}
                            valueStyle={{ color: '#722ed1' }}
                            prefix={<UserOutlined />}
                            suffix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Revenue"
                            value={54280}
                            precision={2}
                            valueStyle={{ color: '#cf1322' }}
                            prefix="$"
                            suffix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Main Content Row */}
            <Row gutter={[24, 24]}>
                {/* Quick Actions */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Space>
                                <TrophyOutlined style={{ color: '#faad14' }} />
                                <span>Quick Actions</span>
                            </Space>
                        }
                        style={{ height: '100%' }}
                    >
                        <Row gutter={[16, 16]}>
                            {quickActions.map((action, index) => (
                                <Col xs={24} sm={8} key={index}>
                                    <Card
                                        hoverable
                                        style={{
                                            textAlign: 'center',
                                            backgroundColor: action.color,
                                            border: 'none',
                                            borderRadius: '12px'
                                        }}
                                        bodyStyle={{ padding: '24px 16px' }}
                                        onClick={action.action}
                                    >
                                        <div style={{ marginBottom: '12px' }}>
                                            {action.icon}
                                        </div>
                                        <Title level={5} style={{ margin: '8px 0 4px 0' }}>
                                            {action.title}
                                        </Title>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {action.description}
                                        </Text>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Col>

                {/* Recent Activities */}
                <Col xs={24} lg={8}>
                    <Card
                        title="Recent Activities"
                        style={{ height: '100%' }}
                        extra={<Button type="link" size="small">View All</Button>}
                    >
                        <Timeline
                            items={recentActivities.map((activity, index) => ({
                                color: activity.color,
                                children: (
                                    <div key={index}>
                                        <Text style={{ fontSize: '13px', fontWeight: '500' }}>
                                            {activity.description}
                                        </Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            {activity.time}
                                        </Text>
                                    </div>
                                )
                            }))}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Performance Overview */}
            <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
                <Col xs={24} lg={12}>
                    <Card title="System Performance">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                                <Text>CPU Usage</Text>
                                <Progress percent={65} status="active" strokeColor="#52c41a" />
                            </div>
                            <div>
                                <Text>Memory Usage</Text>
                                <Progress percent={45} status="active" strokeColor="#1890ff" />
                            </div>
                            <div>
                                <Text>Storage Usage</Text>
                                <Progress percent={78} status="active" strokeColor="#faad14" />
                            </div>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Team Overview">
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Space>
                                    <Avatar icon={<UserOutlined />} />
                                    <div>
                                        <Text strong>Admin User</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>System Administrator</Text>
                                    </div>
                                </Space>
                                <Text type="success">Online</Text>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Space>
                                    <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                                    <div>
                                        <Text strong>Manager</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Operations Manager</Text>
                                    </div>
                                </Space>
                                <Text type="warning">Away</Text>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Space>
                                    <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                                    <div>
                                        <Text strong>Staff Member</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Support Staff</Text>
                                    </div>
                                </Space>
                                <Text type="secondary">Offline</Text>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Home;

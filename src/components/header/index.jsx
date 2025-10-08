import React from 'react';
import {
    UserOutlined,
    LogoutOutlined,
    LoginOutlined,
    UserAddOutlined,
    BellOutlined,
    SettingOutlined,
    HomeOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    Layout,
    Button,
    Dropdown,
    Avatar,
    Space,
    Typography,
    Input,
    Badge,
    Menu,
    theme
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/accountSlice';

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { Search } = Input;

const Header = () => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.account);
    const navigate = useNavigate();

    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const handleLogout = () => {
        localStorage.removeItem('user');
        dispatch(logout());
        navigate('/login');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/register');
    };

    const handleHome = () => {
        navigate('/');
    };

    const onSearch = (value) => {
        console.log('Search:', value);
        // Implement search functionality here
    };

    // Dropdown menu items for logged-in user
    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'My Profile',
            onClick: () => {
                // Navigate to profile page
                console.log('Navigate to profile');
            }
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
            onClick: () => {
                // Navigate to settings page
                console.log('Navigate to settings');
            }
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: handleLogout,
            danger: true,
        },
    ];

    // Notification dropdown items
    const notificationItems = [
        {
            key: '1',
            label: (
                <div>
                    <Text strong>System Maintenance</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Scheduled maintenance at 2:00 AM
                    </Text>
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <div>
                    <Text strong>Welcome!</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Welcome to the charging station management system
                    </Text>
                </div>
            ),
        },
        {
            type: 'divider',
        },
        {
            key: 'viewAll',
            label: (
                <Text style={{ color: '#1890ff', textAlign: 'center', display: 'block' }}>
                    View All Notifications
                </Text>
            ),
        },
    ];

    const renderUserSection = () => {
        if (user && user.email) {
            // User is logged in - show user info, notifications, and dropdown
            return (
                <Space size="middle">
                    {/* Notifications */}
                    <Dropdown
                        menu={{ items: notificationItems }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Badge count={2} size="small">
                            <Button
                                type="text"
                                icon={<BellOutlined />}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '32px',
                                    width: '32px'
                                }}
                            />
                        </Badge>
                    </Dropdown>

                    {/* User Profile Dropdown */}
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={['hover', 'click']}
                    >
                        <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}>
                            <Avatar
                                size="small"
                                icon={<UserOutlined />}
                                style={{ backgroundColor: '#1890ff' }}
                                src={user.avatar} // If user has avatar image
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Text strong style={{ fontSize: '14px', lineHeight: '16px' }}>
                                    {user.fullName || user.name || 'User'}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px', lineHeight: '14px' }}>
                                    {user.role || 'User'}
                                </Text>
                            </div>
                        </Space>
                    </Dropdown>
                </Space>
            );
        } else {
            // User is not logged in - show login and register buttons
            return (
                <Space>
                    <Button
                        type="default"
                        icon={<LoginOutlined />}
                        onClick={handleLogin}
                        style={{ borderRadius: '6px' }}
                    >
                        Login
                    </Button>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={handleRegister}
                        style={{ borderRadius: '6px' }}
                    >
                        Register
                    </Button>
                </Space>
            );
        }
    };

    return (
        <AntHeader
            style={{
                padding: '0 24px',
                background: colorBgContainer,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderBottom: '1px solid #f0f0f0',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            {/* Left section - Logo and title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
                <Button
                    type="text"
                    icon={<HomeOutlined />}
                    onClick={handleHome}
                    style={{
                        fontSize: '18px',
                        height: '40px',
                        padding: '0 8px',
                        color: '#1890ff'
                    }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: '18px', color: '#1890ff', lineHeight: '20px' }}>
                        EV Charging Station
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px', lineHeight: '14px' }}>
                        Management System
                    </Text>
                </div>
            </div>

            {/* Center section - Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', flex: '1 1 auto', maxWidth: '500px', margin: '0 24px' }}>
                <Search
                    placeholder="Search stations, categories..."
                    allowClear
                    onSearch={onSearch}
                    style={{ width: '100%', maxWidth: '400px' }}
                    enterButton={<SearchOutlined />}
                    size="middle"
                />
            </div>

            {/* Right section - User controls */}
            <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
                {renderUserSection()}
            </div>
        </AntHeader>
    );
};

export default Header;

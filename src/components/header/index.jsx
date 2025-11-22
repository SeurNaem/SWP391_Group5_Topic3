import React, { useState } from 'react';
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
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/accountSlice';
import logo from '../../assets/logo.png';

const { Header: AntHeader } = Layout;
const { Text } = Typography;
const { Search } = Input;

const Header = () => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.account);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

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
                <Text style={{ color: '#4da0d6', textAlign: 'center', display: 'block' }}>
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
                    <div style={{ position: 'relative' }}>
                        <Space
                            style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            <Avatar
                                size="small"
                                icon={<UserOutlined />}
                                style={{ backgroundColor: '#4da0d6' }}
                                src={user.avatar}
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

                        {dropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid #d9d9d9',
                                borderRadius: '8px',
                                boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
                                zIndex: 1050,
                                minWidth: '160px',
                                padding: '4px 0',
                                marginTop: '4px'
                            }}>
                                <div
                                    style={{
                                        padding: '5px 12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '14px'
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDropdownOpen(false);
                                        navigate('/profile');
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    <UserOutlined />
                                    My Profile
                                </div>
                                <div
                                    style={{
                                        padding: '5px 12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '14px'
                                    }}
                                    onClick={() => {
                                        setDropdownOpen(false);
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    <SettingOutlined />
                                    Settings
                                </div>
                                <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '4px 0' }} />
                                <div
                                    style={{
                                        padding: '5px 12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '14px',
                                        color: '#ff4d4f'
                                    }}
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        handleLogout();
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fff2f0'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    <LogoutOutlined />
                                    Logout
                                </div>
                            </div>
                        )}
                    </div>
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
                        color: '#4da0d6'
                    }}
                />
                <img
                    src={logo}
                    alt="EV Charging Station Logo"
                    style={{
                        height: '40px',
                        width: 'auto',
                        cursor: 'pointer'
                    }}
                    onClick={handleHome}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: '18px', color: '#4da0d6', lineHeight: '20px' }}>
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

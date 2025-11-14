import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Avatar,
    message,
    Spin,
    Row,
    Col,
    Typography,
    Divider,
    Space,
    Layout,
    theme,
    Select
} from 'antd';
import {
    UserOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
    MailOutlined,
    PhoneOutlined,
    CalendarOutlined,
    LogoutOutlined,
    CarOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfile, updateUserProfile } from '../../service/user.api';
import { login, logout } from '../../redux/accountSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { themeColors } from '../../utils/theme';
import blankAvatar from '../../assets/blank.png';
import { createPortal } from 'react-dom';

const { Title, Text } = Typography;
const { Content, Header: AntHeader } = Layout;
const { Option } = Select; const ProfilePage = () => {
    console.log('=== PROFILE PAGE COMPONENT LOADING ===');

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const currentUser = useSelector((state) => state.account);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        token: { colorBgContainer },
    } = theme.useToken();

    // Vehicle type options
    const vehicleTypes = [
        { value: 'electric_car', label: 'Electric Car' },
        { value: 'hybrid_car', label: 'Hybrid Car' },
        { value: 'electric_motorcycle', label: 'Electric Motorcycle' },
        { value: 'electric_scooter', label: 'Electric Scooter' },
        { value: 'electric_bus', label: 'Electric Bus' },
        { value: 'electric_van', label: 'Electric Van' }
    ];

    console.log('Profile component mounted, currentUser:', currentUser);

    // Handle clicks outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close dropdown if clicking outside of it
            if (isDropdownOpen && !event.target.closest('.user-dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isDropdownOpen]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    // Toggle dropdown when avatar is clicked
    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    const user = {
        name: currentUser?.user?.fullName || currentUser?.fullName || "User",
        avatar: blankAvatar,
    };

    const fetchUserProfile = useCallback(async () => {
        try {
            setInitialLoading(true);

            // Try to fetch from API first
            try {
                const response = await getUserProfile();
                setUserProfile(response);

                // Populate form with user data
                form.setFieldsValue({
                    fullName: response.fullName || '',
                    email: response.email || '',
                    phoneNumber: response.phoneNumber || '',
                    address: response.address || '',
                    dateOfBirth: response.dateOfBirth || '',
                    vehicleType: response.vehicleType || '',
                    licensePlate: response.licensePlate || '',
                });
            } catch (apiError) {
                console.log('API call failed, using mock data:', apiError);

                // Use mock data when API fails (CORS issue)
                const mockProfile = {
                    fullName: currentUser?.fullName || 'User Name',
                    email: currentUser?.email || 'user@example.com',
                    phoneNumber: '+1 234 567 8900',
                    address: '123 Main Street, City, State 12345',
                    dateOfBirth: '1990-01-01',
                    avatar: currentUser?.avatar || '',
                    role: currentUser?.role || 'USER',
                    vehicleType: 'electric_car',
                    licensePlate: '29A-123.45',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: new Date().toISOString()
                };

                setUserProfile(mockProfile);

                // Populate form with mock data
                form.setFieldsValue({
                    fullName: mockProfile.fullName,
                    email: mockProfile.email,
                    phoneNumber: mockProfile.phoneNumber,
                    address: mockProfile.address,
                    dateOfBirth: mockProfile.dateOfBirth,
                    vehicleType: mockProfile.vehicleType,
                    licensePlate: mockProfile.licensePlate,
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            message.error('Failed to load profile data');
        } finally {
            setInitialLoading(false);
        }
    }, [form, currentUser]);    // Fetch user profile on component mount
    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    const handleUpdateProfile = async (values) => {
        try {
            setLoading(true);

            const updateData = {
                fullName: values.fullName,
                phoneNumber: values.phoneNumber,
                address: values.address,
                dateOfBirth: values.dateOfBirth,
                vehicleType: values.vehicleType,
                licensePlate: values.licensePlate,
            };

            const response = await updateUserProfile(updateData);

            // Update local state
            setUserProfile(response);

            // Update Redux store if needed
            if (currentUser) {
                dispatch(login({ ...currentUser, ...response }));
            }

            setEditMode(false);
            toast.success('Profile updated successfully!');
            message.success('Profile updated successfully!');

        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update profile';
            toast.error(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form to original values
        form.setFieldsValue({
            fullName: userProfile?.fullName || '',
            email: userProfile?.email || '',
            phoneNumber: userProfile?.phoneNumber || '',
            address: userProfile?.address || '',
            dateOfBirth: userProfile?.dateOfBirth || '',
            vehicleType: userProfile?.vehicleType || '',
            licensePlate: userProfile?.licensePlate || '',
        });
        setEditMode(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'Invalid date';
        }
    };

    if (initialLoading) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <AntHeader style={{
                    padding: "0 32px",
                    background: colorBgContainer,
                    position: 'relative',
                    borderBottom: '1px solid #f0f0f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                    {/* Header Content: WARP Logo and User Info */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            height: "100%",
                            maxWidth: "1200px",
                            margin: "0 auto",
                            width: "100%"
                        }}
                    >
                        {/* WARP Logo Button */}
                        <div
                            onClick={() => navigate("/")}
                            style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                letterSpacing: '0.15em',
                                cursor: 'pointer',
                                color: themeColors.primary,
                                transition: 'all 0.3s ease',
                                userSelect: 'none',
                                padding: '8px 0'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.color = '#0066cc';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.color = themeColors.primary;
                            }}
                        >
                            WARP
                        </div>

                        {/* User Profile Section */}
                        <div
                            className="user-dropdown-container"
                            style={{
                                position: 'relative',
                                cursor: 'pointer',
                                zIndex: 999
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    transition: 'background-color 0.2s ease',
                                    backgroundColor: 'transparent'
                                }}
                                onClick={toggleDropdown}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                }}
                            >
                                <span style={{
                                    fontWeight: '600',
                                    color: '#1F2937',
                                    fontSize: '16px'
                                }}>
                                    {currentUser?.user?.fullName || currentUser?.fullName || "User"}
                                </span>
                                <img
                                    src={user.avatar}
                                    alt="User Avatar"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: `2px solid ${themeColors.primary}`,
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>

                            {isDropdownOpen && createPortal(
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: '60px',
                                        right: '24px',
                                        width: '200px',
                                        backgroundColor: '#1F2937',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                                        border: '1px solid #374151',
                                        zIndex: 10000,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: '14px',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = themeColors.primary;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        My Profile
                                    </div>
                                    <div style={{
                                        height: '1px',
                                        backgroundColor: '#374151',
                                        margin: '8px 16px'
                                    }}></div>
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: '14px',
                                            color: '#F87171',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={handleLogout}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#DC2626';
                                            e.target.style.color = '#ffffff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.color = '#F87171';
                                        }}
                                    >
                                        Logout
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    </div>
                </AntHeader>
                <Content>
                    <div className="flex justify-center items-center min-h-screen">
                        <Spin size="large" />
                    </div>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AntHeader style={{
                padding: "0 32px",
                background: colorBgContainer,
                position: 'relative',
                borderBottom: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
                {/* Header Content: WARP Logo and User Info */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        height: "100%",
                        maxWidth: "1200px",
                        margin: "0 auto",
                        width: "100%"
                    }}
                >
                    {/* WARP Logo Button */}
                    <div
                        onClick={() => navigate("/")}
                        style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            letterSpacing: '0.15em',
                            cursor: 'pointer',
                            color: themeColors.primary,
                            transition: 'all 0.3s ease',
                            userSelect: 'none',
                            padding: '8px 0'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.color = '#0066cc';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.color = themeColors.primary;
                        }}
                    >
                        WARP
                    </div>

                    {/* User Profile Section */}
                    <div
                        className="user-dropdown-container"
                        style={{
                            position: 'relative',
                            cursor: 'pointer',
                            zIndex: 999
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                transition: 'background-color 0.2s ease',
                                backgroundColor: 'transparent'
                            }}
                            onClick={toggleDropdown}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                            }}
                        >
                            <span style={{
                                fontWeight: '600',
                                color: '#1F2937',
                                fontSize: '16px'
                            }}>
                                {currentUser?.user?.fullName || currentUser?.fullName || "User"}
                            </span>
                            <img
                                src={user.avatar}
                                alt="User Avatar"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: `2px solid ${themeColors.primary}`,
                                    objectFit: 'cover'
                                }}
                            />
                        </div>

                        {isDropdownOpen && createPortal(
                            <div
                                style={{
                                    position: 'fixed',
                                    top: '60px',
                                    right: '24px',
                                    width: '200px',
                                    backgroundColor: '#1F2937',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                                    border: '1px solid #374151',
                                    zIndex: 10000,
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = themeColors.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    My Profile
                                </div>
                                <div style={{
                                    height: '1px',
                                    backgroundColor: '#374151',
                                    margin: '8px 16px'
                                }}></div>
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        color: '#F87171',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={handleLogout}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#DC2626';
                                        e.target.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.color = '#F87171';
                                    }}
                                >
                                    Logout
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>
                </div>
            </AntHeader>
            <Content style={{
                padding: '32px 24px',
                background: '#f5f5f5',
                minHeight: 'calc(100vh - 64px)'
            }}>
                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    padding: '24px 0'
                }}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e8e8e8'
                        }}
                        title={
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 0'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <Avatar
                                        size={72}
                                        icon={<UserOutlined />}
                                        style={{
                                            backgroundColor: themeColors.primary,
                                            border: '3px solid #f0f0f0'
                                        }}
                                    />
                                    <div>
                                        <Title level={2} style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                                            {userProfile?.fullName || 'User Profile'}
                                        </Title>
                                        <Text type="secondary" style={{ fontSize: '16px', marginTop: '4px' }}>
                                            Manage your personal information
                                        </Text>
                                    </div>
                                </div>
                                {!editMode && (
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={() => setEditMode(true)}
                                        style={{
                                            height: '40px',
                                            borderRadius: '8px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                        }
                        bodyStyle={{
                            padding: '32px'
                        }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdateProfile}
                            disabled={!editMode}
                            style={{ marginTop: '8px' }}
                        >
                            <Row gutter={[32, 24]} style={{ marginBottom: '16px' }}>
                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Full Name</span>}
                                        name="fullName"
                                        rules={[
                                            { required: true, message: 'Please enter your full name' },
                                            { min: 2, message: 'Name must be at least 2 characters' }
                                        ]}
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Input
                                            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                            placeholder="Enter your full name"
                                            size="large"
                                            style={{
                                                borderRadius: '8px',
                                                height: '48px'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Email</span>}
                                        name="email"
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Input
                                            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                                            placeholder="Your email address"
                                            size="large"
                                            disabled
                                            type="email"
                                            style={{
                                                borderRadius: '8px',
                                                height: '48px',
                                                backgroundColor: '#f5f5f5'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Phone Number</span>}
                                        name="phoneNumber"
                                        rules={[
                                            { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' }
                                        ]}
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Input
                                            prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                                            placeholder="Enter your phone number"
                                            size="large"
                                            style={{
                                                borderRadius: '8px',
                                                height: '48px'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Date of Birth</span>}
                                        name="dateOfBirth"
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Input
                                            prefix={<CalendarOutlined style={{ color: '#bfbfbf' }} />}
                                            placeholder="YYYY-MM-DD"
                                            size="large"
                                            type="date"
                                            style={{
                                                borderRadius: '8px',
                                                height: '48px'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Address</span>}
                                        name="address"
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Input.TextArea
                                            placeholder="Enter your address"
                                            rows={4}
                                            size="large"
                                            style={{
                                                borderRadius: '8px',
                                                resize: 'none'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* Vehicle Information Section */}
                            <Divider orientation="left" style={{ margin: '32px 0 24px 0', fontSize: '16px', fontWeight: '600' }}>
                                Vehicle Information
                            </Divider>

                            <Row gutter={[32, 24]} style={{ marginBottom: '16px' }}>
                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Vehicle Type</span>}
                                        name="vehicleType"
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Select
                                            placeholder="Select your vehicle type"
                                            size="large"
                                            style={{
                                                borderRadius: '8px'
                                            }}
                                            suffixIcon={<CarOutlined style={{ color: '#bfbfbf' }} />}
                                        >
                                            {vehicleTypes.map(type => (
                                                <Option key={type.value} value={type.value}>
                                                    {type.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>License Plate Number</span>}
                                        name="licensePlate"
                                        rules={[
                                            {
                                                pattern: /^\d{2}[A-Z]-\d{3}\.\d{2}$/,
                                                message: 'Please enter valid format: DDLL-DDD.DD (e.g., 29A-123.45)'
                                            }
                                        ]}
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Input
                                            prefix={<CarOutlined style={{ color: '#bfbfbf' }} />}
                                            placeholder="e.g., 29A-123.45"
                                            size="large"
                                            style={{
                                                borderRadius: '8px',
                                                height: '48px'
                                            }}
                                            maxLength={10}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {editMode && (
                                <>
                                    <Divider style={{ margin: '32px 0 24px 0' }} />
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '12px'
                                    }}>
                                        <Button
                                            onClick={handleCancel}
                                            icon={<CloseOutlined />}
                                            size="large"
                                            style={{
                                                borderRadius: '8px',
                                                height: '44px',
                                                fontWeight: '500',
                                                minWidth: '120px'
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading}
                                            icon={<SaveOutlined />}
                                            size="large"
                                            style={{
                                                borderRadius: '8px',
                                                height: '44px',
                                                fontWeight: '500',
                                                minWidth: '140px'
                                            }}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>

                        {!editMode && userProfile && (
                            <div style={{ marginTop: '32px' }}>
                                <Divider style={{ margin: '24px 0' }} />
                                <Row gutter={[24, 16]}>
                                    <Col xs={24} sm={8}>
                                        <Card
                                            size="small"
                                            style={{
                                                textAlign: 'center',
                                                borderRadius: '8px',
                                                border: '1px solid #e8e8e8',
                                                background: '#fafafa'
                                            }}
                                            bodyStyle={{ padding: '20px 16px' }}
                                        >
                                            <Text strong style={{ fontSize: '14px', color: '#666' }}>
                                                Account Status
                                            </Text>
                                            <br />
                                            <Text style={{
                                                color: '#52c41a',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                marginTop: '8px',
                                                display: 'inline-block'
                                            }}>
                                                Active
                                            </Text>
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Card
                                            size="small"
                                            style={{
                                                textAlign: 'center',
                                                borderRadius: '8px',
                                                border: '1px solid #e8e8e8',
                                                background: '#fafafa'
                                            }}
                                            bodyStyle={{ padding: '20px 16px' }}
                                        >
                                            <Text strong style={{ fontSize: '14px', color: '#666' }}>
                                                Member Since
                                            </Text>
                                            <br />
                                            <Text style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                marginTop: '8px',
                                                display: 'inline-block'
                                            }}>
                                                {formatDate(userProfile.createdAt)}
                                            </Text>
                                        </Card>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Card
                                            size="small"
                                            style={{
                                                textAlign: 'center',
                                                borderRadius: '8px',
                                                border: '1px solid #e8e8e8',
                                                background: '#fafafa'
                                            }}
                                            bodyStyle={{ padding: '20px 16px' }}
                                        >
                                            <Text strong style={{ fontSize: '14px', color: '#666' }}>
                                                Last Updated
                                            </Text>
                                            <br />
                                            <Text style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                marginTop: '8px',
                                                display: 'inline-block'
                                            }}>
                                                {formatDate(userProfile.updatedAt)}
                                            </Text>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Vehicle Information Display */}
                                {(userProfile.vehicleType || userProfile.licensePlate) && (
                                    <>
                                        <Divider orientation="left" style={{ margin: '32px 0 24px 0', fontSize: '16px', fontWeight: '600' }}>
                                            Vehicle Information
                                        </Divider>
                                        <Row gutter={[24, 16]}>
                                            <Col xs={24} sm={12}>
                                                <Card
                                                    size="small"
                                                    style={{
                                                        textAlign: 'center',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e8e8e8',
                                                        background: '#f0f9ff'
                                                    }}
                                                    bodyStyle={{ padding: '20px 16px' }}
                                                >
                                                    <CarOutlined style={{ fontSize: '24px', color: themeColors.primary, marginBottom: '8px' }} />
                                                    <br />
                                                    <Text strong style={{ fontSize: '14px', color: '#666' }}>
                                                        Vehicle Type
                                                    </Text>
                                                    <br />
                                                    <Text style={{
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        marginTop: '8px',
                                                        display: 'inline-block'
                                                    }}>
                                                        {vehicleTypes.find(type => type.value === userProfile.vehicleType)?.label || 'Not specified'}
                                                    </Text>
                                                </Card>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <Card
                                                    size="small"
                                                    style={{
                                                        textAlign: 'center',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e8e8e8',
                                                        background: '#f0f9ff'
                                                    }}
                                                    bodyStyle={{ padding: '20px 16px' }}
                                                >
                                                    <CarOutlined style={{ fontSize: '24px', color: themeColors.primary, marginBottom: '8px' }} />
                                                    <br />
                                                    <Text strong style={{ fontSize: '14px', color: '#666' }}>
                                                        License Plate
                                                    </Text>
                                                    <br />
                                                    <Text style={{
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        marginTop: '8px',
                                                        display: 'inline-block',
                                                        fontFamily: 'monospace',
                                                        letterSpacing: '1px'
                                                    }}>
                                                        {userProfile.licensePlate || 'Not specified'}
                                                    </Text>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default ProfilePage;

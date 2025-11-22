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
    theme
} from 'antd';
import { Modal, InputNumber } from 'antd';
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
import { fetchWallets, topUpWallet } from '../../service/wallet.api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { themeColors } from '../../utils/theme';
import blankAvatar from '../../assets/blank.png';
import { createPortal } from 'react-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const { Content, Header: AntHeader } = Layout;

const ProfilePage = () => {
    console.log('=== PROFILE PAGE COMPONENT LOADING ===');

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [walletData, setWalletData] = useState(null);
    const [topUpModalVisible, setTopUpModalVisible] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(50);
    const [qrData, setQrData] = useState(null);
    const [isGeneratingQr, setIsGeneratingQr] = useState(false);
    const [isConfirmingTopUp, setIsConfirmingTopUp] = useState(false);
    const [topUpError, setTopUpError] = useState(null);

    const currentUser = useSelector((state) => state.account);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        token: { colorBgContainer },
    } = theme.useToken();

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

                // Map API response to expected profile structure
                const profileData = {
                    ...response,
                    phone: response.phoneNumber || response.phone || '', // Map phoneNumber to phone
                    status: response.status || 'Active', // Default status if not provided
                    createdAt: response.createdAt || new Date().toISOString(), // Default to current date if not provided
                    updatedAt: response.updatedAt || new Date().toISOString(), // Default to current date if not provided
                };

                setUserProfile(profileData);

                // Populate form with user data
                form.setFieldsValue({
                    fullName: profileData.fullName || '',
                    email: profileData.email || '',
                    phone: profileData.phone || '',
                    vehicleModel: profileData.vehicleModel || '',
                    licensePlate: profileData.licensePlate || '',
                    batteryCapacity: profileData.batteryCapacity || '',
                });
            } catch (apiError) {
                console.log('API call failed, using mock data:', apiError);

                // Use mock data when API fails (CORS issue)
                const mockProfile = {
                    fullName: currentUser?.fullName || 'User Name',
                    email: currentUser?.email || 'user@example.com',
                    phone: '+84900000001',
                    avatar: currentUser?.avatar || '',
                    role: currentUser?.role || 'USER',
                    status: 'Active',
                    vehicleModel: 'VinFast VF8',
                    licensePlate: '29A-123.45',
                    batteryCapacity: 1000,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: new Date().toISOString()
                };

                setUserProfile(mockProfile);

                // Populate form with mock data
                form.setFieldsValue({
                    fullName: mockProfile.fullName,
                    email: mockProfile.email,
                    phone: mockProfile.phone,
                    vehicleModel: mockProfile.vehicleModel,
                    licensePlate: mockProfile.licensePlate,
                    batteryCapacity: mockProfile.batteryCapacity,
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            message.error('Failed to load profile data');
        } finally {
            setInitialLoading(false);
        }
    }, [form, currentUser]);

    const fetchWalletInfo = useCallback(async () => {
        try {
            const resp = await fetchWallets();
            if (resp?.data && resp.data.length > 0) {
                // try to find wallet for current user, else take first
                const found = resp.data.find(w => {
                    const uid = currentUser?.user?.id || currentUser?.id;
                    return w.userId === uid || w.ownerId === uid;
                }) || resp.data[0];
                setWalletData(found);
            }
        } catch (err) {
            console.warn('Failed to load wallet info:', err);
        }
    }, [currentUser]);

    // Fetch user profile on component mount
    useEffect(() => {
        fetchUserProfile();
        // also fetch wallet info
        fetchWalletInfo();
    }, [fetchUserProfile, fetchWalletInfo]);

    const handleUpdateProfile = async (values) => {
        try {
            setLoading(true);

            const updateData = {
                fullName: values.fullName,
                phoneNumber: values.phone, // Map phone back to phoneNumber for API
                vehicleModel: values.vehicleModel,
                licensePlate: values.licensePlate,
                batteryCapacity: values.batteryCapacity,
            };

            const response = await updateUserProfile(updateData);

            // Map API response to expected profile structure
            const updatedProfileData = {
                ...response,
                phone: response.phoneNumber || response.phone || '', // Map phoneNumber to phone
                status: response.status || userProfile?.status || 'Active', // Preserve existing status
                createdAt: response.createdAt || userProfile?.createdAt || new Date().toISOString(),
                updatedAt: response.updatedAt || new Date().toISOString(), // Update the timestamp
            };

            // Update local state
            setUserProfile(updatedProfileData);

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
            phone: userProfile?.phone || '',
            vehicleModel: userProfile?.vehicleModel || '',
            licensePlate: userProfile?.licensePlate || '',
            batteryCapacity: userProfile?.batteryCapacity || '',
        });
        setEditMode(false);
    };

    const openTopUpModal = () => {
        setTopUpAmount(50);
        setQrData(null);
        setTopUpModalVisible(true);
    };

    const generateFakeQr = async () => {
        const orderId = Date.now();

        // Validation: first ensure minimum, then divisibility
        const amt = Number(topUpAmount);
        setTopUpError(null);
        if (!Number.isFinite(amt) || isNaN(amt)) {
            setTopUpError('The number should be a valid number');
            return;
        }

        if (amt < 10) {
            setTopUpError('The number should not be smaller than 10');
            return;
        }

        // Must be integer and divisible by 10
        if (!Number.isInteger(amt) || amt % 10 !== 0) {
            setTopUpError('The number should divide to 10');
            return;
        }

        setTopUpError(null);
        setIsGeneratingQr(true);

        // Try generating a VietQR from the external service
        try {
            const payload = {
                accountNo: "0919273869",
                accountName: "CAO THAI HUNG",
                acqId: "970422",
                amount: Number(topUpAmount) || 0,
                addInfo: `TOPUP_${orderId}`,
                template: "compact"
            };

            const res = await axios.post("https://api.vietqr.io/v2/generate", payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            const qrDataURL = res?.data?.data?.qrDataURL;
            const code = res?.data?.data?.qrCode || `VQR-${orderId}`;

            if (qrDataURL) {
                setQrData({ code, amount: topUpAmount, walletId: walletData?.walletId || walletData?.id || null, generatedAt: new Date().toISOString(), qrDataURL, accountName: payload.accountName, accountNo: payload.accountNo });
                setIsGeneratingQr(false);
                return;
            }
        } catch (err) {
            console.warn('VietQR generation failed, falling back to fake QR:', err?.message || err);
        }

        // Fallback: generate a local fake QR
        setTimeout(() => {
            const code = `BANKQR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
            const payloadFallback = {
                code,
                amount: topUpAmount,
                walletId: walletData?.walletId || walletData?.id || null,
                generatedAt: new Date().toISOString(),
                accountName: "CAO THAI HUNG",
                accountNo: "0919273869"
            };
            setQrData(payloadFallback);
            setIsGeneratingQr(false);
        }, 400);
    };

    const confirmTopUp = async () => {
        if (!qrData) {
            message.error('Please generate the QR before confirming');
            return;
        }

        setIsConfirmingTopUp(true);
        const walletId = walletData?.walletId || walletData?.id || null;
        try {
            console.log('ConfirmTopUp: starting', { walletData, topUpAmount, walletId, qrData });
            // Try calling backend top-up endpoint; if it fails we'll fallback to local update
            let resp = null;
            if (walletId) {
                try {
                    // include QR code info if available
                    const meta = qrData ? { transactionCode: qrData.code, generatedAt: qrData.generatedAt } : {};
                    resp = await topUpWallet(walletId, topUpAmount, meta);
                    console.log('ConfirmTopUp: topUp API response', resp);
                } catch (err) {
                    console.warn('TopUp API failed, falling back to local update', err);
                }
            }

            // If backend returned updated wallet info, use it. Otherwise do a local immutable update.
            let updatedWallet = null;
            if (resp && resp.data) {
                // API may return wallet object or simple payload; handle common shapes
                if (resp.data.wallet) updatedWallet = resp.data.wallet;
                else if (resp.data.balance !== undefined) updatedWallet = { ...(walletData || {}), ...resp.data };
                else updatedWallet = resp.data;
            }

            if (!updatedWallet) {
                const oldBalance = walletData?.balance || 0;
                const newBalance = oldBalance + Number(topUpAmount || 0);
                updatedWallet = { ...(walletData || {}), balance: newBalance };
            }

            setWalletData(updatedWallet);

            if (currentUser) {
                let newAccount = null;
                if (currentUser.user) {
                    newAccount = { ...currentUser, user: { ...currentUser.user, wallet: updatedWallet } };
                } else {
                    newAccount = { ...currentUser, wallet: updatedWallet };
                }
                dispatch(login(newAccount));
                console.log('ConfirmTopUp: dispatched new account', newAccount);
            }

            message.success(`Top-up of $${topUpAmount} completed`);
            setTopUpModalVisible(false);
        } catch (error) {
            console.error('Top-up failed:', error);
            message.error('Top-up failed');
        } finally {
            setIsConfirmingTopUp(false);
        }
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
                                padding: '24px 0'
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
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '24px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <Text style={{ fontSize: '12px', color: '#666', display: 'block' }}>
                                                E-wallet Balance
                                            </Text>
                                            <Text style={{
                                                color: '#fa8c16',
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                display: 'block'
                                            }}>
                                                ${(
                                                    walletData?.balance ??
                                                    currentUser?.user?.wallet?.balance ??
                                                    currentUser?.wallet?.balance ??
                                                    0
                                                ).toFixed(2)}
                                            </Text>
                                        </div>
                                        <Button
                                            type="primary"
                                            onClick={openTopUpModal}
                                            style={{
                                                height: '40px',
                                                borderRadius: '8px',
                                                fontWeight: '500',
                                                minWidth: '80px'
                                            }}
                                        >
                                            Top Up
                                        </Button>
                                    </div>
                                    {!editMode && (
                                        <Button
                                            type="primary"
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
                                <Col xs={24}>
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

                                <Col xs={24}>
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

                                <Col xs={24}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Phone Number</span>}
                                        name="phone"
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
                            </Row>

                            {/* Vehicle Information Section */}
                            <Divider orientation="left" style={{ margin: '32px 0 24px 0', fontSize: '16px', fontWeight: '600' }}>
                                Vehicle Information
                            </Divider>

                            <Row gutter={[32, 24]} style={{ marginBottom: '16px' }}>
                                <Col xs={24}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Vehicle Model</span>}
                                        name="vehicleModel"
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Input
                                            prefix={<CarOutlined style={{ color: '#bfbfbf' }} />}
                                            placeholder="Enter your vehicle model"
                                            size="large"
                                            style={{
                                                borderRadius: '8px',
                                                height: '48px'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
                                    <Form.Item
                                        label={<span style={{ fontSize: '14px', fontWeight: '500' }}>Battery Capacity (Wh)</span>}
                                        name="batteryCapacity"
                                        style={{ marginBottom: '24px' }}
                                    >
                                        <Input
                                            prefix={<CarOutlined style={{ color: '#bfbfbf' }} />}
                                            placeholder="Enter battery capacity"
                                            size="large"
                                            type="number"
                                            style={{
                                                borderRadius: '8px',
                                                height: '48px'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
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

                                {/* User Information Summary */}
                                <Row gutter={[24, 16]} style={{ marginBottom: '24px' }}>
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
                                                color: userProfile?.status === 'Active' ? '#52c41a' : '#ff4d4f',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                marginTop: '8px',
                                                display: 'inline-block'
                                            }}>
                                                {userProfile?.status || 'Unknown'}
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
                            </div>
                        )}
                    </Card>

                    {/* Top-up Modal (fake bank QR) */}
                    <Modal
                        title="Top Up E-wallet"
                        visible={topUpModalVisible}
                        onCancel={() => setTopUpModalVisible(false)}
                        footer={null}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <Text strong>Amount (USD)</Text>
                                <br />
                                <InputNumber
                                    min={1}
                                    step={10}
                                    precision={0}
                                    value={topUpAmount}
                                    onChange={(val) => setTopUpAmount(val)}
                                    style={{ width: '100%', marginTop: 8 }}
                                />
                                {topUpError && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text type="danger">{topUpError}</Text>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Button type="default" onClick={() => setTopUpAmount(50)} style={{ marginRight: 8 }}>50</Button>
                                    <Button type="default" onClick={() => setTopUpAmount(100)} style={{ marginRight: 8 }}>100</Button>
                                    <Button type="default" onClick={() => setTopUpAmount(200)}>200</Button>
                                </div>
                                <div>
                                    <Button type="primary" onClick={generateFakeQr} loading={isGeneratingQr}>
                                        Generate Bank QR
                                    </Button>
                                </div>
                            </div>

                            {qrData && (
                                <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {qrData.qrDataURL ? (
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'center', 
                                            alignItems: 'center',
                                            marginBottom: 20
                                        }}>
                                            <img 
                                                src={qrData.qrDataURL} 
                                                alt="VietQR" 
                                                style={{ 
                                                    width: 350, 
                                                    height: 350, 
                                                    background: '#fff', 
                                                    padding: 16,
                                                    borderRadius: 8,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }} 
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            display: 'inline-block', 
                                            padding: 16, 
                                            border: '4px solid #000', 
                                            background: '#fff',
                                            marginBottom: 20
                                        }}>
                                            {/* Simple visual placeholder for QR */}
                                            <div style={{ width: 300, height: 300, display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 2 }}>
                                                {Array.from({ length: 81 }).map((_, i) => (
                                                    <div key={i} style={{ backgroundColor: Math.random() > 0.5 ? '#000' : '#fff' }} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 8 }}>
                                        <Button type="primary" onClick={confirmTopUp} loading={isConfirmingTopUp} size="large">
                                            Confirm Top Up
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Modal>
                </div>
            </Content>
        </Layout>
    );
};

export default ProfilePage;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    Card,
    Row,
    Col,
    Button,
    Space,
    Typography,
    Divider,
    Alert,
    Steps,
    Form,
    InputNumber,
    Input,
    Select,
    message,
    Spin
} from 'antd';
import {
    ArrowLeftOutlined,
    CreditCardOutlined,
    WalletOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    ThunderboltOutlined,
    ReloadOutlined,
    CarOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchWallets, deductFromWallet } from '../../service/wallet.api';
import { createReservation } from '../../service/reservation.api';
import { getUserProfile } from '../../service/user.api';
import { getVehicleByDriverId } from '../../service/vehicle-sim.api';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;

/**
 * Connector compatibility matrix
 * Maps vehicle connector types to compatible charging point types
 */
const CONNECTOR_COMPATIBILITY = {
    'CCS': ['CCS'],                    // CCS vehicles only work with CCS charging points
    'CHAdeMO': ['CHAdeMO'],           // CHAdeMO vehicles only work with CHAdeMO charging points  
    'Type2': ['AC', 'Type2'],         // Type2 vehicles work with AC and Type2 charging points
    'Type 2': ['AC', 'Type2'],        // Alternative spelling
    'Type1': ['AC'],                  // Type1 vehicles work with AC charging points
    'Type 1': ['AC'],                 // Alternative spelling
};

/**
 * PaymentPage Component
 * 
 * NOTE FOR BACKEND DEVELOPERS:
 * This component currently uses simulated charging sessions because the following 
 * API endpoints are missing from the backend implementation:
 * 
 * MISSING ENDPOINTS (based on api-spec.json):
 * - POST /api/Reservation (or /api/ChargingSession)
 * - GET /api/Reservation/{id}
 * - GET /api/Reservation/user (get user's active sessions)
 * - PUT /api/Reservation/{id}/status (start/stop charging)
 * 
 * AVAILABLE ENDPOINTS:
 * - /api/Payment (payments)
 * - /api/Wallet (wallet operations) 
 * - /api/ChargingStation (station data)
 * - /api/User (user management)
 * - /api/Auth (authentication)
 * 
 * EXPECTED RESERVATION/SESSION PAYLOAD:
 * {
 *   "stationId": number,
 *   "chargingPointId": number, 
 *   "userId": number,
 *   "vehicleModel": string,
 *   "startTime": string (ISO),
 *   "endTime": string (ISO),
 *   "estimatedCost": number
 * }
 * 
 * When reservation endpoints are implemented, replace the simulation logic
 * in the handlePayment function with actual API calls.
 */

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();

    // Get user account from Redux store
    const account = useSelector(state => state.account);

    // Get station data from navigation state
    const stationData = location.state?.station;

    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [walletData, setWalletData] = useState(null);
    const [chargingDuration, setChargingDuration] = useState(1); // Default 1 minute for ultra-quick demo
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [reservationData, setReservationData] = useState({
        vehicleModel: '',
        licensePlate: '',
        selectedChargingPoint: null
    });
    const [vehicleData, setVehicleData] = useState(null);
    const [connectorCompatibilityError, setConnectorCompatibilityError] = useState('');

    // Get charging points from the station data
    const availableChargingPoints = useMemo(() => {
        return stationData?.chargingPoints?.map(point => ({
            id: point.pointId,
            name: `${point.connectorType} - ${point.maxPower}kW`,
            type: point.connectorType,
            power: `${point.maxPower}kW`,
            status: point.status,
            pricePerKwh: point.pricePerKwh
        })) || [];
    }, [stationData?.chargingPoints]);
    const [createdReservation, setCreatedReservation] = useState(null);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const response = await fetchWallets();
            // Assuming the API returns an array and we take the first wallet
            if (response.data && response.data.length > 0) {
                setWalletData(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
            message.error('Failed to load wallet information');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserVehicleInfo = useCallback(async () => {
        try {
            // Get user profile for basic info (license plate, etc.)
            const userProfile = await getUserProfile();

            // Debug: Check what we have for user ID
            console.log('Account from Redux:', account);
            console.log('User Profile:', userProfile);

            // Get vehicle details from VehicleSim API using driverId from user profile
            if (userProfile?.driverId) {
                console.log('Attempting to fetch vehicle data for driverId:', userProfile.driverId);

                // Use driverId from user profile
                const driverId = String(userProfile.driverId);
                const vehicleInfo = await getVehicleByDriverId(driverId);

                console.log('Vehicle info response:', vehicleInfo);

                if (vehicleInfo) {
                    // Set vehicle data from VehicleSim API response
                    const vehicleData = {
                        model: vehicleInfo.model || '',
                        connectorType: vehicleInfo.connectorType || '',
                        currentBatteryPercent: vehicleInfo.currentBatteryPercent,
                        batteryCapacityKwh: vehicleInfo.batteryCapacityKwh
                    };

                    setVehicleData(vehicleData);

                    setReservationData(prev => ({
                        ...prev,
                        vehicleModel: vehicleInfo.model || '',
                        licensePlate: userProfile?.licensePlate || ''
                    }));
                }
            } else {
                console.warn('No driverId found in user profile');
            }
        } catch (error) {
            console.error('Error fetching vehicle info:', error);
            console.error('Error details:', error.response?.data || error.message);
            // Don't show error message as vehicle info is optional
            // User can still manually select if needed
        }
    }, [account]);

    // Check connector compatibility when charging point is selected
    const checkConnectorCompatibility = useCallback((chargingPointId) => {
        if (!vehicleData || !chargingPointId) {
            setConnectorCompatibilityError('');
            return true;
        }

        const selectedPoint = availableChargingPoints.find(point => point.id === chargingPointId);
        if (!selectedPoint) {
            setConnectorCompatibilityError('');
            return true;
        }

        // Use compatibility matrix for accurate matching
        const vehicleConnectorType = vehicleData.connectorType;
        const chargingPointType = selectedPoint.type;

        const compatibleTypes = CONNECTOR_COMPATIBILITY[vehicleConnectorType] || [];
        const isCompatible = compatibleTypes.includes(chargingPointType);

        if (!isCompatible) {
            setConnectorCompatibilityError('Incompatible!');
            return false;
        }

        setConnectorCompatibilityError('');
        return true;
    }, [vehicleData, availableChargingPoints]); const calculateCost = useCallback((duration) => {
        if (!reservationData.selectedChargingPoint || !stationData?.chargingPoints) return;

        // Find the selected charging point
        const selectedPoint = stationData.chargingPoints.find(
            point => point.pointId === reservationData.selectedChargingPoint
        );

        if (!selectedPoint) return;

        // Calculate cost based on charging power and duration
        // Duration is now in minutes for demo purposes
        // Assuming average charging efficiency and power usage
        const estimatedKwhUsage = selectedPoint.maxPower * (duration / 60) * 0.8; // Convert minutes to hours for energy calculation
        const cost = estimatedKwhUsage * selectedPoint.pricePerKwh;
        setEstimatedCost(cost);
    }, [reservationData.selectedChargingPoint, stationData?.chargingPoints]);

    useEffect(() => {
        if (!stationData) {
            message.error('No station data found. Redirecting to map...');
            navigate('/map');
            return;
        }

        // Fetch user vehicle information on component mount
        fetchUserVehicleInfo();
    }, [stationData, navigate, fetchUserVehicleInfo]);

    // Separate useEffect for dynamic calculations
    useEffect(() => {
        if (reservationData.selectedChargingPoint) {
            calculateCost(chargingDuration);
        }
    }, [chargingDuration, reservationData.selectedChargingPoint, calculateCost]);

    // Separate useEffect for wallet data
    useEffect(() => {
        if (paymentMethod === 'wallet') {
            fetchWalletData();
        }
    }, [paymentMethod]);

    const handleChargingPointChange = (pointId) => {
        setReservationData(prev => ({ ...prev, selectedChargingPoint: pointId }));
        // Check connector compatibility
        checkConnectorCompatibility(pointId);
        // Recalculate cost with new charging point
        setTimeout(() => calculateCost(chargingDuration), 0);
    };

    const handleDurationChange = (value) => {
        setChargingDuration(value);
        if (reservationData.selectedChargingPoint) {
            calculateCost(value);
        }
    };

    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        if (method === 'wallet') {
            fetchWalletData();
        }
    };

    const validateSelectedChargingPoint = () => {
        if (!reservationData.selectedChargingPoint) return false;

        const selectedPoint = availableChargingPoints.find(
            point => point.id === reservationData.selectedChargingPoint
        );

        if (!selectedPoint) return false;

        if (selectedPoint.status === 'reserved') {
            message.error('The selected charging point is currently reserved. Please select another charging point.');
            return false;
        }

        if (selectedPoint.status === 'offline' || selectedPoint.status === 'maintenance') {
            message.error('The selected charging point is offline for maintenance. Please select another charging point.');
            return false;
        }

        return selectedPoint.status === 'available';
    };

    const handleContinueToDuration = () => {
        if (!reservationData.vehicleModel) {
            message.error('Please select your vehicle model.');
            return;
        }

        if (!validateSelectedChargingPoint()) {
            return;
        }

        // Check connector compatibility before proceeding
        if (connectorCompatibilityError) {
            message.error('Selected charging point is incompatible with your vehicle connector type.');
            return;
        }

        setCurrentStep(1);
    };

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Check authentication and station data
            const token = localStorage.getItem("token");
            const isGoogleToken = token?.startsWith('ya29.');

            if (!token || !account) {
                message.error('Please log in to make a reservation.');
                navigate('/login');
                return;
            }

            if (isGoogleToken) {
                message.warning('You are logged in with Google. Reservation functionality may be limited. Consider logging in with backend credentials.');
            }

            // Validate reservation data
            if (!reservationData.vehicleModel || !reservationData.selectedChargingPoint) {
                message.error('Please fill in all reservation details.');
                setCurrentStep(0);
                return;
            }

            // Validate charging point availability before payment
            if (!validateSelectedChargingPoint()) {
                setCurrentStep(0);
                return;
            }

            // Validate station data
            // Validate station data
            if (!stationData.stationId && !stationData.id && !stationData.station_id) {
                message.error('Invalid station data. Please select a station again.');
                navigate('/map');
                return;
            }

            // Skip availability check for now since the API endpoint may not be implemented
            // This is a temporary workaround until the backend implements the availability check endpoint

            // Validate wallet balance if using wallet payment
            if (paymentMethod === 'wallet') {
                if (!walletData) {
                    message.error('Wallet data not loaded. Please try again.');
                    return;
                }

                if (walletData.balance < estimatedCost) {
                    message.error('Insufficient wallet balance. Please top up your wallet or use a different payment method.');
                    return;
                }

                // Deduct from wallet
                const deductionResponse = await deductFromWallet(walletData.walletId, estimatedCost);

                if (deductionResponse.status === 200) {
                    // Update wallet balance locally to reflect the change immediately
                    setWalletData(prev => ({
                        ...prev,
                        balance: prev.balance - estimatedCost
                    }));

                    message.success(`Payment of $${estimatedCost.toFixed(2)} deducted from wallet successfully!`);
                } else {
                    throw new Error('Wallet deduction failed');
                }
            } else {
                // Simulate card payment processing
                await new Promise(resolve => setTimeout(resolve, 2000));
                message.success('Payment processed successfully!');
            }

            // Create reservation after successful payment
            // Backend needs duration information to set correct start/end times

            // Validate that a charging point is selected
            if (!reservationData.selectedChargingPoint) {
                message.error('No charging point selected. Please go back and select a charging point.');
                setCurrentStep(0);
                setLoading(false);
                return;
            }

            // Include duration and timing information for accurate reservation
            const startTime = new Date().toISOString(); // Current time
            const endTime = new Date(Date.now() + (chargingDuration * 60 * 1000)).toISOString(); // Start time + duration

            const reservationPayload = {
                pointId: reservationData.selectedChargingPoint,
                duration: chargingDuration, // Duration in minutes
                startTime: startTime,
                endTime: endTime
            };

            console.log('Creating reservation with duration payload:', reservationPayload);
            console.log('Selected duration:', chargingDuration, 'minutes');
            console.log('Start time:', startTime);
            console.log('End time:', endTime); let reservation = null;
            try {
                // Call the actual backend API
                reservation = await createReservation(reservationPayload);                // Set both states together using React's batching
                React.startTransition(() => {
                    setCreatedReservation(reservation);
                    setCurrentStep(3);
                });

                message.success('Payment completed! Your charging session has been reserved.');
            } catch (error) {
                // Handle different error cases
                if (error.response?.status === 400) {
                    message.error('Invalid reservation data. Please check your selection and try again.');
                } else if (error.response?.status === 401) {
                    message.error('Authentication required. Please log in and try again.');
                } else if (error.response?.status === 404) {
                    message.error('Charging point not found. Please select a different charging point.');
                } else if (error.response?.status === 409) {
                    message.error('Charging point is already reserved. Please select a different time or point.');
                } else {
                    message.error(`Reservation failed: ${error.response?.data || error.message}`);
                }

                // Create fallback reservation object for display
                reservation = {
                    reservationId: 'FAILED-' + Date.now(),
                    status: 'failed',
                    pointId: reservationPayload.pointId,
                    error: error.response?.data || error.message,
                    paymentStatus: 'completed',
                    note: 'Payment was successful but reservation creation failed.'
                };

                // Set both states together for error case too
                React.startTransition(() => {
                    setCreatedReservation(reservation);
                    setCurrentStep(3);
                });
            }

        } catch (error) {
            console.error('Payment/Reservation error:', error);

            // Handle specific error cases
            if (error.response?.status === 400) {
                message.error('Invalid reservation data. Please check your inputs and try again.');
            } else if (error.response?.status === 401) {
                message.error('Authentication required. Please log in again.');
                // Optionally redirect to login page
                setTimeout(() => navigate('/login'), 2000);
            } else if (error.response?.status === 403) {
                message.error('Access denied. You may not have permission to make reservations.');
            } else if (error.response?.status === 404) {
                message.error('API endpoint not found. The reservation feature may not be implemented yet.');
            } else if (error.response?.status === 409) {
                message.error('Reservation conflict: Time slot is already booked. Please choose a different time.');
                setCurrentStep(0); // Go back to selection
            } else if (error.response?.status === 500) {
                message.error('Server error. Please try again later.');
            } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                message.error('Network error. Please check your connection and try again.');
            } else {
                message.error('Failed to create reservation. Please try again or contact support.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!stationData) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                    <Text>Loading...</Text>
                </div>
            </div>
        );
    }

    const steps = [
        {
            title: 'Reservation Details',
            icon: <CarOutlined />
        },
        {
            title: 'Select Duration',
            icon: <ClockCircleOutlined />
        },
        {
            title: 'Payment',
            icon: <CreditCardOutlined />
        },
        {
            title: 'Confirmation',
            icon: <CheckCircleOutlined />
        }
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Row gutter={[24, 24]} justify="center">
                {/* Header */}
                <Col span={24}>
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Button
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate('/map')}
                                    style={{ marginRight: '16px' }}
                                >
                                    Back to Map
                                </Button>
                                <div>
                                    <Title level={2} style={{ margin: 0 }}>
                                        <CreditCardOutlined style={{ marginRight: 12, color: '#52c41a' }} />
                                        Reserve Charging Station
                                    </Title>
                                    <Text type="secondary">Complete your reservation and payment</Text>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Progress Steps */}
                <Col span={24}>
                    <Card>
                        <Steps current={currentStep} items={steps} />
                    </Card>
                </Col>

                {/* Main Content */}
                <Col xs={24} lg={16}>
                    <Card title="Charging Session Details">
                        {currentStep === 0 && (
                            <Form form={form} layout="vertical">
                                <Alert
                                    message="Vehicle & Reservation Details"
                                    description={reservationData.vehicleModel && reservationData.licensePlate
                                        ? "Your vehicle information has been loaded from your profile"
                                        : "Please provide your vehicle and scheduling details"}
                                    type={reservationData.vehicleModel && reservationData.licensePlate ? "success" : "info"}
                                    showIcon
                                    style={{ marginBottom: '24px' }}
                                />

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Vehicle Model"
                                            required
                                            rules={[{ required: true, message: 'Please enter vehicle model' }]}
                                        >
                                            <Input
                                                placeholder="Enter your vehicle model"
                                                value={reservationData.vehicleModel}
                                                onChange={(e) => setReservationData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                                                size="large"
                                                disabled={!!(reservationData.vehicleModel && reservationData.licensePlate)}
                                                style={{
                                                    backgroundColor: (reservationData.vehicleModel && reservationData.licensePlate) ? '#f6ffed' : ''
                                                }}
                                            />
                                        </Form.Item>
                                        {reservationData.vehicleModel && reservationData.licensePlate && (
                                            <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                                                <Text strong style={{ color: '#52c41a' }}>License Plate: </Text>
                                                <Text style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '600' }}>
                                                    {reservationData.licensePlate}
                                                </Text>
                                            </div>
                                        )}
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Charging Point"
                                            required
                                            rules={[{ required: true, message: 'Please select a charging point' }]}
                                        >
                                            <Select
                                                placeholder="Select charging point"
                                                value={reservationData.selectedChargingPoint}
                                                onChange={handleChargingPointChange}
                                                size="large"
                                            >
                                                {availableChargingPoints.map(point => {
                                                    const isAvailable = point.status === 'available';
                                                    const statusColor = point.status === 'available' ? '#52c41a' :
                                                        point.status === 'reserved' ? '#faad14' : '#ff4d4f';
                                                    const statusText = point.status === 'available' ? 'Available' :
                                                        point.status === 'reserved' ? 'Reserved' : 'Offline';

                                                    return (
                                                        <Select.Option
                                                            key={point.id}
                                                            value={point.id}
                                                            disabled={!isAvailable}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span>{point.name}</span>
                                                                <span style={{
                                                                    color: statusColor,
                                                                    fontSize: '12px',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {statusText}
                                                                </span>
                                                            </div>
                                                        </Select.Option>
                                                    );
                                                })}
                                            </Select>
                                        </Form.Item>
                                        {/* Display compatibility error */}
                                        {connectorCompatibilityError && (
                                            <Alert
                                                message={connectorCompatibilityError}
                                                type="error"
                                                showIcon
                                                style={{ marginTop: '8px' }}
                                            />
                                        )}
                                    </Col>
                                </Row>

                                {/* Display selected charging point info */}
                                {reservationData.selectedChargingPoint && (
                                    <Alert
                                        message={
                                            (() => {
                                                const selectedPoint = availableChargingPoints.find(
                                                    point => point.id === reservationData.selectedChargingPoint
                                                );
                                                if (!selectedPoint) return "Selected charging point not found";

                                                return (
                                                    <div>
                                                        <Text strong>Selected Charging Point:</Text>
                                                        <br />
                                                        <Text>{selectedPoint.name}</Text>
                                                        <br />
                                                        <Text>Type: {selectedPoint.type} | Power: {selectedPoint.power}</Text>
                                                        <br />
                                                        <Text style={{
                                                            color: selectedPoint.status === 'available' ? '#52c41a' : '#ff4d4f'
                                                        }}>
                                                            Status: {selectedPoint.status.charAt(0).toUpperCase() + selectedPoint.status.slice(1)}
                                                        </Text>
                                                    </div>
                                                );
                                            })()
                                        }
                                        type={(() => {
                                            const selectedPoint = availableChargingPoints.find(
                                                point => point.id === reservationData.selectedChargingPoint
                                            );
                                            return selectedPoint?.status === 'available' ? 'success' : 'error';
                                        })()}
                                        showIcon
                                        style={{ marginTop: '16px' }}
                                    />
                                )}

                                <Divider />

                                <div style={{ textAlign: 'center' }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={handleContinueToDuration}
                                        disabled={!reservationData.vehicleModel || !reservationData.selectedChargingPoint || connectorCompatibilityError}
                                    >
                                        Continue to Duration
                                    </Button>
                                </div>
                            </Form>
                        )}

                        {currentStep === 1 && (
                            <Form form={form} layout="vertical">
                                <Alert
                                    message="Select Charging Duration"
                                    description="Choose how long you want to charge your vehicle"
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: '24px' }}
                                />

                                <Form.Item label="Charging Duration (minutes)">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <InputNumber
                                            min={1}
                                            max={480}
                                            step={1}
                                            value={chargingDuration}
                                            onChange={handleDurationChange}
                                            style={{ width: '200px' }}
                                            formatter={value => `${value} min`}
                                            parser={value => value.replace(' min', '')}
                                        />
                                        <Space wrap>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>Quick select (Demo):</Text>
                                            <Button size="small" onClick={() => setChargingDuration(1)}>1min</Button>
                                            <Button size="small" onClick={() => setChargingDuration(3)}>3min</Button>
                                            <Button size="small" onClick={() => setChargingDuration(5)}>5min</Button>
                                            <Button size="small" onClick={() => setChargingDuration(15)}>15min</Button>
                                            <Button size="small" onClick={() => setChargingDuration(30)}>30min</Button>
                                        </Space>
                                    </Space>
                                </Form.Item>

                                <Alert
                                    message={
                                        <div>
                                            <Text strong>Charging Session:</Text>
                                            <br />
                                            <Text>Duration: {chargingDuration} minute{chargingDuration !== 1 ? 's' : ''}</Text>
                                            <br />
                                            <Text>Start: Immediate (upon arrival)</Text>
                                            <br />
                                            {reservationData.selectedChargingPoint && (
                                                <>
                                                    <Text>Estimated Power Usage: {
                                                        (() => {
                                                            const selectedPoint = availableChargingPoints.find(
                                                                p => p.id === reservationData.selectedChargingPoint
                                                            );
                                                            return selectedPoint ?
                                                                `${(selectedPoint.power.replace('kW', '') * (chargingDuration / 60) * 0.8).toFixed(1)} kWh` :
                                                                'N/A';
                                                        })()
                                                    }</Text>
                                                    <br />
                                                    <Text strong style={{ color: '#52c41a' }}>
                                                        Estimated Cost: ${estimatedCost.toFixed(2)}
                                                    </Text>
                                                </>
                                            )}
                                        </div>
                                    }
                                    type="info"
                                    showIcon
                                    style={{ marginTop: '16px' }}
                                />

                                <Divider />

                                <div style={{ textAlign: 'center' }}>
                                    <Space>
                                        <Button onClick={() => setCurrentStep(0)}>
                                            Back to Details
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={() => setCurrentStep(2)}
                                            disabled={!chargingDuration}
                                        >
                                            Continue to Payment
                                        </Button>
                                    </Space>
                                </div>
                            </Form>
                        )}

                        {currentStep === 2 && (
                            <div>
                                {(() => {
                                    const token = localStorage.getItem("token");
                                    const isGoogleToken = token?.startsWith('ya29.');
                                    return isGoogleToken ? (
                                        <Alert
                                            message="Authentication Notice"
                                            description="You're logged in with Google OAuth. Some features (like reservations) may require backend authentication. If payment fails, please try logging in with backend credentials."
                                            type="info"
                                            showIcon
                                            style={{ marginBottom: '24px' }}
                                        />
                                    ) : null;
                                })()}

                                <Alert
                                    message="Select Payment Method"
                                    description="Choose how you want to pay for your charging session"
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: '24px' }}
                                />                                <Form layout="vertical">
                                    <Form.Item label="Payment Method">
                                        <Select
                                            value={paymentMethod}
                                            onChange={handlePaymentMethodChange}
                                            style={{ width: '100%' }}
                                        >
                                            <Option value="wallet">
                                                <WalletOutlined style={{ marginRight: '8px' }} />
                                                Digital Wallet
                                            </Option>
                                            <Option value="card">
                                                <CreditCardOutlined style={{ marginRight: '8px' }} />
                                                Credit/Debit Card
                                            </Option>
                                        </Select>
                                    </Form.Item>

                                    {paymentMethod === 'wallet' && walletData && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <Alert
                                                message={
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <Text strong>Current Wallet Balance: </Text>
                                                                <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                                    ${walletData.balance?.toFixed(2) || '0.00'}
                                                                </Text>
                                                            </div>
                                                            <Button
                                                                size="small"
                                                                icon={<ReloadOutlined />}
                                                                onClick={fetchWalletData}
                                                                loading={loading}
                                                                title="Refresh wallet balance"
                                                            >
                                                                Refresh
                                                            </Button>
                                                        </div>
                                                        <div style={{ marginTop: '8px' }}>
                                                            <Text>Payment Amount: ${estimatedCost.toFixed(2)}</Text>
                                                        </div>
                                                        <div>
                                                            <Text strong>Balance After Payment: </Text>
                                                            <Text style={{
                                                                color: (walletData.balance - estimatedCost) >= 0 ? '#52c41a' : '#ff4d4f',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                ${(walletData.balance - estimatedCost).toFixed(2)}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                }
                                                type={walletData.balance >= estimatedCost ? 'success' : 'warning'}
                                                showIcon
                                            />
                                            {walletData.balance < estimatedCost && (
                                                <Alert
                                                    message="Insufficient Balance"
                                                    description={`You need $${(estimatedCost - walletData.balance).toFixed(2)} more to complete this payment.`}
                                                    type="error"
                                                    showIcon
                                                    style={{ marginTop: '8px' }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </Form>

                                <div style={{ textAlign: 'center' }}>
                                    <Space>
                                        <Button onClick={() => setCurrentStep(1)}>
                                            Back to Duration
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="large"
                                            loading={loading}
                                            onClick={handlePayment}
                                            disabled={
                                                (paymentMethod === 'wallet' && walletData && walletData.balance < estimatedCost) ||
                                                !reservationData.selectedChargingPoint ||
                                                estimatedCost <= 0
                                            }
                                        >
                                            {estimatedCost > 0 ?
                                                `Pay $${estimatedCost.toFixed(2)} & Reserve` :
                                                'Select charging point to continue'
                                            }
                                        </Button>
                                    </Space>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div style={{
                                textAlign: 'center',
                                backgroundColor: '#f0fff0', // Light green background
                                border: '3px solid #52c41a', // Green border
                                padding: '40px',
                                borderRadius: '12px',
                                margin: '20px 0',
                                minHeight: '400px'
                            }}>
                                <div style={{
                                    backgroundColor: '#fff',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}>
                                    <CheckCircleOutlined
                                        style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }}
                                    />
                                    <Title level={3} style={{ color: '#52c41a' }}>🎉 Reservation Confirmed! 🎉</Title>
                                    <Paragraph>
                                        Your charging session has been successfully reserved and paid for. You will be redirected to the map shortly.
                                    </Paragraph>
                                </div>

                                {/* Reservation Details */}
                                <Card
                                    title="Reservation Details"
                                    style={{
                                        marginTop: '24px',
                                        textAlign: 'left',
                                        maxWidth: '500px',
                                        margin: '24px auto 0'
                                    }}
                                >
                                    {createdReservation && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <Text strong>Reservation ID: </Text>
                                            <Text style={{ fontFamily: 'monospace', color: '#1890ff' }}>
                                                {createdReservation.reservationId || 'RES-' + Date.now()}
                                            </Text>
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Vehicle Model: </Text>
                                        <Text>{reservationData.vehicleModel || 'Not specified'}</Text>
                                    </div>

                                    {reservationData.licensePlate && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <Text strong>License Plate: </Text>
                                            <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                                {reservationData.licensePlate}
                                            </Text>
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Charging Point: </Text>
                                        <Text>
                                            {availableChargingPoints.find(p => p.id === reservationData.selectedChargingPoint)?.name || `Point #${reservationData.selectedChargingPoint}`}
                                            {availableChargingPoints.find(p => p.id === reservationData.selectedChargingPoint)?.type &&
                                                ` (${availableChargingPoints.find(p => p.id === reservationData.selectedChargingPoint)?.type})`}
                                        </Text>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Reservation Status: </Text>
                                        <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>Confirmed</Text>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>End Time: </Text>
                                        <Text>{dayjs(reservationData.startTime).add(chargingDuration, 'minute').format('MMM DD, YYYY at HH:mm')}</Text>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Duration: </Text>
                                        <Text>{chargingDuration} minute{chargingDuration !== 1 ? 's' : ''}</Text>
                                    </div>

                                    <Divider />

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Payment Method: </Text>
                                        <Text>
                                            {paymentMethod === 'wallet' ? (
                                                <>
                                                    <WalletOutlined style={{ marginRight: '4px' }} />
                                                    Digital Wallet
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCardOutlined style={{ marginRight: '4px' }} />
                                                    Credit/Debit Card
                                                </>
                                            )}
                                        </Text>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Amount Paid: </Text>
                                        <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                                            ${estimatedCost.toFixed(2)}
                                        </Text>
                                    </div>
                                    {paymentMethod === 'wallet' && walletData && (
                                        <div>
                                            <Text strong>Remaining Wallet Balance: </Text>
                                            <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
                                                ${walletData.balance?.toFixed(2) || '0.00'}
                                            </Text>
                                        </div>
                                    )}
                                </Card>

                                <Alert
                                    message="Important Reminders"
                                    description={
                                        <ul style={{ textAlign: 'left', margin: 0, paddingLeft: '20px' }}>
                                            <li>Bring your vehicle identification and charging cable if required</li>
                                            <li>Late arrival may result in reservation cancellation</li>
                                            <li>You can view and manage your reservations in the app</li>
                                        </ul>
                                    }
                                    type="warning"
                                    showIcon
                                    style={{ marginTop: '24px' }}
                                />

                                {/* Manual navigation buttons */}
                                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                                    <Space>
                                        <Button
                                            type="default"
                                            onClick={() => navigate('/map')}
                                        >
                                            Back to Map
                                        </Button>
                                        <Button
                                            type="primary"
                                            onClick={() => navigate('/map', {
                                                state: {
                                                    paymentSuccess: true,
                                                    reservedStation: stationData,
                                                    reservation: createdReservation,
                                                    paymentMethod: paymentMethod,
                                                    amountPaid: estimatedCost
                                                }
                                            })}
                                        >
                                            View on Map
                                        </Button>
                                    </Space>
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Station Summary */}
                <Col xs={24} lg={8}>
                    <Card title="Station Summary">
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div>
                                <Text strong>Station:</Text>
                                <br />
                                <Text>{stationData.title}</Text>
                            </div>

                            <div>
                                <Text strong>Location:</Text>
                                <br />
                                <Text>{stationData.address}</Text>
                            </div>

                            <div>
                                <Text strong>Power Output:</Text>
                                <br />
                                <Text>{stationData.power}</Text>
                            </div>

                            <div>
                                <Text strong>Price Rate:</Text>
                                <br />
                                <Text>
                                    {reservationData.selectedChargingPoint ? (
                                        (() => {
                                            const selectedPoint = availableChargingPoints.find(
                                                p => p.id === reservationData.selectedChargingPoint
                                            );
                                            return selectedPoint ?
                                                `$${selectedPoint.pricePerKwh.toFixed(3)}/kWh` :
                                                'Select charging point for pricing';
                                        })()
                                    ) : (
                                        'Select charging point for pricing'
                                    )}
                                </Text>
                            </div>

                            <Divider />

                            {/* Show reservation details if available */}
                            {reservationData.vehicleModel && (
                                <>
                                    <div>
                                        <Text strong>Vehicle:</Text>
                                        <br />
                                        <Text>{reservationData.vehicleModel}</Text>
                                    </div>                                    <div>
                                        <Text strong>License Plate:</Text>
                                        <br />
                                        <Text>{reservationData.licensePlate}</Text>
                                    </div>

                                    {reservationData.selectedChargingPoint && (
                                        <div>
                                            <Text strong>Charging Point:</Text>
                                            <br />
                                            <Text>
                                                {availableChargingPoints.find(p => p.id === reservationData.selectedChargingPoint)?.name}
                                            </Text>
                                        </div>
                                    )}

                                    {reservationData.startTime && (
                                        <div>
                                            <Text strong>Start Time:</Text>
                                            <br />
                                            <Text>{dayjs(reservationData.startTime).format('MMM DD, HH:mm')}</Text>
                                        </div>
                                    )}

                                    <Divider />
                                </>
                            )}

                            <div>
                                <Text strong>Duration:</Text>
                                <br />
                                <Text>{chargingDuration} hours</Text>
                            </div>

                            <div>
                                <Text strong>Estimated Cost:</Text>
                                <br />
                                {reservationData.selectedChargingPoint ? (
                                    <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                                        <DollarOutlined /> {estimatedCost.toFixed(2)}
                                    </Text>
                                ) : (
                                    <Text style={{ fontSize: '14px', color: '#999' }}>
                                        Select charging point to calculate cost
                                    </Text>
                                )}
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PaymentPage;

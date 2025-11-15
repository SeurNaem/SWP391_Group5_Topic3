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
    Input,
    Select,
    message,
    Spin,
    InputNumber,
    Modal,
    Radio
} from 'antd';
import {
    CreditCardOutlined,
    WalletOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    ThunderboltOutlined,
    ReloadOutlined,
    CarOutlined,
    QrcodeOutlined,
    ArrowLeftOutlined,
    PlayCircleOutlined,
    StopOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(duration);
dayjs.extend(relativeTime);

import { createReservation } from '../../service/reservation.api';
import { getUserProfile } from '../../service/user.api';
import { getVehicleByDriverId } from '../../service/vehicle-sim.api';
import { startChargingSession, stopChargingSession } from '../../service/charging-session.api';
import { deductFromWallet, fetchWallets } from '../../service/wallet.api';

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
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(30);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [sessionCost, setSessionCost] = useState(0);
    const [stoppedSession, setStoppedSession] = useState(null);
    const [userWallet, setUserWallet] = useState(null);



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

    const fetchUserVehicleInfo = useCallback(async () => {
        try {
            // Get user profile for basic info (license plate, etc.)
            const userProfile = await getUserProfile();

            // Debug: Check what we have for user ID
            console.log('Account from Redux:', account);
            console.log('User Profile:', userProfile);

            // Fetch wallet info
            try {
                const walletResp = await fetchWallets();
                const userId = account?.user?.userId;
                const foundWallet = Array.isArray(walletResp.data) 
                    ? walletResp.data.find(w => w.userId === userId) || walletResp.data[0]
                    : walletResp.data;
                setUserWallet(foundWallet);
                console.log('User wallet loaded:', foundWallet);
            } catch (walletErr) {
                console.warn('Failed to load wallet:', walletErr);
            }

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
    }, [vehicleData, availableChargingPoints]);

    const calculateCost = useCallback(() => {
        if (!reservationData.selectedChargingPoint || !stationData?.chargingPoints) return;

        // Find the selected charging point
        const selectedPoint = stationData.chargingPoints.find(
            point => point.pointId === reservationData.selectedChargingPoint
        );

        if (!selectedPoint) return;

        // Since duration selection is moved to staff page, use a default cost calculation
        // This is just for display purposes in the payment page
        const defaultDurationMinutes = 30; // Default 30 minutes for cost estimation
        const estimatedKwhUsage = selectedPoint.maxPower * (defaultDurationMinutes / 60) * 0.8;
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
            calculateCost();
        }
    }, [reservationData.selectedChargingPoint, calculateCost]);

    // Effect to update remaining time for active session
    useEffect(() => {
        if (!activeSession?.endTime) {
            setTimeRemaining(null);
            setSessionExpired(false);
            return;
        }

        const updateTimer = () => {
            const now = dayjs();
            const end = dayjs(activeSession.endTime);
            const diff = end.diff(now);

            if (diff <= 0) {
                setTimeRemaining('Session expired');
                setSessionExpired(true);
                message.warning('Your charging session has ended.');
                return;
            }

            const duration = dayjs.duration(diff);
            const minutes = Math.floor(duration.asMinutes());
            const seconds = duration.seconds();
            setTimeRemaining(`${minutes}m ${seconds}s`);
            setSessionExpired(false);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [activeSession?.endTime]);

    const handleChargingPointChange = (pointId) => {
        setReservationData(prev => ({ ...prev, selectedChargingPoint: pointId }));
        // Check connector compatibility
        checkConnectorCompatibility(pointId);
        // Recalculate cost with new charging point
        setTimeout(() => calculateCost(), 0);
    };

    // Handle immediate reservation creation (no payment step)
    const handleCreateReservation = async () => {
        if (!validateSelectedChargingPoint()) {
            message.error('Please select a valid charging point');
            return;
        }

        if (connectorCompatibilityError) {
            message.error('Please fix connector compatibility issues before proceeding');
            return;
        }

        setLoading(true);
        try {
            // Create a simple reservation
            const reservationPayload = {
                pointId: reservationData.selectedChargingPoint
            };

            console.log('Creating reservation with payload:', reservationPayload);

            const reservation = await createReservation(reservationPayload);

            // Set both states together using React's batching
            React.startTransition(() => {
                setCreatedReservation(reservation);
                setCurrentStep(1);
            });

            message.success('Reservation created successfully!');
        } catch (error) {
            console.error('Reservation creation error:', error);

            // Handle different error cases
            if (error.response?.status === 400) {
                message.error('Invalid reservation data. Please check your selection and try again.');
            } else if (error.response?.status === 401) {
                message.error('Authentication required. Please log in and try again.');
            } else if (error.response?.status === 404) {
                message.error('Charging point not found. Please select a different charging point.');
            } else if (error.response?.status === 409) {
                message.error('Charging point is already reserved. Please select a different point.');
            } else {
                message.error(`Reservation failed: ${error.response?.data || error.message}`);
            }
        } finally {
            setLoading(false);
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

    // Handle starting a charging session
    const handleStartSession = async () => {
        console.log('=== START SESSION CLICKED ===');
        console.log('Created reservation:', createdReservation);
        console.log('Selected charging point:', reservationData.selectedChargingPoint);
        console.log('Account from Redux:', account);
        
        if (!createdReservation || !reservationData.selectedChargingPoint) {
            message.error('No reservation found. Please create a reservation first.');
            return;
        }

        const userId = account?.user?.userId;
        if (!userId) {
            console.error('User ID not found in account:', account);
            message.error('User information not found. Please log in again.');
            return;
        }

        setSessionLoading(true);
        try {
            const sessionData = {
                userId: userId,
                pointId: reservationData.selectedChargingPoint,
                reservationId: createdReservation.reservationId,
                vehicleId: vehicleData?.vehicleId || 0,
                minutes: sessionDuration,
                paymentMethod: "wallet"
            };

            console.log('=== SESSION DATA TO SEND ===');
            console.log(JSON.stringify(sessionData, null, 2));

            const session = await startChargingSession(sessionData);

            console.log('=== SESSION STARTED SUCCESSFULLY ===');
            console.log('Full session response:', JSON.stringify(session, null, 2));
            
            // Extract session data - handle different response structures
            const sessionInfo = session?.session || session;
            console.log('Extracted session info:', sessionInfo);
            
            setActiveSession(sessionInfo);
            message.success('Charging session started successfully!');
        } catch (error) {
            console.error('=== START SESSION ERROR ===');
            console.error('Error object:', error);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            console.error('Error message:', error.message);

            if (error.response?.status === 400) {
                message.error(`Invalid session data: ${JSON.stringify(error.response?.data)}`);
            } else if (error.response?.status === 401) {
                message.error('Authentication required. Please log in again.');
            } else if (error.response?.status === 404) {
                message.error('Charging point or reservation not found.');
            } else if (error.response?.status === 409) {
                message.error('Charging point is already in use.');
            } else {
                message.error(`Failed to start session: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setSessionLoading(false);
        }
    };

    // Handle stopping a charging session
    const handleStopSession = async () => {
        if (!activeSession) {
            message.error('No active session to stop.');
            return;
        }

        // Calculate estimated cost
        const selectedPoint = stationData?.chargingPoints?.find(
            point => point.pointId === reservationData.selectedChargingPoint
        );
        
        if (selectedPoint) {
            const startTime = dayjs(activeSession.startTime);
            const now = dayjs();
            const actualMinutes = now.diff(startTime, 'minute', true);
            const estimatedKwh = (selectedPoint.maxPower * (actualMinutes / 60)) * 0.8; // 80% efficiency
            const cost = estimatedKwh * selectedPoint.pricePerKwh;
            setSessionCost(cost);
        }

        setStoppedSession(activeSession);
        setPaymentModalVisible(true);
    };

    // Handle payment completion
    const handlePaymentComplete = async () => {
        if (!stoppedSession) {
            message.error('No session data found.');
            return;
        }

        setPaymentLoading(true);
        try {
            // Process payment based on method
            if (paymentMethod === 'wallet') {
                if (!userWallet) {
                    message.error('Wallet not found. Please set up your wallet first.');
                    setPaymentLoading(false);
                    return;
                }

                const walletId = userWallet.walletId || userWallet.id;
                if (!walletId) {
                    message.error('Invalid wallet ID.');
                    setPaymentLoading(false);
                    return;
                }

                console.log('Deducting from wallet:', walletId, 'amount:', sessionCost);

                // Deduct from wallet
                await deductFromWallet(walletId, sessionCost);
                message.success('Payment deducted from wallet successfully!');
            }

            // Now stop the session
            console.log('Stopping session after payment...');
            const sessionData = {
                sessionId: stoppedSession.sessionId,
                pointId: reservationData.selectedChargingPoint
            };

            await stopChargingSession(sessionData);

            message.success('Charging session completed successfully!');
            
            // Reset all states to initial
            setActiveSession(null);
            setPaymentModalVisible(false);
            setStoppedSession(null);
            setCurrentStep(0);
            setCreatedReservation(null);
            setReservationData({
                vehicleModel: '',
                licensePlate: '',
                selectedChargingPoint: null
            });
            setEstimatedCost(0);

            // Navigate back to map after delay
            setTimeout(() => {
                message.success('Redirecting to map...');
                navigate('/map');
            }, 2000);

        } catch (error) {
            console.error('Payment/Stop error:', error);

            const errorMsg = error.response?.data;
            
            if (error.response?.status === 404) {
                if (typeof errorMsg === 'string' && errorMsg.includes('Wallet not found')) {
                    message.error('Wallet not found. Please set up your wallet in your profile.');
                } else {
                    message.error('Resource not found. Please try again.');
                }
            } else if (error.response?.status === 500) {
                if (typeof errorMsg === 'string' && errorMsg.includes('FOREIGN KEY constraint')) {
                    message.warning('Payment processed but backend sync pending. Session will be marked as complete.');
                    setActiveSession(null);
                    setPaymentModalVisible(false);
                    setCurrentStep(0);
                    setTimeout(() => navigate('/map'), 1500);
                } else {
                    message.error('Server error occurred. Please contact support.');
                }
            } else if (error.response?.status === 400) {
                if (typeof errorMsg === 'string' && errorMsg.includes('already stopped')) {
                    message.warning('Session already completed. Payment processed.');
                    setActiveSession(null);
                    setPaymentModalVisible(false);
                    setCurrentStep(0);
                    setTimeout(() => navigate('/map'), 1500);
                } else if (typeof errorMsg === 'string' && errorMsg.includes('Insufficient')) {
                    message.error('Insufficient wallet balance. Please top up your wallet.');
                } else {
                    message.error(`Payment error: ${errorMsg || 'Bad request'}`);
                }
            } else {
                message.error(`Failed to complete payment: ${error.message}`);
            }
        } finally {
            setPaymentLoading(false);
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
                                        loading={loading}
                                        onClick={handleCreateReservation}
                                        disabled={!reservationData.vehicleModel || !reservationData.selectedChargingPoint || connectorCompatibilityError}
                                    >
                                        Create Reservation
                                    </Button>
                                </div>
                            </Form>
                        )}

                        {currentStep === 1 && (
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
                                        Your charging session has been successfully reserved. You will be redirected to the map shortly.
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
                                        <Text strong>Duration: </Text>
                                        <Text>Will be set by staff when starting the session</Text>
                                    </div>

                                    <Divider />

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Status: </Text>
                                        <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                                            Reservation Created (Payment managed by staff)
                                        </Text>
                                    </div>
                                </Card>

                                {/* Session Control Section */}
                                <Card
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <ThunderboltOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                            {activeSession ? "Active Charging Session" : "Start Charging"}
                                        </div>
                                    }
                                    style={{
                                        marginTop: '24px',
                                        textAlign: 'left',
                                        maxWidth: '500px',
                                        margin: '24px auto 0'
                                    }}
                                >
                                    {!activeSession ? (
                                        <div>
                                            <Alert
                                                message="Ready to Charge"
                                                description="Your reservation is confirmed. You can now start your charging session."
                                                type="info"
                                                showIcon
                                                style={{ marginBottom: '16px' }}
                                            />

                                            <Form layout="vertical">
                                                <Form.Item
                                                    label="Session Duration (minutes)"
                                                    help="How long do you plan to charge?"
                                                >
                                                    <InputNumber
                                                        min={5}
                                                        max={480}
                                                        value={sessionDuration}
                                                        onChange={(value) => setSessionDuration(value)}
                                                        style={{ width: '100%' }}
                                                        size="large"
                                                    />
                                                </Form.Item>
                                            </Form>

                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<PlayCircleOutlined />}
                                                onClick={handleStartSession}
                                                loading={sessionLoading}
                                                style={{
                                                    width: '100%',
                                                    height: '50px',
                                                    fontSize: '16px',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                }}
                                            >
                                                Start Charging Session
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Alert
                                                message={sessionExpired ? "Session Ended" : "Charging In Progress"}
                                                description={
                                                    <div>
                                                        <div>{sessionExpired ? 'Your charging session has ended.' : 'Your vehicle is currently charging.'}</div>
                                                        <div style={{ marginTop: '8px' }}>
                                                            <Text strong>Session ID: </Text>
                                                            <Text code>{activeSession.sessionId}</Text>
                                                        </div>
                                                        <div style={{ marginTop: '4px' }}>
                                                            <Text strong>Status: </Text>
                                                            <Text code style={{ color: sessionExpired ? '#ff4d4f' : '#52c41a' }}>
                                                                {activeSession.status || 'in_progress'}
                                                            </Text>
                                                        </div>
                                                        <div style={{ marginTop: '4px' }}>
                                                            <Text strong>Started: </Text>
                                                            <Text>{dayjs(activeSession.startTime).format('HH:mm:ss')}</Text>
                                                        </div>
                                                        <div style={{ marginTop: '4px' }}>
                                                            <Text strong>Ends at: </Text>
                                                            <Text>{dayjs(activeSession.endTime).format('HH:mm:ss')}</Text>
                                                        </div>
                                                        {timeRemaining && (
                                                            <div style={{ marginTop: '8px', padding: '8px', background: sessionExpired ? '#fff1f0' : '#f6ffed', borderRadius: '4px', border: `1px solid ${sessionExpired ? '#ffccc7' : '#b7eb8f'}` }}>
                                                                <Text strong style={{ color: sessionExpired ? '#ff4d4f' : '#52c41a' }}>
                                                                    {sessionExpired ? '⏰ ' : '⚡ '}
                                                                    {timeRemaining}
                                                                </Text>
                                                            </div>
                                                        )}
                                                    </div>
                                                }
                                                type={sessionExpired ? "warning" : "success"}
                                                showIcon
                                                icon={<ThunderboltOutlined />}
                                                style={{ marginBottom: '16px' }}
                                            />

                                            <Button
                                                danger
                                                size="large"
                                                icon={<StopOutlined />}
                                                onClick={handleStopSession}
                                                loading={sessionLoading}
                                                style={{
                                                    width: '100%',
                                                    height: '50px',
                                                    fontSize: '16px'
                                                }}
                                            >
                                                {sessionExpired ? 'Complete Session' : 'Stop Charging Session'}
                                            </Button>

                                            <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {sessionExpired 
                                                        ? 'Click to finalize and process payment'
                                                        : 'Payment will be processed when you stop the session'}
                                                </Text>
                                            </div>
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
                                <Text>To be set by staff</Text>
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

            {/* Payment Modal */}
            <Modal
                title={
                    <div style={{ textAlign: 'center' }}>
                        <DollarOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
                        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Payment Required</span>
                    </div>
                }
                open={paymentModalVisible}
                onCancel={() => {
                    setPaymentModalVisible(false);
                    setStoppedSession(null);
                }}
                footer={null}
                width={600}
            >
                <div style={{ padding: '20px 0' }}>
                    {/* Payment Amount */}
                    <Card style={{ marginBottom: '20px', backgroundColor: '#f0f5ff', border: '2px solid #1890ff' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: '16px' }}>Amount to Pay</Text>
                            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1890ff', margin: '10px 0' }}>
                                ${sessionCost.toFixed(2)}
                            </div>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                ≈ {Math.round(sessionCost * 24000).toLocaleString()} VND
                            </Text>
                        </div>
                    </Card>

                    {/* Session Summary */}
                    <Card size="small" style={{ marginBottom: '20px', background: '#fafafa' }}>
                        <Row gutter={[16, 8]}>
                            <Col span={12}>
                                <Text type="secondary">Session ID:</Text>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Text code>{stoppedSession?.sessionId}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">Duration:</Text>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Text strong>
                                    {stoppedSession && dayjs(dayjs()).diff(dayjs(stoppedSession.startTime), 'minute')} minutes
                                </Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">Started:</Text>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Text>{stoppedSession && dayjs(stoppedSession.startTime).format('HH:mm:ss')}</Text>
                            </Col>
                        </Row>
                    </Card>

                    <Divider>Select Payment Method</Divider>

                    {/* Payment Method Selection */}
                    <Select
                        value={paymentMethod}
                        onChange={(value) => setPaymentMethod(value)}
                        style={{ width: '100%', marginBottom: '20px' }}
                        size="large"
                    >
                        <Select.Option value="wallet">
                            <WalletOutlined style={{ marginRight: '8px' }} />
                            Digital Wallet
                            {userWallet && (
                                <span style={{ float: 'right', fontSize: '12px', color: '#8c8c8c' }}>
                                    Balance: ${(userWallet.balance || 0).toFixed(2)}
                                </span>
                            )}
                        </Select.Option>
                    </Select>

                    {/* Wallet Balance Info */}
                    {paymentMethod === 'wallet' && (
                        <Alert
                            message={
                                <div>
                                    {userWallet && userWallet.balance >= sessionCost ? (
                                        <div>
                                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                                            <Text>Sufficient balance. ${sessionCost.toFixed(2)} will be deducted from your wallet.</Text>
                                        </div>
                                    ) : (
                                        <div>
                                            <Text type="danger">
                                                ⚠️ Insufficient wallet balance. Please top up your wallet first.
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            }
                            type={userWallet && userWallet.balance >= sessionCost ? "success" : "error"}
                            showIcon={false}
                            style={{ marginBottom: '20px' }}
                        />
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button
                            size="large"
                            onClick={() => {
                                setPaymentModalVisible(false);
                                setStoppedSession(null);
                            }}
                            disabled={paymentLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            icon={<CheckCircleOutlined />}
                            onClick={handlePaymentComplete}
                            loading={paymentLoading}
                            disabled={!userWallet || (userWallet.balance < sessionCost)}
                        >
                            Complete Payment
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentPage;

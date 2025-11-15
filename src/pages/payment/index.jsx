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
    Spin
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
    ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

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
                                                    reservationSuccess: true,
                                                    reservedStation: stationData,
                                                    reservation: createdReservation
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
        </div>
    );
};

export default PaymentPage;

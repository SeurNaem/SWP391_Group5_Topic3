import React, { useState, useEffect, useCallback } from 'react';
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
import { createReservation, checkAvailability } from '../../service/reservation.api';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();

    // Get station data from navigation state
    const stationData = location.state?.station;

    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [walletData, setWalletData] = useState(null);
    const [chargingDuration, setChargingDuration] = useState(1);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [reservationData, setReservationData] = useState({
        vehicleType: '',
        selectedChargingPoint: null
    });
    const [availableChargingPoints] = useState([
        { id: 1, name: 'CCS - 50kW', type: 'CCS', power: '50kW', status: 'available' },
        { id: 2, name: 'CHAdeMO - 50kW', type: 'CHAdeMO', power: '50kW', status: 'available' },
        { id: 3, name: 'CCS - 22kW', type: 'CCS', power: '22kW', status: 'reserved' },
        { id: 4, name: 'AC - 11kW', type: 'Type 2', power: '11kW', status: 'available' },
        { id: 5, name: 'CCS - 150kW', type: 'CCS', power: '150kW', status: 'offline' },
        { id: 6, name: 'CHAdeMO - 22kW', type: 'CHAdeMO', power: '22kW', status: 'available' }
    ]);
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

    const calculateCost = useCallback((duration) => {
        if (!stationData?.price) return;

        // Extract price per hour (assuming format like "$5.50/hour")
        const priceMatch = stationData.price.match(/\$?(\d+\.?\d*)/);
        const pricePerHour = priceMatch ? parseFloat(priceMatch[1]) : 5.0;

        const cost = pricePerHour * duration;
        setEstimatedCost(cost);
    }, [stationData?.price]);

    useEffect(() => {
        if (!stationData) {
            message.error('No station data found. Redirecting to map...');
            navigate('/map');
            return;
        }

        // Calculate initial estimated cost
        calculateCost(chargingDuration);

        // Fetch wallet data if payment method is wallet
        if (paymentMethod === 'wallet') {
            fetchWalletData();
        }
    }, [stationData, navigate, chargingDuration, paymentMethod, calculateCost]);

    const handleDurationChange = (value) => {
        setChargingDuration(value);
        calculateCost(value);
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

        if (selectedPoint.status === 'offline') {
            message.error('The selected charging point is offline for maintenance. Please select another charging point.');
            return false;
        }

        return selectedPoint.status === 'available';
    };

    const handleContinueToDuration = () => {
        if (!reservationData.vehicleType) {
            message.error('Please select your vehicle type.');
            return;
        }

        if (!validateSelectedChargingPoint()) {
            return;
        }

        setCurrentStep(1);
    };

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Validate reservation data
            if (!reservationData.vehicleType || !reservationData.selectedChargingPoint) {
                message.error('Please fill in all reservation details.');
                setCurrentStep(0);
                return;
            }

            // Validate charging point availability before payment
            if (!validateSelectedChargingPoint()) {
                setCurrentStep(0);
                return;
            }

            // Calculate start and end time (immediate start)
            const startTime = dayjs();
            const endTime = startTime.add(chargingDuration, 'hour');

            // Check availability first
            try {
                const availabilityCheck = await checkAvailability({
                    stationId: stationData.id,
                    chargingPointId: reservationData.selectedChargingPoint,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString()
                });

                if (!availabilityCheck.available) {
                    message.error('The selected time slot is no longer available. Please choose a different time.');
                    setCurrentStep(0);
                    return;
                }
            } catch (availabilityError) {
                console.log('Availability check failed, proceeding with reservation:', availabilityError);
                // Continue with reservation creation even if availability check fails
            }

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
            const reservationPayload = {
                stationId: stationData.id,
                chargingPointId: reservationData.selectedChargingPoint,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                vehicleType: reservationData.vehicleType,
                paymentMethod: paymentMethod,
                totalCost: estimatedCost
            };

            const reservation = await createReservation(reservationPayload);
            setCreatedReservation(reservation);

            message.success('Your charging session has been reserved.');
            setCurrentStep(3); // Move to confirmation step

            // Redirect to map after successful payment and reservation
            setTimeout(() => {
                navigate('/map', {
                    state: {
                        paymentSuccess: true,
                        reservedStation: stationData,
                        reservation: reservation,
                        paymentMethod: paymentMethod,
                        amountPaid: estimatedCost
                    }
                });
            }, 5000); // Increased time to show reservation details

        } catch (error) {
            console.error('Payment/Reservation error:', error);
            if (error.response?.status === 400) {
                message.error('Failed: Invalid data or insufficient funds.');
            } else if (error.response?.status === 401) {
                message.error('Failed: Authentication required.');
            } else if (error.response?.status === 409) {
                message.error('Reservation failed: Time slot is already booked.');
            } else {
                message.error('Payment or reservation failed. Please try again.');
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
                                    message="Reservation Details"
                                    description="Please provide your vehicle and scheduling details"
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: '24px' }}
                                />

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Vehicle Type"
                                            required
                                            rules={[{ required: true, message: 'Please select vehicle type' }]}
                                        >
                                            <Select
                                                placeholder="Select your vehicle type"
                                                value={reservationData.vehicleType}
                                                onChange={(value) => setReservationData(prev => ({ ...prev, vehicleType: value }))}
                                                size="large"
                                            >
                                                <Select.Option value="Electric Car">Electric Car</Select.Option>
                                                <Select.Option value="Hybrid Car">Hybrid Car</Select.Option>
                                                <Select.Option value="Electric Motorcycle">Electric Motorcycle</Select.Option>
                                                <Select.Option value="Electric Scooter">Electric Scooter</Select.Option>
                                                <Select.Option value="Electric Bus">Electric Bus</Select.Option>
                                                <Select.Option value="Electric Van">Electric Van</Select.Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Charging Point"
                                            required
                                            rules={[{ required: true, message: 'Please select a charging point' }]}
                                            extra="Note: Only available charging points can be selected"
                                        >
                                            <Select
                                                placeholder="Select charging point"
                                                value={reservationData.selectedChargingPoint}
                                                onChange={(value) => setReservationData(prev => ({ ...prev, selectedChargingPoint: value }))}
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
                                        disabled={!reservationData.vehicleType || !reservationData.selectedChargingPoint}
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

                                <Form.Item label="Charging Duration (hours)">
                                    <InputNumber
                                        min={0.5}
                                        max={12}
                                        step={0.5}
                                        value={chargingDuration}
                                        onChange={handleDurationChange}
                                        style={{ width: '200px' }}
                                        formatter={value => `${value} hours`}
                                        parser={value => value.replace(' hours', '')}
                                    />
                                </Form.Item>

                                <Alert
                                    message={
                                        <div>
                                            <Text strong>Charging Session:</Text>
                                            <br />
                                            <Text>Duration: {chargingDuration} hour{chargingDuration !== 1 ? 's' : ''}</Text>
                                            <br />
                                            <Text>Start: Immediate (upon arrival)</Text>
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
                                <Alert
                                    message="Select Payment Method"
                                    description="Choose how you want to pay for your charging session"
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: '24px' }}
                                />

                                <Form layout="vertical">
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
                                            disabled={paymentMethod === 'wallet' && walletData && walletData.balance < estimatedCost}
                                        >
                                            Pay ${estimatedCost.toFixed(2)} & Reserve
                                        </Button>
                                    </Space>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div style={{ textAlign: 'center' }}>
                                <CheckCircleOutlined
                                    style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }}
                                />
                                <Title level={3}>Reservation Confirmed!</Title>
                                <Paragraph>
                                    Your charging session has been successfully reserved and paid for. You will be redirected to the map shortly.
                                </Paragraph>

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
                                        <Text strong>Vehicle: </Text>
                                        <Text>{reservationData.vehicleType} ({reservationData.licensePlate})</Text>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Charging Point: </Text>
                                        <Text>
                                            {availableChargingPoints.find(p => p.id === reservationData.selectedChargingPoint)?.name}
                                            ({availableChargingPoints.find(p => p.id === reservationData.selectedChargingPoint)?.type})
                                        </Text>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Start Time: </Text>
                                        <Text>{dayjs(reservationData.startTime).format('MMM DD, YYYY at HH:mm')}</Text>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>End Time: </Text>
                                        <Text>{dayjs(reservationData.startTime).add(chargingDuration, 'hour').format('MMM DD, YYYY at HH:mm')}</Text>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <Text strong>Duration: </Text>
                                        <Text>{chargingDuration} hours</Text>
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
                                            <li>Please arrive at least 5 minutes before your reservation time</li>
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
                                <Text>{stationData.price}</Text>
                            </div>

                            <Divider />

                            {/* Show reservation details if available */}
                            {reservationData.vehicleType && (
                                <>
                                    <div>
                                        <Text strong>Vehicle:</Text>
                                        <br />
                                        <Text>{reservationData.vehicleType}</Text>
                                    </div>

                                    <div>
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
                                <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                                    <DollarOutlined /> {estimatedCost.toFixed(2)}
                                </Text>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PaymentPage;

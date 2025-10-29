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
    ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchWallets } from '../../service/wallet.api';

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

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Here you would integrate with actual payment API
            message.success('Payment successful! Your charging session has been reserved.');
            setCurrentStep(2);

            // Redirect to map after successful payment
            setTimeout(() => {
                navigate('/map', {
                    state: {
                        paymentSuccess: true,
                        reservedStation: stationData
                    }
                });
            }, 3000);

        } catch (error) {
            console.error('Payment error:', error);
            message.error('Payment failed. Please try again.');
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
            title: 'Select Duration',
            icon: <ThunderboltOutlined />
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

                                <Divider />

                                <div style={{ textAlign: 'center' }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => setCurrentStep(1)}
                                        disabled={!chargingDuration}
                                    >
                                        Continue to Payment
                                    </Button>
                                </div>
                            </Form>
                        )}

                        {currentStep === 1 && (
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
                                        <Alert
                                            message={`Wallet Balance: $${walletData.balance || '0.00'}`}
                                            type={walletData.balance >= estimatedCost ? 'success' : 'warning'}
                                            showIcon
                                            style={{ marginBottom: '16px' }}
                                        />
                                    )}
                                </Form>

                                <div style={{ textAlign: 'center' }}>
                                    <Space>
                                        <Button onClick={() => setCurrentStep(0)}>
                                            Back
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="large"
                                            loading={loading}
                                            onClick={handlePayment}
                                            disabled={paymentMethod === 'wallet' && walletData && walletData.balance < estimatedCost}
                                        >
                                            Pay ${estimatedCost.toFixed(2)}
                                        </Button>
                                    </Space>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div style={{ textAlign: 'center' }}>
                                <CheckCircleOutlined
                                    style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }}
                                />
                                <Title level={3}>Payment Successful!</Title>
                                <Paragraph>
                                    Your charging session has been reserved. You will be redirected to the map shortly.
                                </Paragraph>
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

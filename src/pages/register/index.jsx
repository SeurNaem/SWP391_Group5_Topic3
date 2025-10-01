import { Button, Form, Input, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';

const { Title, Text } = Typography;

const Register = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (values) => {
        try {
            setLoading(true);

            // Call API to register user
            const response = await api.post('/register', values)
            console.log('Registration successful:', response.data);
            message.success('Registration successful! Please login.');

            // Navigate to login page after successful registration
            navigate('/login');

        } catch (error) {
            console.error('Registration error:', error);
            message.error('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-sky-200 flex items-center justify-center p-4">
            <Card
                className="w-full max-w-md shadow-lg"
                style={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
            >
                <div className="text-center mb-8">
                    <Title level={2} className="mb-2">
                        Create Account
                    </Title>
                    <Text type="secondary">
                        Please fill in your information to register
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >
                    <Form.Item
                        label="Full Name"
                        name="fullName"
                        rules={[
                            { required: true, message: 'Please input your full name!' },
                            { min: 2, message: 'Full name must be at least 2 characters long!' },
                            { max: 50, message: 'Full name must not exceed 50 characters!' },
                            { pattern: /^[a-zA-ZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ\s]+$/, message: 'Full name can only contain Vietnamese/English letters and spaces!' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Enter your full name"
                            autoComplete="name"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email address!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Enter your email"
                            autoComplete="email"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Phone Number"
                        name="phone"
                        rules={[
                            { required: true, message: 'Please input your phone number!' },
                            { pattern: /^(\+84|84|0)[1-9][0-9]{8,9}$/, message: 'Please enter a valid Vietnamese phone number!' }
                        ]}
                    >
                        <Input
                            prefix={<PhoneOutlined />}
                            placeholder="Enter your phone number"
                            autoComplete="tel"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Please input your password!' },
                            { min: 8, message: 'Password must be at least 8 characters long!' },
                            { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!' }
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Enter your password"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Confirm Password"
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Please confirm your password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match!'));
                                },
                            }),
                        ]}
                        hasFeedback
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600'
                            }}
                        >
                            Create Account
                        </Button>
                    </Form.Item>

                    <div className="text-center">
                        <Text type="secondary">
                            Already have an account?{' '}
                            <a
                                href="/login"
                                className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                                Sign in
                            </a>
                        </Text>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register;

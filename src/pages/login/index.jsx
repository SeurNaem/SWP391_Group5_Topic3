import { Button, Form, Input, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../config/axios';
import { login } from '../../redux/accountSlice';

const { Title, Text } = Typography;

const Login = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    /*
     1. cập nhật => dispatch action => reducer => store
     2. lấy dữ liệu từ store => useSelector

    */

    const handleSubmit = async (values) => {
        try {
            setLoading(true);

            // Call API to authenticate user
            const response = await api.post('/login', values);
            console.log('Login successful:', response.data);
            message.success('Login successful!');

            // Store user data or token (if needed)
            const { token } = response.data;
            localStorage.setItem('token', token);
            dispatch(login(response.data)); // Dispatch user data to Redux store
            // Navigate to dashboard
            navigate('/');

        } catch (error) {
            console.error('Login error:', error);
            message.error('Login failed. Please check your credentials.');
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
                        Welcome Back
                    </Title>
                    <Text type="secondary">
                        Please sign in to your account
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email address!' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Enter your email"
                            autoComplete="email"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Please input your password!' },
                            { min: 6, message: 'Password must be at least 6 characters long!' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Enter your password"
                            autoComplete="current-password"
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
                            Sign In
                        </Button>
                    </Form.Item>

                    <div className="text-center">
                        <Text type="secondary">
                            Don't have an account?{' '}
                            <a
                                href="/register"
                                className="text-blue-500 hover:text-blue-600 font-medium"
                            >
                                Sign up
                            </a>
                        </Text>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;

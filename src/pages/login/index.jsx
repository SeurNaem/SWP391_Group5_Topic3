import React, { useState } from "react";
import {
  Form,
  Input,
  Checkbox,
  Button,
  Card,
  Divider,
  Row,
  Col,
  message,
} from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { FaGoogle, FaGithub } from "react-icons/fa";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
// If using AntD v5, remember to import base reset once in your app root:
// import "antd/dist/reset.css";
import { useDispatch } from "react-redux";
import { login } from "../../redux/accountSlice";
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../config/firebase";
import logo from "../../assets/logo.png";

const LoginPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
    1. Cập nhật => dispatch
    2. Get => selector

  */

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await api.post("Auth/login", values);
      toast.success("Successfully logged in!");
      console.log(response);
      const { token, role } = response.data;
      localStorage.setItem("token", token);

      // lưu state
      dispatch(login(response.data));

      if (role === "ADMIN") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;

      console.log("Google login successful:", user);
      console.log("Access token:", token);

      // Store user data in localStorage (similar to regular login)
      const userData = {
        fullName: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        role: "USER", // Default role for Google users
        token: token // Use Google token or you might want to exchange it for your backend token
      };

      localStorage.setItem("token", token);

      // Update Redux state
      dispatch(login(userData));

      // Show success message
      toast.success("Successfully logged in with Google!");

      // Navigate to home page (or dashboard if admin)
      navigate("/");

    } catch (error) {
      console.error("Google login error:", {
        code: error.code,
        message: error.message,
        email: error.customData?.email
      });
      message.error("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleLoginGithub = async () => {
    const provider = new GithubAuthProvider();
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;

      console.log("GitHub login successful:", user);
      console.log("Access token:", token);

      // Store user data in localStorage (similar to regular login)
      const userData = {
        fullName: user.displayName || user.email.split('@')[0], // Use email prefix if no display name
        email: user.email,
        avatar: user.photoURL,
        role: "USER", // Default role for GitHub users
        token: token // Use GitHub token or you might want to exchange it for your backend token
      };

      localStorage.setItem("token", token);

      // Update Redux state
      dispatch(login(userData));

      // Show success message
      toast.success("Successfully logged in with GitHub!");

      // Navigate to home page (or dashboard if admin)
      navigate("/");

    } catch (error) {
      console.error("GitHub login error:", {
        code: error.code,
        message: error.message,
        email: error.customData?.email
      });
      message.error("GitHub login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
          <div className="text-center mb-4">
            <img
              src={logo}
              alt="EV Charging Station Logo"
              style={{
                height: '60px',
                width: 'auto',
                marginBottom: '16px'
              }}
            />
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ rememberMe: false }}
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Please enter a valid email address" }
              ]}
            >
              <Input
                placeholder="Enter your email address"
                prefix={<MailOutlined />}
                allowClear
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
              hasFeedback
            >
              <Input.Password
                placeholder="Enter password"
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Row justify="space-between" align="middle">
              <Col>
                <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
              </Col>
              <Col>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Forgot your password?
                </a>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </Form.Item>

            <Divider>Or continue with</Divider>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="default"
                block
                icon={<FaGoogle />}
                onClick={handleLoginGoogle}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Google"}
              </Button>
              <Button
                type="default"
                block
                icon={<FaGithub />}
                onClick={handleLoginGithub}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "GitHub"}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

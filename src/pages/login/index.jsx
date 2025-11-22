import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
} from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import api from "../../config/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../redux/accountSlice";
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
      // Clear any existing persisted data first
      localStorage.clear();

      // Check for built-in admin account
      if (values.email === "admin@example.com" && values.password === "admin1234") {
        // Try to authenticate with a real admin account on the backend
        // For development, let's use a real admin account if available
        try {
          // Try the built-in credentials with the actual API first
          const adminValues = {
            email: "admin@admin.com", // Update this to match your backend admin account
            password: "admin123456"   // Update this to match your backend admin password
          };

          const response = await api.post("Auth/login", adminValues);
          const { token, role } = response.data;
          localStorage.setItem("token", token);

          const formattedRole = role === "ADMIN" ? "Admin" : role;
          const userData = {
            ...response.data,
            role: formattedRole
          };

          dispatch(login(userData));
          toast.success("Successfully logged in as Administrator!");

          setTimeout(() => {
            navigate("/dashboard/subscription");
          }, 100);

          return;
        } catch (apiError) {
          console.log("API admin login failed, using offline mode:", apiError);

          // Fallback: create offline admin for UI testing (with warning)
          const adminUserData = {
            token: "offline-admin-token", // This won't work with real API calls
            role: "Admin",
            user: {
              id: "admin-001",
              fullName: "System Administrator (Offline)",
              email: "admin@example.com",
              role: "Admin",
              avatar: "https://via.placeholder.com/40x40/1F2937/ffffff?text=A"
            }
          };

          localStorage.setItem("token", adminUserData.token);
          dispatch(login(adminUserData));

          toast.warning("Logged in as offline admin - API calls may fail!");

          setTimeout(() => {
            navigate("/dashboard/subscription");
          }, 100);

          return;
        }
      }      // Regular API login for other users
      const response = await api.post("Auth/login", values);
      toast.success("Successfully logged in!");
      console.log(response);
      const { token, role } = response.data;
      localStorage.setItem("token", token);

      // Convert role to proper case format (Admin instead of ADMIN)
      const formattedRole = role === "ADMIN" ? "Admin" : role;

      // Update response data with formatted role
      const userData = {
        ...response.data,
        role: formattedRole
      };

      // Enhanced debug logging
      console.log("=== Login Debug ===");
      console.log("Original API response:", response.data);
      console.log("Original role from API:", role);
      console.log("Formatted role:", formattedRole);
      console.log("Final userData being dispatched:", userData);
      console.log("==================");

      // lưu state
      dispatch(login(userData));

      // Add a small delay to ensure Redux state is updated
      setTimeout(() => {
        console.log("After dispatch - checking Redux state...");

        if (formattedRole === "Admin") {
          console.log("Navigating to dashboard for Admin role");
          navigate("/dashboard");
        } else {
          console.log("Navigating to home for non-admin role");
          navigate("/");
        }
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      message.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{
      background: 'radial-gradient(circle at center, #87ceeb 0%, #4fc3f7 50%, #29b6f6 100%)'
    }}>
      {/* Cool Sky Blue Radiant Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-200/30 via-sky-300/40 to-sky-400/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 16 }}>
          <div className="text-center mb-3">
            <img
              src={logo}
              alt="EV Charging Station Logo"
              style={{
                height: '50px',
                width: 'auto',
                marginBottom: '12px'
              }}
            />
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          <Form
            form={form}
            layout="vertical"
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
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

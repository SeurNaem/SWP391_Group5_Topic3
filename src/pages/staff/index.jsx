import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Badge,
  Spin,
  message,
  Button,
  Tag,
  Space,
  Divider,
  Avatar,
  Descriptions,
} from "antd";
import {
  EnvironmentOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  LogoutOutlined,
  UserOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { getAssignedStations } from "../../service/staff.api";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/accountSlice";
import { toast } from "react-toastify";

const { Title, Text, Paragraph } = Typography;

const StaffPage = () => {
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const account = useSelector((state) => state.account);

  const fetchAssignedStations = async () => {
    setLoading(true);
    try {
      const data = await getAssignedStations();
      // Get single station (first item if array, or the object itself)
      const singleStation = Array.isArray(data) ? data[0] : data;
      setStation(singleStation);
    } catch (error) {
      console.error("Error loading station:", error);
      message.error("Failed to load assigned station");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedStations();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(logout());
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "online":
        return "success";
      case "offline":
        return "error";
      case "maintenance":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header Card */}
        <Card
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space align="center" size="large">
                <Avatar
                  size={64}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <Space direction="vertical" size={0}>
                  <Title level={3} style={{ margin: 0 }}>
                    {account?.user?.fullName || "Staff Member"}
                  </Title>
                  <Text type="secondary" style={{ fontSize: "16px" }}>
                    <ThunderboltOutlined /> Staff - Charging Station Manager
                  </Text>
                  <Text type="secondary">
                    {account?.user?.email || "No email"}
                  </Text>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchAssignedStations}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                  Logout
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Station Information Card */}
        {loading ? (
          <Card
            style={{
              borderRadius: "12px",
              textAlign: "center",
              padding: "48px",
            }}
          >
            <Spin size="large" />
          </Card>
        ) : !station ? (
          <Card
            style={{
              borderRadius: "12px",
              textAlign: "center",
              padding: "48px",
            }}
          >
            <ThunderboltOutlined
              style={{ fontSize: "64px", color: "#d9d9d9" }}
            />
            <Title level={4} style={{ marginTop: "16px", color: "#8c8c8c" }}>
              No Assigned Station
            </Title>
            <Paragraph type="secondary">
              You don't have any charging station assigned to you yet.
            </Paragraph>
          </Card>
        ) : (
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ fontSize: "20px" }} />
                <span style={{ fontSize: "18px" }}>
                  Assigned Charging Station
                </span>
              </Space>
            }
            style={{
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            extra={
              <Badge
                status={
                  getStatusColor(station.status) === "success"
                    ? "success"
                    : getStatusColor(station.status) === "error"
                    ? "error"
                    : "warning"
                }
                text={
                  <Text strong style={{ textTransform: "capitalize", fontSize: "16px" }}>
                    {station.status}
                  </Text>
                }
              />
            }
          >
            <Descriptions
              bordered
              column={{ xs: 1, sm: 1, md: 2 }}
              size="middle"
              labelStyle={{ fontWeight: 600, width: "180px" }}
            >
              <Descriptions.Item label="Station ID" span={2}>
                <Tag color="blue" style={{ fontSize: "14px" }}>
                  {station.stationId}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Station Name" span={2}>
                <Text strong style={{ fontSize: "16px" }}>
                  {station.name}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Address" span={2}>
                <Space>
                  <EnvironmentOutlined style={{ color: "#1890ff" }} />
                  <Text>{station.address}</Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <Badge
                  status={
                    getStatusColor(station.status) === "success"
                      ? "success"
                      : getStatusColor(station.status) === "error"
                      ? "error"
                      : "warning"
                  }
                  text={
                    <Text style={{ textTransform: "capitalize" }}>
                      {station.status}
                    </Text>
                  }
                />
              </Descriptions.Item>

              <Descriptions.Item label="Location">
                <Space>
                  <GlobalOutlined style={{ color: "#52c41a" }} />
                  <Text>GPS Coordinates</Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Latitude">
                <Tag color="geekblue">{station.latitude}°</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Longitude">
                <Tag color="green">{station.longitude}°</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ThunderboltOutlined />}
                  onClick={() => navigate(`/staff/charging-points/${station.stationId}`)}
                >
                  View All Charging Points
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  type="default"
                  size="large"
                  block
                  icon={<HistoryOutlined />}
                  onClick={() => navigate(`/staff/session-history/${station.stationId}`)}
                >
                  View Session History
                </Button>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button
                  type="default"
                  size="large"
                  block
                  icon={<HistoryOutlined />}
                  onClick={() => navigate(`/staff/session-detail`)}
                >
                  Search Session by ID
                </Button>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StaffPage;

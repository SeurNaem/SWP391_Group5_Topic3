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
  Statistic,
  Empty,
} from "antd";
import {
  ThunderboltOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  ApiOutlined,
  DollarOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getStationChargingPoints } from "../../service/staff.api";

const { Title, Text } = Typography;

const ChargingPointsPage = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { stationId } = useParams();

  const fetchChargingPoints = async () => {
    setLoading(true);
    try {
      const data = await getStationChargingPoints(stationId);
      // Handle both array and single object
      const pointsArray = Array.isArray(data) ? data : [data];
      setPoints(pointsArray);
    } catch (error) {
      console.error("Error loading charging points:", error);
      message.error("Failed to load charging points");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stationId) {
      fetchChargingPoints();
    }
  }, [stationId]);

  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "available":
        return { color: "success", text: "Available", badgeStatus: "success" };
      case "charging":
        return { color: "processing", text: "Charging", badgeStatus: "processing" };
      case "reserved":
        return { color: "warning", text: "Reserved", badgeStatus: "warning" };
      case "offline":
      case "out_of_service":
        return { color: "error", text: "Offline", badgeStatus: "error" };
      case "maintenance":
        return { color: "default", text: "Maintenance", badgeStatus: "default" };
      default:
        return { color: "default", text: status, badgeStatus: "default" };
    }
  };

  const getConnectorColor = (type) => {
    const typeUpper = type?.toUpperCase();
    switch (typeUpper) {
      case "CCS":
        return "blue";
      case "CHAdeMO":
        return "purple";
      case "TYPE2":
        return "green";
      case "TYPE1":
        return "cyan";
      case "GB/T":
        return "orange";
      default:
        return "default";
    }
  };

  // Calculate statistics
  const stats = {
    total: points.length,
    available: points.filter((p) => p.status?.toLowerCase() === "available").length,
    charging: points.filter((p) => p.status?.toLowerCase() === "charging").length,
    offline: points.filter(
      (p) =>
        p.status?.toLowerCase() === "offline" ||
        p.status?.toLowerCase() === "out_of_service"
    ).length,
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <Card
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size={0}>
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/staff")}
                  style={{ padding: 0, marginBottom: "8px" }}
                >
                  Back to Station Info
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  <ThunderboltOutlined style={{ color: "#1890ff" }} /> Charging
                  Points
                </Title>
                <Text type="secondary">Station ID: {stationId}</Text>
              </Space>
            </Col>
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchChargingPoints}
                loading={loading}
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col xs={12} sm={12} md={6}>
            <Card style={{ borderRadius: "12px" }}>
              <Statistic
                title="Total Points"
                value={stats.total}
                prefix={<ApiOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card style={{ borderRadius: "12px" }}>
              <Statistic
                title="Available"
                value={stats.available}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card style={{ borderRadius: "12px" }}>
              <Statistic
                title="Charging"
                value={stats.charging}
                prefix={<FireOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card style={{ borderRadius: "12px" }}>
              <Statistic
                title="Offline"
                value={stats.offline}
                prefix={<ApiOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charging Points Grid */}
        {points.length === 0 ? (
          <Card
            style={{
              borderRadius: "12px",
              textAlign: "center",
              padding: "48px",
            }}
          >
            <Empty
              description="No charging points found at this station"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {points.map((point) => {
              const statusConfig = getStatusConfig(point.status);
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={point.pointId}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      border: `2px solid ${
                        statusConfig.badgeStatus === "success"
                          ? "#52c41a"
                          : statusConfig.badgeStatus === "processing"
                          ? "#1890ff"
                          : statusConfig.badgeStatus === "warning"
                          ? "#faad14"
                          : "#d9d9d9"
                      }`,
                    }}
                  >
                    <Space
                      direction="vertical"
                      size="middle"
                      style={{ width: "100%" }}
                    >
                      {/* Point Header */}
                      <div style={{ textAlign: "center" }}>
                        <ApiOutlined
                          style={{
                            fontSize: "48px",
                            color:
                              statusConfig.badgeStatus === "success"
                                ? "#52c41a"
                                : statusConfig.badgeStatus === "processing"
                                ? "#1890ff"
                                : statusConfig.badgeStatus === "warning"
                                ? "#faad14"
                                : "#8c8c8c",
                          }}
                        />
                        <Title level={4} style={{ margin: "8px 0" }}>
                          Point #{point.pointId}
                        </Title>
                        <Badge
                          status={statusConfig.badgeStatus}
                          text={
                            <Text strong style={{ fontSize: "14px" }}>
                              {statusConfig.text}
                            </Text>
                          }
                        />
                      </div>

                      {/* Point Details */}
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: "100%" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text type="secondary">Connector Type:</Text>
                          <Tag
                            color={getConnectorColor(point.connectorType)}
                            style={{ margin: 0, fontWeight: "bold" }}
                          >
                            {point.connectorType}
                          </Tag>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text type="secondary">
                            <FireOutlined /> Max Power:
                          </Text>
                          <Text strong>{point.maxPower} kW</Text>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text type="secondary">
                            <DollarOutlined /> Price:
                          </Text>
                          <Text strong>${point.pricePerKwh}/kWh</Text>
                        </div>
                      </Space>

                      {/* Status Indicator Bar */}
                      <div
                        style={{
                          height: "4px",
                          borderRadius: "2px",
                          backgroundColor:
                            statusConfig.badgeStatus === "success"
                              ? "#52c41a"
                              : statusConfig.badgeStatus === "processing"
                              ? "#1890ff"
                              : statusConfig.badgeStatus === "warning"
                              ? "#faad14"
                              : "#d9d9d9",
                        }}
                      />
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </div>
  );
};

export default ChargingPointsPage;

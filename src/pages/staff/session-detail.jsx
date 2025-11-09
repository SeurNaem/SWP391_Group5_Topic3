import React, { useState } from "react";
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Descriptions,
  Tag,
  message,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getSessionById } from "../../service/staff.api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const SessionDetailPage = () => {
  const [sessionId, setSessionId] = useState("");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchSession = async () => {
    if (!sessionId) {
      message.warning("Please enter a Session ID");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Fetching session:", sessionId);
      const data = await getSessionById(sessionId);
      console.log("✅ Session data:", data);
      setSession(data);
      message.success("Session loaded successfully");
    } catch (error) {
      console.error("❌ Error loading session:", error);
      message.error(
        `Failed to load session: ${error.response?.data?.message || error.message}`
      );
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "completed":
        return { color: "success", text: "Completed" };
      case "active":
      case "in_progress":
        return { color: "processing", text: "Active" };
      case "cancelled":
        return { color: "error", text: "Cancelled" };
      case "failed":
        return { color: "error", text: "Failed" };
      default:
        return { color: "default", text: status };
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const diff = end.diff(start, "minute");
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <Card
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Space direction="vertical" size={0} style={{ width: "100%" }}>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/staff")}
              style={{ padding: 0, marginBottom: "8px" }}
            >
              Back to Station Info
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              <ThunderboltOutlined style={{ color: "#1890ff" }} /> Session
              Detail Lookup
            </Title>
            <Text type="secondary">
              Enter a Session ID to view charging session details
            </Text>
          </Space>
        </Card>

        {/* Search Card */}
        <Card
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
          }}
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input
              size="large"
              placeholder="Enter Session ID (e.g., 1, 2, 3...)"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              onPressEnter={fetchSession}
              type="number"
            />
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={fetchSession}
              loading={loading}
            >
              Search
            </Button>
          </Space.Compact>
        </Card>

        {/* Session Details */}
        {session && (
          <Card
            title={
              <Space>
                <ThunderboltOutlined />
                Session Details
              </Space>
            }
            style={{
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            extra={
              <Tag color={getStatusConfig(session.status).color}>
                {getStatusConfig(session.status).text}
              </Tag>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Session ID" span={2}>
                <Tag color="blue" style={{ fontSize: "16px" }}>
                  #{session.sessionId}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Station ID">
                <Tag color="purple">Station {session.stationId}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Point ID">
                <Tag color="cyan">Point {session.pointId}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Status" span={2}>
                <Tag color={getStatusConfig(session.status).color} style={{ fontSize: "14px" }}>
                  {getStatusConfig(session.status).text}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Start Time">
                <Space direction="vertical" size={0}>
                  <Text>{dayjs(session.startTime).format("DD/MM/YYYY")}</Text>
                  <Text type="secondary">
                    {dayjs(session.startTime).format("HH:mm:ss")}
                  </Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="End Time">
                {session.endTime ? (
                  <Space direction="vertical" size={0}>
                    <Text>{dayjs(session.endTime).format("DD/MM/YYYY")}</Text>
                    <Text type="secondary">
                      {dayjs(session.endTime).format("HH:mm:ss")}
                    </Text>
                  </Space>
                ) : (
                  <Text type="secondary">Ongoing</Text>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Duration">
                <Text strong>
                  {calculateDuration(session.startTime, session.endTime)}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Energy Consumed">
                <Text strong style={{ color: "#faad14" }}>
                  {session.energyConsumed} kWh
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Total Cost" span={2}>
                <Text strong style={{ fontSize: "18px", color: "#52c41a" }}>
                  ${session.cost?.toFixed(2) || "0.00"}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SessionDetailPage;

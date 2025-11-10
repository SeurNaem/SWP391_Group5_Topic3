import React, { useState } from "react";
import {
  Card,
  Table,
  Typography,
  Badge,
  message,
  Button,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  InputNumber,
  Alert,
} from "antd";
import {
  HistoryOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FireOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getSessionById } from "../../service/staff.api";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const { Title, Text } = Typography;

const SessionHistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [startId, setStartId] = useState(1);
  const [endId, setEndId] = useState(10);
  const navigate = useNavigate();
  const { stationId } = useParams();

  const fetchMultipleSessions = async () => {
    if (!startId || !endId || startId > endId) {
      message.warning("Please enter a valid range (Start ID ≤ End ID)");
      return;
    }

    if (endId - startId > 50) {
      message.warning("Range too large! Maximum 50 sessions at once");
      return;
    }

    setLoading(true);
    const sessionPromises = [];

    try {
      console.log(`🔍 Fetching sessions from ${startId} to ${endId}`);
      
      // Create promises for all session IDs in range
      for (let id = startId; id <= endId; id++) {
        sessionPromises.push(
          getSessionById(id)
            .then(data => {
              // Only add sessions that belong to this station
              if (data && (!stationId || data.stationId === parseInt(stationId))) {
                return data;
              }
              return null;
            })
            .catch(error => {
              console.log(`Session ${id} not found or error:`, error.response?.status);
              return null;
            })
        );
      }

      // Wait for all promises to resolve
      const results = await Promise.all(sessionPromises);
      
      // Filter out null values (not found sessions)
      const validSessions = results.filter(session => session !== null);
      
      console.log("✅ Loaded sessions:", validSessions);
      setSessions(validSessions);
      setFilteredSessions(validSessions);
      
      message.success(`Loaded ${validSessions.length} sessions`);
    } catch (error) {
      console.error("❌ Error loading sessions:", error);
      message.error("Failed to load sessions");
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
    const diff = end.diff(start);
    const dur = dayjs.duration(diff);
    const hours = Math.floor(dur.asHours());
    const minutes = dur.minutes();
    return `${hours}h ${minutes}m`;
  };

  // Calculate statistics
  const stats = {
    total: filteredSessions.length,
    completed: sessions.filter((s) => s.status?.toLowerCase() === "completed")
      .length,
    totalEnergy: sessions
      .filter((s) => s.status?.toLowerCase() === "completed")
      .reduce((sum, s) => sum + (s.energyConsumed || 0), 0),
    totalRevenue: sessions
      .filter((s) => s.status?.toLowerCase() === "completed")
      .reduce((sum, s) => sum + (s.cost || 0), 0),
  };

  const columns = [
    {
      title: "Session ID",
      dataIndex: "sessionId",
      key: "sessionId",
      width: 100,
      sorter: (a, b) => a.sessionId - b.sessionId,
      render: (id) => (
        <Tag color="blue" style={{ fontWeight: "bold" }}>
          #{id}
        </Tag>
      ),
    },
    {
      title: "Point ID",
      dataIndex: "pointId",
      key: "pointId",
      width: 100,
      render: (id) => (
        <Tag color="purple">
          <ThunderboltOutlined /> Point {id}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: [
        { text: "Completed", value: "completed" },
        { text: "Active", value: "active" },
        { text: "Cancelled", value: "cancelled" },
        { text: "Failed", value: "failed" },
      ],
      onFilter: (value, record) => record.status?.toLowerCase() === value,
      render: (status) => {
        const config = getStatusConfig(status);
        return <Badge status={config.color} text={config.text} />;
      },
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      width: 180,
      sorter: (a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix(),
      render: (time) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(time).format("DD/MM/YYYY")}</Text>
          <Text type="secondary">{dayjs(time).format("HH:mm:ss")}</Text>
        </Space>
      ),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      width: 180,
      render: (time) =>
        time ? (
          <Space direction="vertical" size={0}>
            <Text>{dayjs(time).format("DD/MM/YYYY")}</Text>
            <Text type="secondary">{dayjs(time).format("HH:mm:ss")}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Duration",
      key: "duration",
      width: 100,
      render: (_, record) => (
        <Text>
          <ClockCircleOutlined /> {calculateDuration(record.startTime, record.endTime)}
        </Text>
      ),
    },
    {
      title: "Energy (kWh)",
      dataIndex: "energyConsumed",
      key: "energyConsumed",
      width: 120,
      sorter: (a, b) => (a.energyConsumed || 0) - (b.energyConsumed || 0),
      render: (energy) => (
        <Text strong>
          <FireOutlined style={{ color: "#faad14" }} /> {energy || 0} kWh
        </Text>
      ),
    },
    {
      title: "Cost",
      dataIndex: "cost",
      key: "cost",
      width: 100,
      sorter: (a, b) => (a.cost || 0) - (b.cost || 0),
      render: (cost) => (
        <Text strong style={{ color: "#52c41a" }}>
          <DollarOutlined /> ${cost?.toFixed(2) || "0.00"}
        </Text>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
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
                  <HistoryOutlined style={{ color: "#1890ff" }} /> Session
                  History
                </Title>
                <Text type="secondary">
                  {stationId ? `Station ID: ${stationId}` : "All Stations"}
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Info Alert */}
        <Alert
          message="How to Load Session History"
          description="Enter a range of Session IDs to load (e.g., 1 to 20). The system will fetch all sessions in this range. Sessions belonging to your station will be displayed."
          type="info"
          showIcon
          style={{ marginBottom: "24px", borderRadius: "12px" }}
        />

        {/* Load Sessions */}
        <Card
          style={{
            marginBottom: "24px",
            borderRadius: "12px",
          }}
        >
          <Space size="middle" wrap>
            <Text strong>Load Sessions from ID:</Text>
            <InputNumber
              min={1}
              value={startId}
              onChange={setStartId}
              placeholder="Start ID"
              style={{ width: 120 }}
            />
            <Text>to</Text>
            <InputNumber
              min={1}
              value={endId}
              onChange={setEndId}
              placeholder="End ID"
              style={{ width: 120 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchMultipleSessions}
              loading={loading}
            >
              Load Sessions
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setStartId(1);
                setEndId(10);
                setSessions([]);
                setFilteredSessions([]);
              }}
            >
              Clear
            </Button>
          </Space>
        </Card>

        {/* Statistics Cards */}
        {sessions.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={12} sm={12} md={6}>
              <Card style={{ borderRadius: "12px" }}>
                <Statistic
                  title="Total Sessions"
                  value={stats.total}
                  prefix={<HistoryOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card style={{ borderRadius: "12px" }}>
                <Statistic
                  title="Completed"
                  value={stats.completed}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card style={{ borderRadius: "12px" }}>
                <Statistic
                  title="Total Energy"
                  value={stats.totalEnergy.toFixed(2)}
                  suffix="kWh"
                  prefix={<FireOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card style={{ borderRadius: "12px" }}>
                <Statistic
                  title="Total Revenue"
                  value={stats.totalRevenue.toFixed(2)}
                  prefix="$"
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Sessions Table */}
        <Card
          style={{
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Table
            columns={columns}
            dataSource={filteredSessions}
            rowKey="sessionId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} sessions`,
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: loading
                ? "Loading..."
                : "No sessions loaded. Please enter a Session ID range and click 'Load Sessions'",
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default SessionHistoryPage;

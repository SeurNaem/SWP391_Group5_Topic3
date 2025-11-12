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
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getStationChargingPoints, startSession, stopSession, getStationReservations, getStationActiveSessions } from "../../service/staff.api";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const ChargingPointsPage = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [activeSessions, setActiveSessions] = useState({}); // Store sessionId for each pointId
  const navigate = useNavigate();
  const { stationId } = useParams();
  const account = useSelector((state) => state.account);

  const fetchChargingPoints = async () => {
    setLoading(true);
    try {
      console.log("Fetching charging points for station:", stationId);
      const data = await getStationChargingPoints(stationId);
      console.log("Charging points received:", data);
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

  const handleStartSession = async (point) => {
    console.log("=== START SESSION CLICKED ===");
    console.log("Point object received:", point);
    console.log("Point ID:", point.pointId);
    console.log("Point Status:", point.status);
    
    setActionLoading((prev) => ({ ...prev, [point.pointId]: "start" }));
    try {
      console.log("Step 1: Fetching all reservations for station:", stationId);
      // Fetch all reservations for this station
      const reservations = await getStationReservations(stationId);
      console.log("Step 2: All reservations received:", reservations);
      
      // Handle both array and single object
      const reservationsArray = Array.isArray(reservations) ? reservations : [reservations];
      console.log("Step 3: Reservations array:", reservationsArray);
      
      // Find the reservation for this specific charging point
      const matchingReservation = reservationsArray.find(
        (res) => res.pointId === point.pointId && res.status?.toLowerCase() === "confirmed"
      );
      
      console.log("Step 4: Matching reservation found:", matchingReservation);
      
      if (!matchingReservation) {
        console.error("ERROR: No confirmed reservation found for this charging point");
        message.error("No confirmed reservation found for this charging point");
        setActionLoading((prev) => ({ ...prev, [point.pointId]: null }));
        return;
      }
      
      // Validate reservation data
      if (!matchingReservation.userId || !matchingReservation.pointId || !matchingReservation.reservationId) {
        console.error("ERROR: Incomplete reservation data:", matchingReservation);
        message.error("Incomplete reservation data");
        setActionLoading((prev) => ({ ...prev, [point.pointId]: null }));
        return;
      }
      
      // Prepare session data with all fields from reservation
      const sessionData = {
        userId: matchingReservation.userId,           // Fetch from reservation
        pointId: matchingReservation.pointId,         // Fetch from reservation
        reservationId: matchingReservation.reservationId, // Fetch from reservation
        vehicleId: 0,                                 // Keep as 0
        paymentMethod: matchingReservation.paymentMethod || "banking" // e-wallet or banking
      };

      console.log("Step 5: Prepared session data:", sessionData);
      console.log("Step 6: Calling startSession API...");
      // Start the session - this will change status from "reserved" to "in use"
      const response = await startSession(sessionData);
      console.log("Step 7: Session start response received:", response);
      console.log("Step 7a: Response structure:", JSON.stringify(response, null, 2));
      
      // Extract sessionId from response (might be nested in data property)
      const sessionId = response?.sessionId || response?.data?.sessionId;
      console.log("Step 7b: Extracted sessionId:", sessionId);
      
      // Store the sessionId for this point
      if (sessionId) {
        console.log("Step 7c: Storing sessionId:", sessionId, "for pointId:", point.pointId);
        setActiveSessions((prev) => ({
          ...prev,
          [point.pointId]: {
            sessionId: sessionId,
            paymentMethod: sessionData.paymentMethod
          }
        }));
        console.log("Step 7d: Session stored successfully");
      } else {
        console.error("ERROR: No sessionId found in response:", response);
        message.warning("Session started but sessionId not returned. You may need to refresh.");
      }
      
      message.success("Session started successfully - Status changed to In Use");
      
      console.log("Step 8: Refreshing charging points...");
      // Refresh charging points to show updated status
      setTimeout(() => {
        fetchChargingPoints();
      }, 500);
    } catch (error) {
      console.error("=== ERROR IN START SESSION ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      message.error(error.response?.data?.message || error.message || "Failed to start session");
    } finally {
      console.log("=== END START SESSION ===");
      setActionLoading((prev) => ({ ...prev, [point.pointId]: null }));
    }
  };

  const handleStopSession = async (pointOrId) => {
    console.log("=== STOP SESSION CLICKED ===");
    console.log("Point parameter received:", pointOrId);
    
    // Handle both cases: if pointOrId is a number (pointId) or an object (point)
    const pointId = typeof pointOrId === 'number' ? pointOrId : pointOrId.pointId;
    const pointStatus = typeof pointOrId === 'object' ? pointOrId.status : null;
    
    console.log("Point ID:", pointId);
    console.log("Point Status:", pointStatus);
    
    setActionLoading((prev) => ({ ...prev, [pointId]: "stop" }));
    try {
      console.log("Step 1: Fetching reservations for station:", stationId);
      // Fetch all reservations to find the one for this point
      const reservations = await getStationReservations(stationId);
      console.log("Step 2: Reservations received:", JSON.stringify(reservations, null, 2));
      
      // Handle both array and single object
      const reservationsArray = Array.isArray(reservations) ? reservations : [reservations];
      
      // Find the reservation for this specific charging point
      const matchingReservation = reservationsArray.find(
        (res) => res.pointId === pointId && res.status === "confirmed"
      );
      
      console.log("Step 3: Matching reservation found:", matchingReservation);
      
      if (!matchingReservation) {
        console.error("ERROR: No confirmed reservation found for this charging point");
        message.error("No confirmed reservation found for this charging point");
        setActionLoading((prev) => ({ ...prev, [pointId]: null }));
        return;
      }
      
      const reservationId = matchingReservation.reservationId;
      console.log("Step 4: Using reservationId:", reservationId);

      let sessionId = null;

      // Get sessionId from active sessions API by matching pointId
      try {
        console.log("Step 5: Fetching active sessions for station:", stationId);
        const sessions = await getStationActiveSessions(stationId);
        console.log("Step 6: Active sessions received:", JSON.stringify(sessions, null, 2));
        
        // Handle both array and single object
        const sessionsArray = Array.isArray(sessions) ? sessions : [sessions];
        
        // Find the session that matches this pointId
        const matchingSession = sessionsArray.find(
          (session) => session.pointId === pointId
        );
        
        console.log("Step 7: Matching session found by pointId:", matchingSession);
        
        if (matchingSession && matchingSession.sessionId) {
          sessionId = matchingSession.sessionId;
          console.log("Step 8: Found sessionId from active sessions API:", sessionId);
        } else {
          console.warn("WARNING: No session found for pointId:", pointId);
          console.log("Available sessions:", sessionsArray.map(s => ({ 
            sessionId: s.sessionId, 
            pointId: s.pointId,
            reservationId: s.reservationId 
          })));
        }
      } catch (sessionError) {
        console.warn("WARNING: Could not fetch from active sessions API:", sessionError);
        console.log("Step 8alt: Will try to use stored sessionId");
      }

      // Fallback: Try to get sessionId from stored sessions
      if (!sessionId && activeSessions[pointId]) {
        sessionId = activeSessions[pointId].sessionId;
        console.log("Step 9: Using stored sessionId:", sessionId);
      }

      // If still no sessionId, show error
      if (!sessionId) {
        console.error("ERROR: Could not find sessionId for this charging point");
        message.error("No active session found for this charging point. Please start a session first.");
        setActionLoading((prev) => ({ ...prev, [pointId]: null }));
        return;
      }
      
      console.log("Step 10: Final sessionId to use:", sessionId);
      
      // Prepare stop session data
      const stopData = {
        sessionId: sessionId,
        endTime: new Date().toISOString(),
        energyConsumed: 0,
        paymentMethod: matchingReservation.paymentMethod || "banking",
        createInvoice: true
      };

      console.log("Step 11: Prepared stop session data:", JSON.stringify(stopData, null, 2));
      console.log("Step 12: Calling POST Staff/session/stop");
      
      const response = await stopSession(stopData);
      console.log("Step 13: Session stop response:", JSON.stringify(response, null, 2));
      
      message.success("Session stopped successfully - Status changed to Available");
      
      console.log("Step 14: Refreshing charging points...");
      setTimeout(() => {
        fetchChargingPoints();
      }, 1000);
    } catch (error) {
      console.error("=== ERROR IN STOP SESSION ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error stack:", error.stack);
      message.error(error.response?.data?.message || error.message || "Failed to stop session");
      setActionLoading((prev) => ({ ...prev, [pointId]: null }));
    } finally {
      console.log("=== END STOP SESSION ===");
    }
  };

  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "available":
        return { color: "success", text: "Available", badgeStatus: "success" };
      case "charging":
        return { color: "processing", text: "Charging", badgeStatus: "processing" };
      case "in use":
      case "in_use":
      case "inuse":
        return { color: "processing", text: "In Use", badgeStatus: "processing" };
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
    charging: points.filter(
      (p) => 
        p.status?.toLowerCase() === "charging" ||
        p.status?.toLowerCase() === "in use" ||
        p.status?.toLowerCase() === "in_use" ||
        p.status?.toLowerCase() === "inuse"
    ).length,
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

                      {/* Action Buttons */}
                      <Space style={{ width: "100%", justifyContent: "center" }}>
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleStartSession(point)}
                          loading={actionLoading[point.pointId] === "start"}
                          disabled={
                            point.status?.toLowerCase() !== "reserved" ||
                            actionLoading[point.pointId]
                          }
                          style={{
                            backgroundColor: "#52c41a",
                            borderColor: "#52c41a",
                          }}
                        >
                          Start
                        </Button>
                        <Button
                          danger
                          icon={<StopOutlined />}
                          onClick={() => handleStopSession(point)}
                          loading={actionLoading[point.pointId] === "stop"}
                          disabled={
                            !(
                              point.status?.toLowerCase() === "in use" ||
                              point.status?.toLowerCase() === "in_use" ||
                              point.status?.toLowerCase() === "inuse"
                            ) || actionLoading[point.pointId]
                          }
                        >
                          Stop
                        </Button>
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

import React, { useState, useEffect, useCallback } from "react";
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
  Progress,
  Tooltip,
  Alert,
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
  ClockCircleOutlined,
  WarningOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getStationChargingPoints, startSession, stopSession, getStationReservations, getStationActiveSessions } from "../../service/staff.api";
import { triggerAutoStop } from "../../service/auto-stop.api";
import { sessionManager } from "../../utils/SessionManager";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ChargingPointsPage = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [activeSessions, setActiveSessions] = useState({}); // Store sessionId for each pointId
  const [sessionTimers, setSessionTimers] = useState({}); // Store session progress info
  const [expiredSessions, setExpiredSessions] = useState([]); // Store sessions that need auto-stop
  const [autoStopInProgress, setAutoStopInProgress] = useState(new Set()); // Track ongoing auto-stops
  const navigate = useNavigate();
  const { stationId } = useParams();

  const fetchChargingPoints = useCallback(async () => {
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
  }, [stationId]);

  // Simplified auto-stop functionality using client-side expiry detection
  // No need for backend expired-sessions endpoint - we check active sessions
  const checkForExpiredSessions = useCallback(async () => {
    try {
      // Get active sessions from the backend
      const activeSessions = await getStationActiveSessions(stationId);

      if (!activeSessions || activeSessions.length === 0) {
        setExpiredSessions([]);
        return;
      }

      console.log(`Checking ${activeSessions.length} active sessions for expiry...`);

      // Filter expired sessions using client-side logic
      const expiredSessionsList = activeSessions.filter(session => {
        if (!session.startTime || !session.duration) {
          return false;
        }

        const startTime = new Date(session.startTime);
        const plannedEndTime = new Date(startTime.getTime() + (session.duration * 60 * 1000)); // Changed from hours to minutes
        const currentTime = new Date();
        const remainingMinutes = (plannedEndTime - currentTime) / (1000 * 60);

        return remainingMinutes <= 0; // Session has expired
      });

      setExpiredSessions(expiredSessionsList || []);

      // Trigger auto-stop for expired sessions
      if (expiredSessionsList && expiredSessionsList.length > 0) {
        console.log(`Found ${expiredSessionsList.length} expired sessions:`, expiredSessionsList);

        for (const session of expiredSessionsList) {
          const sessionKey = `${session.sessionId}_${session.pointId}`;

          // Skip if auto-stop already in progress
          if (autoStopInProgress.has(sessionKey)) {
            continue;
          }

          setAutoStopInProgress(prev => new Set(prev).add(sessionKey));

          try {
            // Calculate estimated energy consumption
            const startTime = new Date(session.startTime);
            const currentTime = new Date();
            const actualHours = (currentTime - startTime) / (1000 * 60 * 60);
            const estimatedEnergy = Math.round(actualHours * (session.maxPower || 25) * 0.8 * 100) / 100;

            await triggerAutoStop(session.sessionId, {
              energyConsumed: estimatedEnergy,
              paymentMethod: session.paymentMethod || "e-wallet"
            });

            message.success(`Session ${session.sessionId} auto-stopped after ${session.duration || 'planned'} minutes`);

            // Remove from active sessions
            setActiveSessions(prev => {
              const updated = { ...prev };
              delete updated[session.pointId];
              return updated;
            });

          } catch (autoStopError) {
            console.error(`Failed to auto-stop session ${session.sessionId}:`, autoStopError);
            message.error(`Auto-stop failed for session ${session.sessionId}. Please stop manually.`);
          } finally {
            setAutoStopInProgress(prev => {
              const updated = new Set(prev);
              updated.delete(sessionKey);
              return updated;
            });
          }
        }

        // Refresh charging points after auto-stop
        setTimeout(() => fetchChargingPoints(), 2000);
      }
    } catch (error) {
      console.error('Error checking expired sessions:', error);
      // Silently handle API errors
      if (error.response?.status === 404) {
        console.log('Active sessions API not available - skipping expired session check');
      } else {
        console.warn('Unexpected error in expired session check:', error.message);
      }
    }
  }, [stationId, autoStopInProgress, fetchChargingPoints]);

  // Calculate session progress and time remaining with seconds precision
  // Duration is now stored in minutes instead of hours
  const calculateSessionProgress = useCallback((session) => {
    if (!session.startTime || !session.duration) return null;

    const startTime = dayjs(session.startTime);
    const endTime = startTime.add(session.duration, 'minutes'); // Changed from hours to minutes
    const now = dayjs();

    const totalDuration = session.duration; // Already in minutes, no conversion needed
    const elapsed = now.diff(startTime, 'minute');
    const remaining = endTime.diff(now, 'minute');
    const remainingSeconds = endTime.diff(now, 'second');

    return {
      progress: Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)),
      remainingMinutes: Math.max(0, remaining),
      remainingSeconds: Math.max(0, remainingSeconds),
      isExpired: remaining <= 0,
      endTime: endTime.format('HH:mm'),
      elapsedMinutes: elapsed,
      overrunMinutes: remaining < 0 ? Math.abs(remaining) : 0
    };
  }, []);

  // Update session timers
  const updateSessionTimers = useCallback(() => {
    setSessionTimers(prev => {
      const updated = { ...prev };
      Object.keys(activeSessions).forEach(pointId => {
        const session = activeSessions[pointId];
        if (session && session.startTime && session.duration) {
          updated[pointId] = calculateSessionProgress({
            startTime: session.startTime,
            duration: session.duration,
            sessionId: session.sessionId
          });
        }
      });
      return updated;
    });
  }, [activeSessions, calculateSessionProgress]);

  useEffect(() => {
    if (stationId) {
      fetchChargingPoints();
    }
  }, [stationId, fetchChargingPoints]);

  // Set up simplified auto-stop monitoring with client-side expiry detection
  useEffect(() => {
    if (stationId) {
      // Check for expired sessions using active sessions API + client-side logic every 30 seconds
      const expiredSessionChecker = setInterval(() => {
        checkForExpiredSessions();
      }, 30000);

      // Update session timers every 10 seconds for responsive countdown
      const timerUpdater = setInterval(() => {
        updateSessionTimers();
      }, 10000);

      // Initial checks
      checkForExpiredSessions();
      updateSessionTimers();

      return () => {
        clearInterval(expiredSessionChecker);
        clearInterval(timerUpdater);
      };
    }
  }, [stationId, checkForExpiredSessions, updateSessionTimers]);

  // Monitor active sessions with SessionManager
  useEffect(() => {
    Object.entries(activeSessions).forEach(([, session]) => {
      if (session.sessionId && session.duration && session.startTime) {
        sessionManager.monitorSession(
          session,
          (pointId, progress) => {
            // Update session timers
            setSessionTimers(prev => ({
              ...prev,
              [pointId]: progress
            }));
          },
          (pointId, sessionId) => {
            // Session was auto-stopped
            console.log(`Session ${sessionId} was auto-stopped for point ${pointId}`);
            setActiveSessions(prev => {
              const updated = { ...prev };
              delete updated[pointId];
              return updated;
            });
          },
          () => {
            // Refresh needed
            fetchChargingPoints();
          }
        );
      }
    });

    // Cleanup function
    return () => {
      sessionManager.cleanup();
    };
  }, [activeSessions, fetchChargingPoints]);

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
      console.log("Step 4a: Reservation fields:", Object.keys(matchingReservation));
      console.log("Step 4b: Checking for duration fields:", {
        duration: matchingReservation.duration,
        chargingDuration: matchingReservation.chargingDuration,
        minutes: matchingReservation.minutes,
        startTime: matchingReservation.startTime,
        endTime: matchingReservation.endTime
      });

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

      // Calculate duration - PRIORITIZE user-selected duration from payment page
      console.log("Step 4a: Getting duration - checking localStorage first...");

      // First, try to get the user-selected duration from payment page
      const key1 = `selectedDuration_${matchingReservation.reservationId}`;
      const key2 = `selectedDuration_point_${matchingReservation.pointId}`;
      const key3 = `lastSelectedDuration`;
      const key4 = `duration_for_reservation_${matchingReservation.reservationId}`;

      const value1 = localStorage.getItem(key1);
      const value2 = localStorage.getItem(key2);
      const value3 = localStorage.getItem(key3);
      const value4 = localStorage.getItem(key4);

      const selectedDurationFromPayment = value1 || value2 || value3 || value4;

      console.log("Step 4b: localStorage check results:");
      console.log("  - keys checked:", key1, key2, key3, key4);
      console.log("  - values found:", value1, value2, value3, value4);
      console.log("  - selected duration from payment:", selectedDurationFromPayment);

      let durationMinutes;

      if (selectedDurationFromPayment) {
        // Use the user-selected duration from payment page
        durationMinutes = parseInt(selectedDurationFromPayment);
        console.log("Step 4c: ✅ Using USER-SELECTED duration:", durationMinutes, "minutes");
        // Clean up localStorage after using it
        localStorage.removeItem(key1);
        localStorage.removeItem(key2);
        localStorage.removeItem(key4);
        // Keep lastSelectedDuration for debugging
      } else {
        // Fallback to reservation-based calculation
        durationMinutes = matchingReservation.duration;

        if (!durationMinutes && matchingReservation.startTime && matchingReservation.endTime) {
          const startTime = new Date(matchingReservation.startTime);
          const endTime = new Date(matchingReservation.endTime);
          durationMinutes = Math.round((endTime - startTime) / (1000 * 60)); // Convert ms to minutes
          console.log("Step 4d: Calculated duration from start/end times:", durationMinutes, "minutes");
        }

        if (!durationMinutes) {
          durationMinutes = 120; // Fallback to 120 minutes
          console.log("Step 4e: Using fallback duration:", durationMinutes, "minutes");
        } else {
          console.log("Step 4f: ⚠️ Using API default duration:", durationMinutes, "minutes (user selection not found)");
        }
      }

      // Prepare session data with all fields from reservation
      const sessionData = {
        userId: matchingReservation.userId,           // Fetch from reservation
        pointId: matchingReservation.pointId,         // Fetch from reservation
        reservationId: matchingReservation.reservationId, // Fetch from reservation
        vehicleId: 0,                                 // Keep as 0
        minutes: durationMinutes,                     // Duration is already in minutes
        paymentMethod: matchingReservation.paymentMethod || "banking" // e-wallet or banking
      };

      console.log("Step 5: Prepared session data with duration:", sessionData);
      console.log("Step 5a: Auto-stop will trigger after", durationMinutes, "minutes");
      console.log("Step 6: Calling startSession API...");
      // Start the session - this will change status from "reserved" to "in use"
      const response = await startSession(sessionData);
      console.log("Step 7: Session start response received:", response);
      console.log("Step 7a: Response structure:", JSON.stringify(response, null, 2));

      // Extract sessionId from response (nested in session property)
      const sessionId = response?.session?.sessionId || response?.sessionId || response?.data?.sessionId;
      console.log("Step 7b: Extracted sessionId:", sessionId);

      // Store the sessionId for this point with complete auto-stop data
      if (sessionId) {
        console.log("Step 7c: Storing sessionId:", sessionId, "for pointId:", point.pointId);

        // Use the actual duration from sessionData.minutes instead of fallback
        const actualDuration = sessionData.minutes;
        console.log("Step 7d: Using actual duration from session data:", actualDuration);

        const sessionInfo = {
          sessionId: sessionId,
          pointId: point.pointId,
          paymentMethod: sessionData.paymentMethod,
          duration: actualDuration, // Use actual duration from session data
          startTime: new Date().toISOString(), // Current time as start time
          endTime: new Date(Date.now() + (actualDuration * 60 * 1000)).toISOString(), // Expected end time
          vehicleType: matchingReservation.vehicleType,
          licensePlate: matchingReservation.licensePlate,
          maxPower: point.maxPower || 25, // For energy calculation
          userId: matchingReservation.userId
        };

        setActiveSessions((prev) => ({
          ...prev,
          [point.pointId]: sessionInfo
        }));

        console.log("Step 7e: Session stored successfully with auto-stop data:", sessionInfo);
        console.log("Step 7f: Auto-stop scheduled for:", sessionInfo.endTime);

        // Show auto-stop confirmation message
        message.success({
          content: `Session started! Will automatically stop after ${actualDuration} minutes`,
          duration: 5,
          icon: <RobotOutlined style={{ color: '#52c41a' }} />
        });
      } else {
        console.error("ERROR: No sessionId found in response:", response);
        message.warning("Session started but sessionId not returned. You may need to refresh.");
      }

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
      // First, try to get sessionId from our stored active sessions
      let sessionId = null;
      let paymentMethod = "e-wallet";

      if (activeSessions[pointId] && activeSessions[pointId].sessionId) {
        sessionId = activeSessions[pointId].sessionId;
        paymentMethod = activeSessions[pointId].paymentMethod || "e-wallet";
        console.log("Step 1: Using stored sessionId:", sessionId);
      } else {
        // Fallback: Get sessionId from active sessions API
        try {
          console.log("Step 1: Fetching active sessions for station:", stationId);
          const sessions = await getStationActiveSessions(stationId);
          console.log("Step 2: Active sessions received:", JSON.stringify(sessions, null, 2));

          // Handle both array and single object
          const sessionsArray = Array.isArray(sessions) ? sessions : [sessions];

          // Find the session that matches this pointId
          const matchingSession = sessionsArray.find(
            (session) => session.pointId === pointId
          );

          console.log("Step 3: Matching session found by pointId:", matchingSession);

          if (matchingSession && matchingSession.sessionId) {
            sessionId = matchingSession.sessionId;
            paymentMethod = matchingSession.paymentMethod || "e-wallet";
            console.log("Step 4: Found sessionId from API:", sessionId);
          }
        } catch (sessionError) {
          console.warn("WARNING: Could not fetch from active sessions API:", sessionError);
        }
      }

      // If still no sessionId, show error
      if (!sessionId) {
        console.error("ERROR: Could not find sessionId for this charging point");
        message.error("No active session found for this charging point. The session may have already ended.");
        setActionLoading((prev) => ({ ...prev, [pointId]: null }));
        return;
      }

      console.log("Step 5: Final sessionId to use:", sessionId);

      // Prepare stop session data
      const stopData = {
        sessionId: sessionId,
        endTime: new Date().toISOString(),
        energyConsumed: 0,
        paymentMethod: paymentMethod,
        createInvoice: true
      };

      console.log("Step 6: Prepared stop session data:", JSON.stringify(stopData, null, 2));
      console.log("Step 7: Calling POST Staff/session/stop");

      const response = await stopSession(stopData);
      console.log("Step 8: Session stop response:", JSON.stringify(response, null, 2));

      // Remove from active sessions
      setActiveSessions((prev) => {
        const updated = { ...prev };
        delete updated[pointId];
        return updated;
      });

      message.success("Session stopped successfully - Status changed to Available");

      console.log("Step 9: Refreshing charging points...");
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

        {/* Auto-Stop Status Alert */}
        {(Object.keys(activeSessions).length > 0 || expiredSessions.length > 0) && (
          <Alert
            message={
              <div>
                <RobotOutlined style={{ marginRight: '8px' }} />
                Auto-Stop Monitoring Active
              </div>
            }
            description={
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Active Sessions:</strong> {Object.keys(activeSessions).length} session(s) with automatic duration management
                </div>
                {expiredSessions.length > 0 && (
                  <div style={{ color: '#ff4d4f' }}>
                    <WarningOutlined style={{ marginRight: '4px' }} />
                    <strong>Expired:</strong> {expiredSessions.length} session(s) exceeded duration and will be auto-stopped
                  </div>
                )}
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Sessions will automatically stop when their planned duration is reached.
                  Warnings will be sent at 15min and 5min before expiry.
                </div>
              </div>
            }
            type={expiredSessions.length > 0 ? "warning" : "info"}
            showIcon
            style={{ marginBottom: "24px", borderRadius: "12px" }}
          />
        )}

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
                      border: `2px solid ${statusConfig.badgeStatus === "success"
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

                        {/* Countdown Timer for Active Sessions */}
                        {(point.status?.toLowerCase() === "in use" ||
                          point.status?.toLowerCase() === "in_use" ||
                          point.status?.toLowerCase() === "inuse") &&
                          sessionTimers[point.pointId] && (
                            <div style={{
                              marginTop: "12px",
                              padding: "8px 12px",
                              backgroundColor: sessionTimers[point.pointId].isExpired ? "#fff2f0" : "#f6ffed",
                              border: sessionTimers[point.pointId].isExpired ? "1px solid #ffccc7" : "1px solid #b7eb8f",
                              borderRadius: "8px"
                            }}>
                              {sessionTimers[point.pointId].isExpired ? (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    color: "#ff4d4f",
                                    marginBottom: "2px"
                                  }}>
                                    <WarningOutlined /> SESSION EXPIRED
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#ff7875" }}>
                                    Overrun: {Math.round(sessionTimers[point.pointId].overrunMinutes)} minutes
                                  </div>
                                </div>
                              ) : (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "12px", color: "#52c41a", marginBottom: "2px" }}>
                                    <ClockCircleOutlined /> Time Remaining
                                  </div>
                                  <div style={{
                                    fontSize: "18px",
                                    fontWeight: "bold",
                                    color: sessionTimers[point.pointId].remainingMinutes <= 15 ? "#faad14" :
                                      sessionTimers[point.pointId].remainingMinutes <= 5 ? "#ff4d4f" : "#52c41a"
                                  }}>
                                    {sessionTimers[point.pointId].remainingMinutes <= 5 && sessionTimers[point.pointId].remainingMinutes > 0 ? (
                                      // Show seconds when less than 5 minutes remaining
                                      `${Math.floor(sessionTimers[point.pointId].remainingSeconds / 60)}:${String(sessionTimers[point.pointId].remainingSeconds % 60).padStart(2, '0')}`
                                    ) : sessionTimers[point.pointId].remainingMinutes < 60 ? (
                                      // Show minutes only when less than 1 hour
                                      `${Math.round(sessionTimers[point.pointId].remainingMinutes)} min`
                                    ) : (
                                      // Show hours and minutes when more than 1 hour
                                      `${Math.floor(sessionTimers[point.pointId].remainingMinutes / 60)}h ${Math.round(sessionTimers[point.pointId].remainingMinutes % 60)}m`
                                    )}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#8c8c8c" }}>
                                    Ends at {sessionTimers[point.pointId].endTime}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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

                        {/* Session Duration Info - only show for active sessions */}
                        {(point.status?.toLowerCase() === "in use" ||
                          point.status?.toLowerCase() === "in_use" ||
                          point.status?.toLowerCase() === "inuse") && activeSessions[point.pointId] && (
                            <>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Text type="secondary">
                                  <ClockCircleOutlined /> Duration:
                                </Text>
                                <Text strong>
                                  {activeSessions[point.pointId].duration || 'N/A'} min
                                </Text>
                              </div>

                              {sessionTimers[point.pointId] && (
                                <div style={{ width: "100%" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <Text type="secondary" style={{ fontSize: "12px" }}>
                                      Progress:
                                    </Text>
                                    <div style={{ textAlign: "right" }}>
                                      {sessionTimers[point.pointId].isExpired ? (
                                        <div>
                                          <Tag color="red" size="small" style={{ marginBottom: "2px" }}>
                                            <WarningOutlined style={{ marginRight: "4px" }} />
                                            EXPIRED
                                          </Tag>
                                          <div style={{ fontSize: "11px", color: "#ff4d4f" }}>
                                            Overrun: {Math.round(sessionTimers[point.pointId].overrunMinutes)}min
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1890ff" }}>
                                            {sessionTimers[point.pointId].remainingMinutes <= 5 && sessionTimers[point.pointId].remainingMinutes > 0 ? (
                                              `${Math.floor(sessionTimers[point.pointId].remainingSeconds / 60)}:${String(sessionTimers[point.pointId].remainingSeconds % 60).padStart(2, '0')}`
                                            ) : sessionTimers[point.pointId].remainingMinutes < 60 ? (
                                              `${Math.round(sessionTimers[point.pointId].remainingMinutes)}min`
                                            ) : (
                                              `${Math.floor(sessionTimers[point.pointId].remainingMinutes / 60)}h ${Math.round(sessionTimers[point.pointId].remainingMinutes % 60)}m`
                                            )}
                                          </div>
                                          <div style={{ fontSize: "11px", color: "#666" }}>
                                            remaining
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Progress
                                    percent={Math.round(sessionTimers[point.pointId].progress)}
                                    size="small"
                                    status={sessionTimers[point.pointId].isExpired ? "exception" : "active"}
                                    showInfo={false}
                                  />
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Text type="secondary" style={{ fontSize: "11px" }}>
                                      End time: {sessionTimers[point.pointId].endTime}
                                    </Text>
                                    {sessionTimers[point.pointId].isExpired && (
                                      <Tag color="red" size="small">AUTO-STOPPING</Tag>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
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
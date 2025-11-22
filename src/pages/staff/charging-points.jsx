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
  Modal,
  Select,
  Image,
  Divider,
} from "antd";
import {
  ThunderboltOutlined,
  ArrowLeftOutlined,
  ApiOutlined,
  DollarOutlined,
  FireOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RobotOutlined,
  WalletOutlined,
  QrcodeOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getStationChargingPoints, startSession, stopSession, getStationReservations, getStationActiveSessions } from "../../service/staff.api";
import { sessionManager } from "../../utils/SessionManager";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const ChargingPointsPage = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [activeSessions, setActiveSessions] = useState({}); // Store sessionId for each pointId
  const [sessionTimers, setSessionTimers] = useState({}); // Store session progress info
  const [_expiredSessions, setExpiredSessions] = useState([]); // Store sessions that are expired (for display only)
  const [manuallyExpiredSessions, setManuallyExpiredSessions] = useState({}); // Store expired sessions that need manual stop
  const navigate = useNavigate();
  const { stationId } = useParams();

  // Payment Modal States
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Duration Modal States
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(5); // Default 5 minutes
  const [selectedPoint, setSelectedPoint] = useState(null);

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

  // Generate VietQR code URL
  const generateVietQR = useCallback((amount) => {
    const bankId = 'MB';
    const accountNo = '0123456789';
    const template = 'compact2';
    const addInfo = encodeURIComponent(`EV Charging Payment - ${Date.now()}`);

    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${Math.round(amount)}&addInfo=${addInfo}`;

    setQrCodeUrl(qrUrl);
    return qrUrl;
  }, []);

  // Mock payment verification
  const verifyQRPayment = async () => {
    setPaymentLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const isVerified = true;

      if (isVerified) {
        setPaymentStatus('verified');
        message.success('Payment verified successfully!');
        return true;
      } else {
        setPaymentStatus('failed');
        message.error('Payment not found. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
      message.error('Failed to verify payment. Please try again.');
      return false;
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = async () => {
    setPaymentLoading(true);
    try {
      if (paymentMethod === 'qr') {
        const isVerified = await verifyQRPayment();
        if (!isVerified) {
          return;
        }
      } else if (paymentMethod === 'wallet') {
        // Simulate wallet payment
        await new Promise(resolve => setTimeout(resolve, 1500));
        message.success('Payment deducted from wallet successfully!');
      } else {
        // Simulate card payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        message.success('Card payment processed successfully!');
      }

      // Now complete the stop session
      console.log("Step 7: Payment completed, calling POST Staff/session/stop");
      const response = await stopSession(sessionData);
      console.log("Step 8: Session stop response:", JSON.stringify(response, null, 2));

      // Remove from active sessions
      const pointId = sessionData.pointId;
      setActiveSessions((prev) => {
        const updated = { ...prev };
        delete updated[pointId];
        return updated;
      });

      // Remove from manually expired sessions (if it was expired)
      setManuallyExpiredSessions((prev) => {
        const updated = { ...prev };
        delete updated[pointId];
        return updated;
      });

      // Clear session timers for this point
      setSessionTimers((prev) => {
        const updated = { ...prev };
        delete updated[pointId];
        return updated;
      });

      // Close modal and show success
      setPaymentModalVisible(false);
      setShowQrCode(false);
      setPaymentStatus('pending');
      message.success('Payment completed and session stopped successfully!');

      // Refresh charging points after a delay to allow staff to see the completion
      console.log("Step 9: Session stopped successfully - manual refresh needed or will auto-refresh in 5 seconds");
      setTimeout(() => {
        fetchChargingPoints();
      }, 5000); // Increased delay to 5 seconds so staff can see the completion
    } catch (error) {
      console.error('Payment/Stop session error:', error);
      message.error('Failed to complete transaction. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Check for expired sessions - only track for display, no auto-stop
  // Staff must manually press stop button to end expired sessions
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
        const plannedEndTime = new Date(startTime.getTime() + (session.duration * 60 * 1000));
        const currentTime = new Date();
        const remainingMinutes = (plannedEndTime - currentTime) / (1000 * 60);

        return remainingMinutes <= 0; // Session has expired
      });

      setExpiredSessions(expiredSessionsList || []);

      // Only log expired sessions - no auto-stop
      if (expiredSessionsList && expiredSessionsList.length > 0) {
        console.log(`Found ${expiredSessionsList.length} expired sessions (staff must stop manually):`, expiredSessionsList);
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
  }, [stationId]);

  // Calculate session progress and time remaining with seconds precision
  // Duration is now stored in minutes instead of hours
  const calculateSessionProgress = useCallback((session) => {
    if (!session.startTime || !session.duration) {
      console.log("calculateSessionProgress: Missing data", { startTime: session.startTime, duration: session.duration });
      return null;
    }

    const startTime = dayjs(session.startTime);
    // Use API endTime if available, otherwise calculate from duration
    const endTime = session.apiEndTime ? dayjs(session.apiEndTime) : startTime.add(session.duration, 'minutes');
    const now = dayjs();

    // Calculate total duration in seconds from actual start/end times
    const totalDurationSeconds = endTime.diff(startTime, 'second');
    let elapsedSeconds = now.diff(startTime, 'second');
    let remainingSeconds = endTime.diff(now, 'second');

    // Handle clock synchronization issues - if elapsed time is negative, 
    // it means frontend clock is behind backend clock
    if (elapsedSeconds < 0) {
      console.warn("Clock sync issue detected - frontend clock is behind backend. Adjusting calculation.");
      elapsedSeconds = 0; // Session hasn't started yet from frontend perspective
      remainingSeconds = totalDurationSeconds; // Full duration remaining
    }

    // Calculate progress with seconds precision for better accuracy
    const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalDurationSeconds) * 100));

    // Determine session status with clock sync consideration
    let sessionStatus;
    if (remainingSeconds <= 0) {
      sessionStatus = "EXPIRED";
    } else if (elapsedSeconds <= 0) {
      sessionStatus = "STARTING"; // Session hasn't started yet from frontend perspective
    } else {
      sessionStatus = "ACTIVE";
    }

    const result = {
      progress: progressPercent,
      remainingMinutes: Math.max(0, Math.ceil(remainingSeconds / 60)),
      remainingSeconds: Math.max(0, remainingSeconds),
      isExpired: remainingSeconds <= 0,
      sessionStatus: sessionStatus,
      endTime: endTime.format('HH:mm'),
      elapsedMinutes: Math.floor(elapsedSeconds / 60),
      overrunMinutes: remainingSeconds < 0 ? Math.ceil(Math.abs(remainingSeconds) / 60) : 0
    };

    // Debug logging for short durations
    if (session.duration <= 5) {
      console.log("calculateSessionProgress DEBUG for session:", session.sessionId, {
        sessionDuration: session.duration,
        usingApiEndTime: !!session.apiEndTime,
        startTime: startTime.format(),
        endTime: endTime.format(),
        now: now.format(),
        totalDurationSeconds,
        elapsedSeconds,
        remainingSeconds,
        progressPercent,
        sessionStatus: result.sessionStatus,
        // Add timezone debugging
        startTimeISO: startTime.toISOString(),
        endTimeISO: endTime.toISOString(),
        nowISO: now.toISOString(),
        timeDifference: `now is ${elapsedSeconds < 0 ? Math.abs(elapsedSeconds) + ' seconds before' : elapsedSeconds + ' seconds after'} start`,
        result
      });
    }

    return result;
  }, []);

  // Update session timers
  const updateSessionTimers = useCallback(() => {
    setSessionTimers(prev => {
      const updated = { ...prev };
      Object.keys(activeSessions).forEach(pointId => {
        const session = activeSessions[pointId];
        if (session && session.startTime && session.duration) {
          const progressData = calculateSessionProgress({
            startTime: session.startTime,
            duration: session.duration,
            sessionId: session.sessionId,
            apiEndTime: session.apiEndTime
          });

          updated[pointId] = progressData;

          // Check if session just expired and store it for manual stop
          if (progressData && progressData.isExpired && !manuallyExpiredSessions[pointId]) {
            setManuallyExpiredSessions(prevExpired => ({
              ...prevExpired,
              [pointId]: {
                ...session,
                expiredAt: new Date().toISOString(),
                progress: progressData
              }
            }));
            console.log(`Session ${session.sessionId} for point ${pointId} has expired and requires manual stop`);
          }
        }
      });
      return updated;
    });
  }, [activeSessions, calculateSessionProgress, manuallyExpiredSessions]);

  useEffect(() => {
    if (stationId) {
      fetchChargingPoints();
    }
  }, [stationId, fetchChargingPoints]);

  // Set up simplified session monitoring for expiry detection
  useEffect(() => {
    if (stationId) {
      // Check for expired sessions using active sessions API + client-side logic every 30 seconds
      const expiredSessionChecker = setInterval(() => {
        checkForExpiredSessions();
      }, 30000);

      // Update session timers every 2 seconds for responsive countdown (especially for short durations)
      const timerUpdater = setInterval(() => {
        updateSessionTimers();
      }, 2000);

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
            // Session was manually stopped by staff
            console.log(`Session ${sessionId} was manually stopped for point ${pointId}`);
            setActiveSessions(prev => {
              const updated = { ...prev };
              delete updated[pointId];
              return updated;
            });
          },
          () => {
            // Refresh callback - avoid automatic refresh for expired sessions
            // Let expired sessions remain visible for manual stop
            console.log("Session state changed - manual refresh available if needed");
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
    // Show duration selection modal for reserved points
    setSelectedPoint(point);
    setDurationModalVisible(true);
  };

  const handleStartSessionWithDuration = async (point, durationMinutes) => {
    console.log("=== START SESSION WITH DURATION ===");
    console.log("Point object received:", point);
    console.log("Selected duration:", durationMinutes, "minutes");

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

      console.log("Step 5: Using staff-selected duration:", durationMinutes, "minutes");

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
      console.log("Step 5a: Session duration set to", durationMinutes, "minutes (manual stop required when expired)");
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

        // Use actual start and end times from API response instead of calculating our own
        const apiStartTime = response?.session?.startTime || response?.startTime;
        const apiEndTime = response?.session?.endTime || response?.endTime;

        console.log("Step 7e: API times - Start:", apiStartTime, "End:", apiEndTime);

        const sessionInfo = {
          sessionId: sessionId,
          pointId: point.pointId,
          paymentMethod: sessionData.paymentMethod,
          duration: actualDuration, // Use actual duration from session data
          startTime: apiStartTime || new Date().toISOString(), // Use API start time or fallback
          endTime: apiEndTime || new Date(Date.now() + (actualDuration * 60 * 1000)).toISOString(), // Use API end time or fallback
          vehicleType: matchingReservation.vehicleType,
          licensePlate: matchingReservation.licensePlate,
          maxPower: point.maxPower || 25, // For energy calculation
          userId: matchingReservation.userId,
          // Add API endTime for more accurate progress calculation
          apiEndTime: apiEndTime
        };

        setActiveSessions((prev) => ({
          ...prev,
          [point.pointId]: sessionInfo
        }));

        console.log("Step 7f: Session stored successfully with session data:", sessionInfo);
        console.log("Step 7g: Session will expire at:", sessionInfo.endTime);
        console.log("Step 7h: Debug - Duration check:", {
          actualDuration: actualDuration,
          sessionInfoDuration: sessionInfo.duration,
          startTime: sessionInfo.startTime,
          endTime: sessionInfo.endTime,
          durationFromTimes: new Date(sessionInfo.endTime) - new Date(sessionInfo.startTime),
          durationInMinutes: (new Date(sessionInfo.endTime) - new Date(sessionInfo.startTime)) / (1000 * 60)
        });

        // Show session start confirmation message
        message.success({
          content: `Session started! Duration: ${actualDuration} minutes. Manual stop required when expired.`,
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
      // First, try to get sessionId from our stored active sessions or expired sessions
      let sessionId = null;
      let paymentMethod = "e-wallet";

      if (activeSessions[pointId] && activeSessions[pointId].sessionId) {
        sessionId = activeSessions[pointId].sessionId;
        paymentMethod = activeSessions[pointId].paymentMethod || "e-wallet";
        console.log("Step 1: Using stored sessionId from active sessions:", sessionId);
      } else if (manuallyExpiredSessions[pointId] && manuallyExpiredSessions[pointId].sessionId) {
        sessionId = manuallyExpiredSessions[pointId].sessionId;
        paymentMethod = manuallyExpiredSessions[pointId].paymentMethod || "e-wallet";
        console.log("Step 1: Using stored sessionId from expired sessions:", sessionId);
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

      // Calculate payment amount (mock calculation based on energy consumed)
      // In production, this should come from the backend
      const calculatedAmount = Math.random() * 50 + 10; // Mock: $10-$60

      // Show payment modal instead of immediately stopping
      setSessionData(stopData);
      setPaymentAmount(calculatedAmount);
      setPaymentMethod('wallet');
      setPaymentModalVisible(true);
      setActionLoading((prev) => ({ ...prev, [pointId]: null }));
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

                        {/* Countdown Timer for Active Sessions or Manually Expired Sessions */}
                        {((point.status?.toLowerCase() === "in use" ||
                          point.status?.toLowerCase() === "in_use" ||
                          point.status?.toLowerCase() === "inuse") ||
                          manuallyExpiredSessions[point.pointId]) &&
                          (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]) && (
                            <div style={{
                              marginTop: "12px",
                              padding: "8px 12px",
                              backgroundColor: (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.isExpired ? "#fff2f0" :
                                (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.sessionStatus === "STARTING" ? "#fff7e6" : "#f6ffed",
                              border: (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.isExpired ? "1px solid #ffccc7" :
                                (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.sessionStatus === "STARTING" ? "1px solid #ffd591" : "1px solid #b7eb8f",
                              borderRadius: "8px"
                            }}>
                              {(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.isExpired ? (
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
                                    Overrun: {Math.round((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.overrunMinutes || 0)} minutes
                                  </div>
                                </div>
                              ) : (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.sessionStatus === "STARTING" ? (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "12px", color: "#fa8c16", marginBottom: "2px" }}>
                                    <ClockCircleOutlined /> SESSION STARTING
                                  </div>
                                  <div style={{
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    color: "#fa8c16"
                                  }}>
                                    Please wait...
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#8c8c8c" }}>
                                    Synchronizing with server
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
                                    color: (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes <= 15 ? "#faad14" :
                                      (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes <= 5 ? "#ff4d4f" : "#52c41a"
                                  }}>
                                    {(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes <= 5 && (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes > 0 ? (
                                      // Show seconds when less than 5 minutes remaining
                                      `${Math.floor((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingSeconds / 60)}:${String((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingSeconds % 60).padStart(2, '0')}`
                                    ) : (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes < 60 ? (
                                      // Show minutes only when less than 1 hour
                                      `${Math.round((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes)} min`
                                    ) : (
                                      // Show hours and minutes when more than 1 hour
                                      `${Math.floor((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes / 60)}h ${Math.round((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes % 60)}m`
                                    )}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#8c8c8c" }}>
                                    Ends at {(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.endTime}
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

                        {/* Session Duration Info - show for active sessions or manually expired sessions */}
                        {((point.status?.toLowerCase() === "in use" ||
                          point.status?.toLowerCase() === "in_use" ||
                          point.status?.toLowerCase() === "inuse") ||
                          manuallyExpiredSessions[point.pointId]) &&
                          (activeSessions[point.pointId] || manuallyExpiredSessions[point.pointId]) && (
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
                                  {(activeSessions[point.pointId] || manuallyExpiredSessions[point.pointId])?.duration || 'N/A'} min
                                </Text>
                              </div>

                              {(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress) && (
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
                                      {(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.isExpired ? (
                                        <div>
                                          <Tag color="red" size="small" style={{ marginBottom: "2px" }}>
                                            <WarningOutlined style={{ marginRight: "4px" }} />
                                            EXPIRED
                                          </Tag>
                                          <div style={{ fontSize: "11px", color: "#ff4d4f" }}>
                                            Overrun: {Math.round((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.overrunMinutes || 0)}min
                                          </div>
                                        </div>
                                      ) : (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.sessionStatus === "STARTING" ? (
                                        <div>
                                          <Tag color="orange" size="small" style={{ marginBottom: "2px" }}>
                                            <ClockCircleOutlined style={{ marginRight: "4px" }} />
                                            STARTING
                                          </Tag>
                                          <div style={{ fontSize: "11px", color: "#fa8c16" }}>
                                            Synchronizing...
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1890ff" }}>
                                            {(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes <= 5 && (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes > 0 ? (
                                              `${Math.floor((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingSeconds / 60)}:${String((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingSeconds % 60).padStart(2, '0')}`
                                            ) : (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes < 60 ? (
                                              `${Math.round((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes)}min`
                                            ) : (
                                              `${Math.floor((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes / 60)}h ${Math.round((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.remainingMinutes % 60)}m`
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
                                    percent={Math.round((sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.progress || 0)}
                                    size="small"
                                    status={(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.isExpired ? "exception" :
                                      (sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.sessionStatus === "STARTING" ? "active" : "active"}
                                    showInfo={false}
                                    strokeColor={(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.sessionStatus === "STARTING" ? "#fa8c16" : undefined}
                                  />
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Text type="secondary" style={{ fontSize: "11px" }}>
                                      End time: {(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.endTime}
                                    </Text>
                                    {(sessionTimers[point.pointId] || manuallyExpiredSessions[point.pointId]?.progress)?.isExpired && (
                                      <Tag color="red" size="small">EXPIRED - STOP REQUIRED</Tag>
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
                              point.status?.toLowerCase() === "inuse" ||
                              manuallyExpiredSessions[point.pointId] // Enable stop for expired sessions
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

        {/* Payment Modal */}
        <Modal
          title={
            <div style={{ textAlign: 'center' }}>
              <DollarOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Payment Required</span>
            </div>
          }
          visible={paymentModalVisible}
          onCancel={() => {
            setPaymentModalVisible(false);
            setShowQrCode(false);
            setPaymentStatus('pending');
            setActionLoading({});
          }}
          footer={null}
          width={600}
        >
          <div style={{ padding: '20px 0' }}>
            {/* Payment Amount */}
            <Card style={{ marginBottom: '20px', backgroundColor: '#f0f5ff', border: '2px solid #1890ff' }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '16px' }}>Amount to Pay</Text>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', margin: '10px 0' }}>
                  ${paymentAmount.toFixed(2)}
                </div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  ≈ {Math.round(paymentAmount * 24000).toLocaleString()} VND
                </Text>
              </div>
            </Card>

            <Divider>Select Payment Method</Divider>

            {/* Payment Method Selection */}
            <Select
              value={paymentMethod}
              onChange={(value) => {
                setPaymentMethod(value);
                setShowQrCode(false);
                setPaymentStatus('pending');
              }}
              style={{ width: '100%', marginBottom: '20px' }}
              size="large"
            >
              <Option value="wallet">
                <WalletOutlined style={{ marginRight: '8px' }} />
                Digital Wallet
              </Option>
              <Option value="qr">
                <QrcodeOutlined style={{ marginRight: '8px' }} />
                VietQR (Bank Transfer)
              </Option>
              <Option value="card">
                <CreditCardOutlined style={{ marginRight: '8px' }} />
                Credit/Debit Card
              </Option>
            </Select>

            {/* Payment Method Info */}
            {paymentMethod === 'wallet' && (
              <Alert
                message="Digital Wallet Payment"
                description="Payment will be deducted from the customer's digital wallet."
                type="info"
                showIcon
                icon={<WalletOutlined />}
                style={{ marginBottom: '20px' }}
              />
            )}

            {paymentMethod === 'qr' && (
              <div>
                <Alert
                  message="VietQR Payment"
                  description="Generate a QR code for the customer to scan and pay via banking app."
                  type="info"
                  showIcon
                  icon={<QrcodeOutlined />}
                  style={{ marginBottom: '20px' }}
                />

                {!showQrCode && (
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<QrcodeOutlined />}
                    onClick={() => {
                      generateVietQR(paymentAmount);
                      setShowQrCode(true);
                    }}
                    style={{ marginBottom: '20px' }}
                  >
                    Generate QR Code
                  </Button>
                )}

                {showQrCode && (
                  <Card
                    style={{
                      marginBottom: '20px',
                      textAlign: 'center',
                      border: '2px solid #1890ff'
                    }}
                  >
                    <Title level={4}>
                      <QrcodeOutlined style={{ marginRight: '8px' }} />
                      Scan to Pay
                    </Title>
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#fff',
                      display: 'inline-block',
                      borderRadius: '8px'
                    }}>
                      <Image
                        src={qrCodeUrl}
                        alt="VietQR Payment Code"
                        width={300}
                        style={{
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <Text strong style={{ fontSize: '16px' }}>
                        Amount: ${paymentAmount.toFixed(2)}
                      </Text>
                      <br />
                      <Text type="secondary">
                        Customer should scan this QR code with their banking app
                      </Text>
                    </div>

                    {paymentStatus === 'pending' && (
                      <Alert
                        message="Waiting for Payment"
                        description="Click 'Confirm Payment' after customer completes the bank transfer."
                        type="warning"
                        showIcon
                        style={{ marginTop: '16px', textAlign: 'left' }}
                      />
                    )}

                    {paymentStatus === 'verified' && (
                      <Alert
                        message="Payment Verified!"
                        description="Payment has been confirmed. Completing transaction..."
                        type="success"
                        showIcon
                        style={{ marginTop: '16px', textAlign: 'left' }}
                      />
                    )}
                  </Card>
                )}
              </div>
            )}

            {paymentMethod === 'card' && (
              <Alert
                message="Credit/Debit Card Payment"
                description="Customer will pay using their credit or debit card."
                type="info"
                showIcon
                icon={<CreditCardOutlined />}
                style={{ marginBottom: '20px' }}
              />
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Space size="large">
                <Button
                  size="large"
                  onClick={() => {
                    setPaymentModalVisible(false);
                    setShowQrCode(false);
                    setPaymentStatus('pending');
                    setActionLoading({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={paymentMethod === 'qr' && showQrCode ? <CheckCircleOutlined /> : <DollarOutlined />}
                  onClick={handlePaymentComplete}
                  loading={paymentLoading}
                  disabled={paymentMethod === 'qr' && !showQrCode}
                >
                  {paymentMethod === 'qr' && showQrCode ? 'Confirm Payment & Stop Session' : 'Process Payment & Stop Session'}
                </Button>
              </Space>
            </div>
          </div>
        </Modal>

        {/* Duration Selection Modal */}
        <Modal
          title={
            <div>
              <ClockCircleOutlined style={{ marginRight: '8px' }} />
              Select Session Duration
            </div>
          }
          open={durationModalVisible}
          onCancel={() => {
            setDurationModalVisible(false);
            setSelectedPoint(null);
            setSelectedDuration(5); // Reset to default
          }}
          footer={null}
          width={400}
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Charging Point: </Text>
              <Text>{selectedPoint?.name || 'N/A'}</Text>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <Text strong>Select Duration (minutes): </Text>
              <Select
                value={selectedDuration}
                onChange={setSelectedDuration}
                style={{ width: '100%', marginTop: '8px' }}
                size="large"
              >
                <Option value={1}>1 minute</Option>
                <Option value={5}>5 minutes (Default)</Option>
                <Option value={10}>10 minutes</Option>
                <Option value={15}>15 minutes</Option>
                <Option value={30}>30 minutes</Option>
                <Option value={60}>1 hour</Option>
                <Option value={120}>2 hours</Option>
                <Option value={180}>3 hours</Option>
                <Option value={240}>4 hours</Option>
                <Option value={480}>8 hours</Option>
              </Select>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button
                  onClick={() => {
                    setDurationModalVisible(false);
                    setSelectedPoint(null);
                    setSelectedDuration(5);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    if (selectedPoint) {
                      handleStartSessionWithDuration(selectedPoint, selectedDuration);
                      setDurationModalVisible(false);
                      setSelectedPoint(null);
                      setSelectedDuration(5);
                    }
                  }}
                  style={{
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a",
                  }}
                >
                  Start Session ({selectedDuration} min)
                </Button>
              </Space>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ChargingPointsPage;
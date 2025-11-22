import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Spin, Typography, message, Row, Col, InputNumber, Button, Statistic, Tag, Space } from 'antd';
import { getUserSessions } from '../../service/user.api';
import { getSessionById } from '../../service/staff.api';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';

const { Title, Text } = Typography;

const ChargingHistoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const currentAccount = useSelector((state) => state.account);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const resp = await getUserSessions();
      // Try common locations for the array of sessions
      let data = resp?.data ?? resp;
      if (data && data.data) data = data.data;
      if (data && data.result) data = data.result;
      const list = Array.isArray(data) ? data : (data?.items || data?.sessions || data?.rows || []);

      const mapped = list.map((s) => ({
        key: s.id || s.sessionId || JSON.stringify(s),
        id: s.id || s.sessionId || s.sessionId || '',
        station: s.stationName || s.station?.name || s.stationId || s.station || 'N/A',
        point: s.pointId || s.point?.id || (s.point && s.point.name) || 'N/A',
        startTime: s.startTime || s.startedAt || s.start || null,
        endTime: s.endTime || s.endedAt || s.end || null,
        status: (s.status || s.state || 'unknown').toString(),
        energy: s.energyConsumed || s.energy || s.totalEnergy || s.kwh || 0,
        cost: s.totalPrice || s.cost || s.amount || 0,
        raw: s
      }));

      setSessions(mapped);
      // If backend returned no sessions, just show empty state and let user opt-in to fallback scanning
      if ((!mapped || mapped.length === 0)) {
        messageApi.info('No charging sessions were returned by the API. You can try a fallback scan if needed.');
      }
    } catch (err) {
      // If backend returns 404/405 or getUserSessions returned empty, treat as 'no data' instead of an error
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        console.debug('User sessions endpoint not available (status)', status);
        messageApi.info('Charging history is not available from the server.');
      } else {
        console.error('Failed to load user sessions', err);
        messageApi.error('Failed to load charging history');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Fallback scanning is expensive — run only when user clicks the button
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanFound, setScanFound] = useState(0);
  // Dev helper: example data to allow UI testing when backend has no sessions
  const exampleSessions = [
    {
      sessionId: 'S-1001',
      stationName: 'Central Mall Station',
      pointId: 'P-1',
      startTime: dayjs().subtract(2, 'day').toISOString(),
      endTime: dayjs().subtract(2, 'day').add(45, 'minute').toISOString(),
      status: 'completed',
      energy: 12.4,
      totalPrice: 6.20,
    },
    {
      sessionId: 'S-1002',
      stationName: 'Riverside Station',
      pointId: 'P-4',
      startTime: dayjs().subtract(1, 'day').toISOString(),
      endTime: dayjs().subtract(1, 'day').add(30, 'minute').toISOString(),
      status: 'completed',
      energy: 8.1,
      totalPrice: 4.00,
    }
  ];

  const loadExampleData = () => {
    const mapped = exampleSessions.map(s => ({
      key: s.sessionId,
      id: s.sessionId,
      station: s.stationName,
      point: s.pointId,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      energy: s.energy,
      cost: s.totalPrice,
      raw: s
    }));
    setSessions(mapped);
    messageApi.info('Loaded example charging sessions (local only)');
  };

  const runFallbackScan = async ({ maxId = 200, batchSize = 10 } = {}) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanFound(0);
    const found = [];
    const userId = currentAccount?.user?.userId || currentAccount?.userId || currentAccount?.user?.id;
    try {
      if (!userId) throw new Error('Missing user id for fallback scan');
      for (let start = 1; start <= maxId; start += batchSize) {
        const ids = Array.from({ length: Math.min(batchSize, maxId - start + 1) }, (_, i) => start + i);
        // eslint-disable-next-line no-await-in-loop
        const results = await Promise.all(ids.map(id => getSessionById(id).catch(() => null)));
        for (const r of results) {
          if (r && (r.userId === userId || String(r.userId) === String(userId))) {
            found.push(r);
          }
        }
        const progress = Math.min(100, Math.floor((start / maxId) * 100));
        setScanProgress(progress);
        setScanFound(found.length);
        if (found.length >= 200) break; // safety cap
      }
      if (found.length > 0) {
        const mappedFound = found.map(s => ({
          key: s.sessionId || s.id || JSON.stringify(s),
          id: s.sessionId || s.id,
          station: s.stationName || s.stationId || s.station || 'N/A',
          point: s.pointId || (s.point && s.point.id) || 'N/A',
          startTime: s.startTime || s.startedAt || s.start || null,
          endTime: s.endTime || s.endedAt || s.end || null,
          status: s.status || s.state || 'unknown',
          energy: s.energyConsumed || s.energy || s.totalEnergy || 0,
          cost: s.cost || s.totalPrice || s.amount || 0,
          raw: s
        }));
        setSessions(mappedFound);
        messageApi.success(`Found ${mappedFound.length} sessions via fallback scan`);
      } else {
        messageApi.info('Fallback scan completed — no sessions found for your user.');
      }
    } catch (err) {
      console.error('Fallback scan failed', err);
      messageApi.error('Fallback scan failed. See console for details.');
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  // The page automatically loads sessions on mount via loadSessions()

  const totalSessions = sessions.length;
  const completedCount = sessions.filter(s => /completed/i.test(s.status)).length;
  const totalEnergy = sessions.reduce((sum, s) => sum + (Number(s.energy) || 0), 0);
  const totalRevenue = sessions.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

  const columns = [
    {
      title: 'Session ID',
      dataIndex: 'id',
      key: 'id',
      render: (val) => <Tag color="blue">#{val}</Tag>,
      width: 120,
    },
    {
      title: 'Point ID',
      dataIndex: 'point',
      key: 'point',
      render: (val) => <Tag color="magenta">Point {val}</Tag>,
      width: 140,
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val) => (val ? dayjs(val).format('DD/MM/YYYY\nHH:mm:ss') : 'N/A'),
      width: 160,
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (val) => (val ? dayjs(val).format('DD/MM/YYYY\nHH:mm:ss') : '—'),
      width: 160,
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => {
        if (!record.startTime || !record.endTime) return '—';
        const start = dayjs(record.startTime);
        const end = dayjs(record.endTime);
        const diff = end.diff(start, 'minute');
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours}h ${mins}m`;
      },
      width: 120,
    },
    {
      title: 'Energy (kWh)',
      dataIndex: 'energy',
      key: 'energy',
      render: (val) => (val !== null && val !== undefined ? `${Number(val).toLocaleString()} kWh` : '—'),
      width: 140,
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (val) => (val !== null && val !== undefined ? `$${Number(val).toFixed(2)}` : '—'),
      width: 120,
    },
  ];

  return (
    <div style={{ padding: 24, background: 'linear-gradient(180deg,#6b5bff 0%, #7b64d6 100%)', minHeight: '100vh' }}>
      {contextHolder}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Button onClick={() => navigate('/')} style={{ background: 'white' }}>← Back to Home</Button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>Charging History</Title>
            <Text type="secondary">Browse your charging sessions and see usage summary.</Text>
          </div>
          <div style={{ width: 120 }} />
        </div>



        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic title="Total Sessions" value={totalSessions} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="Total Energy (kWh)" value={totalEnergy.toFixed(2)} suffix="kWh" />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="Total Revenue" value={totalRevenue.toFixed(2)} prefix="$" />
            </Card>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 12 }}>
          <Button type="default" onClick={() => loadSessions()} icon={<FiRefreshCw />}>Reload</Button>
        </div>

        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={sessions}
              columns={columns}
              pagination={{ pageSize: 10 }}
              rowKey="key"
              locale={{ emptyText: 'No charging sessions found.' }}
              size="middle"
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChargingHistoryPage;

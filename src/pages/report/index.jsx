import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Typography, Space, Divider } from 'antd';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    fetchRevenueReport,
    fetchUsageReport,
    fetchPeakHoursReport,
    fetchSummaryReport,
} from '../../service/admin-report.api';
import {
    DollarCircleOutlined,
    ThunderboltOutlined,
    ClockCircleOutlined,
    BankOutlined,
} from '@ant-design/icons';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const { Title: PageTitle, Text } = Typography;

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportsData, setReportsData] = useState({
        revenue: null,
        usage: null,
        peakHours: null,
        summary: null,
    });

    useEffect(() => {
        fetchAllReports();
    }, []);

    const fetchAllReports = async () => {
        try {
            setLoading(true);
            setError(null);

            const [revenueData, usageData, peakHoursData, summaryData] = await Promise.all([
                fetchRevenueReport(),
                fetchUsageReport(),
                fetchPeakHoursReport(),
                fetchSummaryReport(),
            ]);

            // Debug: Log the received data
            console.log('Revenue Data:', revenueData);
            console.log('Usage Data:', usageData);
            console.log('Peak Hours Data:', peakHoursData);
            console.log('Summary Data:', summaryData);

            setReportsData({
                revenue: revenueData,
                usage: usageData,
                peakHours: peakHoursData,
                summary: summaryData,
            });
        } catch (err) {
            setError('Failed to fetch reports data. Please try again.');
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    // Chart configurations
    const commonChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    // Revenue chart data
    const revenueChartData = {
        labels: reportsData.revenue?.map(item => `Station ${item.stationId}`) || ['Station 1', 'Station 2'],
        datasets: [
            {
                label: 'Total Revenue ($)',
                data: reportsData.revenue?.map(item => parseFloat(item.totalRevenue)) || [14, 6],
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Usage chart data
    const usageChartData = {
        labels: reportsData.usage?.map(item => `Station ${item.stationId}`) || ['Station 1', 'Station 2'],
        datasets: [
            {
                label: 'Total Sessions',
                data: reportsData.usage?.map(item => parseInt(item.totalSessions)) || [1, 1],
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                yAxisID: 'y',
            },
            {
                label: 'Total Energy (kWh)',
                data: reportsData.usage?.map(item => parseFloat(item.totalEnergy)) || [40, 20],
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                yAxisID: 'y1',
            },
        ],
    };

    const usageChartOptions = {
        ...commonChartOptions,
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Sessions',
                },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Energy (kWh)',
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };

    // Peak hours chart data
    const peakHoursChartData = {
        labels: reportsData.peakHours?.map(item => `${item.hour}:00`) || ['10:00', '14:00'],
        datasets: [
            {
                label: 'Session Count',
                data: reportsData.peakHours?.map(item => parseInt(item.count)) || [1, 1],
                fill: false,
                borderColor: 'rgba(255, 206, 84, 1)',
                backgroundColor: 'rgba(255, 206, 84, 0.2)',
                tension: 0.1,
            },
        ],
    };

    // Sessions distribution pie chart
    const sessionsDistributionData = {
        labels: reportsData.revenue?.map(item => `Station ${item.stationId}`) || ['Station 1', 'Station 2'],
        datasets: [
            {
                label: 'Sessions Distribution',
                data: reportsData.revenue?.map(item => parseInt(item.totalSessions)) || [1, 1],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 84, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 84, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large">
                    <div style={{ padding: '50px', textAlign: 'center' }}>
                        Loading reports...
                    </div>
                </Spin>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px' }}>
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <button
                            onClick={fetchAllReports}
                            style={{
                                background: '#1890ff',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Retry
                        </button>
                    }
                />
            </div>
        );
    }

    // Debug: Log chart data
    console.log('Revenue Chart Data:', revenueChartData);
    console.log('Usage Chart Data:', usageChartData);
    console.log('Peak Hours Chart Data:', peakHoursChartData);
    console.log('Sessions Distribution Data:', sessionsDistributionData);

    return (
        <div style={{ padding: '20px' }}>
            <PageTitle level={2} style={{ marginBottom: '24px' }}>
                Admin Reports Dashboard
            </PageTitle>

            {/* Summary Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Stations"
                            value={reportsData.summary?.totalStations || 0}
                            prefix={<BankOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Charging Points"
                            value={reportsData.summary?.totalPoints || 0}
                            prefix={<ThunderboltOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Sessions"
                            value={reportsData.summary?.totalSessions || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Revenue"
                            value={reportsData.summary?.totalRevenue || 0}
                            prefix={<DollarCircleOutlined />}
                            precision={2}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts Section */}
            <Row gutter={[16, 16]}>
                {/* Revenue Chart */}
                <Col xs={24} lg={12}>
                    <Card title="Revenue by Station" style={{ height: '400px' }}>
                        <div style={{ height: '300px' }}>
                            <Bar data={revenueChartData} options={commonChartOptions} />
                        </div>
                    </Card>
                </Col>

                {/* Sessions Distribution Pie Chart */}
                <Col xs={24} lg={12}>
                    <Card title="Sessions Distribution" style={{ height: '400px' }}>
                        <div style={{ height: '300px' }}>
                            <Pie data={sessionsDistributionData} options={commonChartOptions} />
                        </div>
                    </Card>
                </Col>

                {/* Usage Chart */}
                <Col xs={24}>
                    <Card title="Usage Statistics by Station" style={{ height: '400px' }}>
                        <div style={{ height: '300px' }}>
                            <Bar data={usageChartData} options={usageChartOptions} />
                        </div>
                    </Card>
                </Col>

                {/* Peak Hours Chart */}
                <Col xs={24}>
                    <Card title="Peak Usage Hours" style={{ height: '400px' }}>
                        <div style={{ height: '300px' }}>
                            <Line data={peakHoursChartData} options={commonChartOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Data Summary Section */}
            <Divider />
            <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
                <Col xs={24} md={12}>
                    <Card title="Revenue Details" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {reportsData.revenue?.map((item, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Station {item.stationId}:</Text>
                                    <Text strong>${item.totalRevenue} ({item.totalSessions} sessions)</Text>
                                </div>
                            ))}
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Usage Details" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {reportsData.usage?.map((item, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Station {item.stationId}:</Text>
                                    <Text strong>{item.totalEnergy} kWh ({item.totalSessions} sessions)</Text>
                                </div>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Reports;

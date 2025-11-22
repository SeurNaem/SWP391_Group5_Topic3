import React, { useState, useEffect } from "react";
import { Button, Table, Tag, Rate, Card, Space, Popconfirm, message } from "antd";
import { ReloadOutlined, PoweroffOutlined, CheckCircleOutlined } from "@ant-design/icons";
import api from "../../config/axios";

const ManageChargingStation = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchStations = async () => {
        setLoading(true);
        try {
            const response = await api.get("admin/stations");
            setStations(response.data);
        } catch (error) {
            console.error("Error fetching stations:", error);
            message.error("Failed to fetch stations");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (stationId, currentStatus) => {
        try {
            const newStatus = currentStatus === "online" ? "offline" : "online";
            await api.put(`admin/stations/${stationId}/status`, { status: newStatus });
            message.success(`Station ${newStatus === "online" ? "activated" : "deactivated"} successfully`);
            fetchStations(); // Refresh the list
        } catch (error) {
            console.error("Error updating station status:", error);
            message.error("Failed to update station status");
        }
    };

    const handleChargingPointStatusToggle = async (pointId, stationId, currentStatus) => {
        try {
            // Cycle through status: available → reserved → offline → available
            let newStatus;
            if (currentStatus === "available") {
                newStatus = "reserved";
            } else if (currentStatus === "reserved") {
                newStatus = "offline";
            } else if (currentStatus === "offline") {
                newStatus = "available";
            } else {
                newStatus = "available"; // Default fallback for any unknown status
            }

            await api.post(`admin/stations/points/${pointId}/toggle`, {
                stationId: stationId,
                status: newStatus
            });
            message.success(`Charging point status changed to ${newStatus} successfully`);
            fetchStations(); // Refresh the list
        } catch (error) {
            console.error("Error changing charging point status:", error);
            message.error("Failed to change charging point status");
        }
    };

    useEffect(() => {
        fetchStations();
    }, []);

    const columns = [
        {
            title: "Station ID",
            dataIndex: "stationId",
            key: "stationId",
            width: 100,
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            width: 200,
        },
        {
            title: "Address",
            dataIndex: "address",
            key: "address",
            ellipsis: true,
            width: 250,
        },
        {
            title: "Coordinates",
            key: "coordinates",
            width: 150,
            render: (record) => `${record.latitude}, ${record.longitude}`,
        },
        {
            title: "Open Hours",
            dataIndex: "openHours",
            key: "openHours",
            width: 120,
        },
        {
            title: "Total Points",
            dataIndex: "totalPoints",
            key: "totalPoints",
            width: 100,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (status) => (
                <Tag color={status === "online" ? "green" : "red"}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Rating",
            dataIndex: "rating",
            key: "rating",
            width: 150,
            render: (rating) => (
                <div>
                    <Rate disabled value={rating} allowHalf />
                    <span style={{ marginLeft: 8 }}>{rating}/5</span>
                </div>
            ),
        },
        {
            title: "Charging Points",
            dataIndex: "chargingPoints",
            key: "chargingPoints",
            width: 200,
            render: (points) => (
                <div>
                    {points?.length > 0 && (
                        <div>
                            <div><strong>{points.length} points</strong></div>
                            {points.slice(0, 2).map((point, index) => (
                                <div key={index} style={{ fontSize: '12px', color: '#666' }}>
                                    {point.connectorType} - {point.maxPower}kW
                                    <Tag size="small" color={point.status === "available" ? "green" : point.status === "offline" ? "red" : "orange"}>
                                        {point.status}
                                    </Tag>
                                </div>
                            ))}
                            {points.length > 2 && <div style={{ fontSize: '12px', color: '#999' }}>+{points.length - 2} more</div>}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <Popconfirm
                        title={`${record.status === "online" ? "Deactivate" : "Activate"} Station`}
                        description={`Are you sure you want to ${record.status === "online" ? "deactivate" : "activate"} this station?`}
                        onConfirm={() => handleStatusToggle(record.stationId, record.status)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type={record.status === "online" ? "default" : "primary"}
                            icon={record.status === "online" ? <PoweroffOutlined /> : <CheckCircleOutlined />}
                            size="small"
                        >
                            {record.status === "online" ? "Deactivate" : "Activate"}
                        </Button>
                    </Popconfirm>
                    {record.chargingPoints?.map((point) => {
                        // Determine next status in cycle
                        const getNextStatus = (currentStatus) => {
                            if (currentStatus === "available") return "reserved";
                            if (currentStatus === "reserved") return "offline";
                            if (currentStatus === "offline") return "available";
                            return "available";
                        };

                        // Determine button type based on status
                        const getButtonType = (status) => {
                            if (status === "available") return "primary";
                            if (status === "reserved") return "default";
                            if (status === "offline") return "dashed";
                            return "default";
                        };

                        const nextStatus = getNextStatus(point.status);

                        return (
                            <Popconfirm
                                key={point.pointId}
                                title="Change Charging Point Status"
                                description={`Change status for Point ${point.pointId} (${point.connectorType}) from "${point.status}" to "${nextStatus}"?`}
                                onConfirm={() => handleChargingPointStatusToggle(point.pointId, record.stationId, point.status)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button
                                    size="small"
                                    type={getButtonType(point.status)}
                                >
                                    {point.connectorType} - {point.status.toUpperCase()}
                                </Button>
                            </Popconfirm>
                        );
                    })}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Charging Station Management</h2>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={fetchStations}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={stations}
                    rowKey="stationId"
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} stations`,
                    }}
                />
            </Card>
        </div>
    );
};

export default ManageChargingStation;

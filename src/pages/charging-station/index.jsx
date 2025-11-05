import React from "react";
import { Form, Input, InputNumber, Select, Rate } from "antd";
import ManageTemplate from "../../components/manage-template";

const ManageChargingStation = () => {
    const columns = [
        {
            title: "Station ID",
            dataIndex: "stationId",
            key: "stationId",
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Address",
            dataIndex: "address",
            key: "address",
            ellipsis: true,
        },
        {
            title: "Coordinates",
            key: "coordinates",
            render: (record) => `${record.latitude}, ${record.longitude}`,
        },
        {
            title: "Open Hours",
            dataIndex: "openHours",
            key: "openHours",
        },
        {
            title: "Total Points",
            dataIndex: "totalPoints",
            key: "totalPoints",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <span style={{
                    color: status === "online" ? "#52c41a" : "#ff4d4f",
                    fontWeight: "bold"
                }}>
                    {status.toUpperCase()}
                </span>
            ),
        },
        {
            title: "Rating",
            dataIndex: "rating",
            key: "rating",
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
            render: (points) => (
                <div>
                    {points?.length > 0 && (
                        <div>
                            <div><strong>{points.length} points</strong></div>
                            {points.slice(0, 2).map((point, index) => (
                                <div key={index} style={{ fontSize: '12px', color: '#666' }}>
                                    {point.connectorType} - {point.maxPower}kW
                                </div>
                            ))}
                            {points.length > 2 && <div style={{ fontSize: '12px', color: '#999' }}>+{points.length - 2} more</div>}
                        </div>
                    )}
                </div>
            ),
        },
    ];

    const formItems = (
        <>
            <Form.Item name="stationId" hidden>
                <Input />
            </Form.Item>

            <Form.Item
                label="Station Name"
                name="name"
                rules={[
                    {
                        required: true,
                        message: "Please input station name!",
                    },
                ]}
            >
                <Input placeholder="Enter station name" />
            </Form.Item>

            <Form.Item
                label="Address"
                name="address"
                rules={[
                    {
                        required: true,
                        message: "Please input address!",
                    },
                ]}
            >
                <Input.TextArea
                    placeholder="Enter full address"
                    rows={2}
                />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
                <Form.Item
                    label="Latitude"
                    name="latitude"
                    style={{ flex: 1 }}
                    rules={[
                        {
                            required: true,
                            message: "Please input latitude!",
                        },
                        {
                            type: "number",
                            min: -90,
                            max: 90,
                            message: "Latitude must be between -90 and 90!",
                        },
                    ]}
                >
                    <InputNumber
                        placeholder="10.78"
                        style={{ width: "100%" }}
                        step={0.000001}
                        precision={6}
                    />
                </Form.Item>

                <Form.Item
                    label="Longitude"
                    name="longitude"
                    style={{ flex: 1 }}
                    rules={[
                        {
                            required: true,
                            message: "Please input longitude!",
                        },
                        {
                            type: "number",
                            min: -180,
                            max: 180,
                            message: "Longitude must be between -180 and 180!",
                        },
                    ]}
                >
                    <InputNumber
                        placeholder="106.7"
                        style={{ width: "100%" }}
                        step={0.000001}
                        precision={6}
                    />
                </Form.Item>
            </div>

            <Form.Item
                label="Open Hours"
                name="openHours"
                rules={[
                    {
                        required: true,
                        message: "Please input open hours!",
                    },
                ]}
            >
                <Input placeholder="e.g., 24/7 or 06:00-22:00" />
            </Form.Item>

            <Form.Item
                label="Total Charging Points"
                name="totalPoints"
                rules={[
                    {
                        required: true,
                        message: "Please input total charging points!",
                    },
                    {
                        type: "number",
                        min: 1,
                        message: "Must have at least 1 charging point!",
                    },
                ]}
            >
                <InputNumber
                    placeholder="Enter number of charging points"
                    style={{ width: "100%" }}
                    min={1}
                    max={50}
                />
            </Form.Item>

            <Form.Item
                label="Status"
                name="status"
                rules={[
                    {
                        required: true,
                        message: "Please select status!",
                    },
                ]}
            >
                <Select placeholder="Select station status">
                    <Select.Option value="online">Online</Select.Option>
                    <Select.Option value="offline">Offline</Select.Option>
                    <Select.Option value="maintenance">Maintenance</Select.Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Image URL"
                name="imageUrl"
            >
                <Input placeholder="Enter image URL (optional)" />
            </Form.Item>

            <Form.Item
                label="Rating"
                name="rating"
                rules={[
                    {
                        type: "number",
                        min: 0,
                        max: 5,
                        message: "Rating must be between 0 and 5!",
                    },
                ]}
            >
                <InputNumber
                    placeholder="Enter rating (0-5)"
                    style={{ width: "100%" }}
                    min={0}
                    max={5}
                    step={0.1}
                    precision={1}
                />
            </Form.Item>
        </>
    );

    return (
        <div>
            <ManageTemplate
                columns={columns}
                apiURL="admin/stations"
                formItems={formItems}
            />
        </div>
    );
};

export default ManageChargingStation;

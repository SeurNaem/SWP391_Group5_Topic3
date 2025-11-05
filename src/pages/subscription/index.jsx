import React from "react";
import { Form, Input, InputNumber, Select } from "antd";
import ManageTemplate from "../../components/manage-template";

const ManageSubscription = () => {
    const columns = [
        {
            title: "Package ID",
            dataIndex: "packageId",
            key: "packageId",
        },
        {
            title: "Package Name",
            dataIndex: "packageName",
            key: "packageName",
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type) => (
                <span style={{
                    color: type === "VIP" ? "#1890ff" : "#52c41a",
                    fontWeight: "bold"
                }}>
                    {type}
                </span>
            ),
        },
        {
            title: "Price ($)",
            dataIndex: "price",
            key: "price",
            render: (price) => `$${price}`,
        },
        {
            title: "Duration (Months)",
            dataIndex: "durationMonths",
            key: "durationMonths",
            render: (months) => `${months} month${months > 1 ? 's' : ''}`,
        },
        {
            title: "Active Subscriptions",
            dataIndex: "userSubscriptions",
            key: "userSubscriptions",
            render: (subscriptions) => subscriptions?.length || 0,
        },
    ];

    const formItems = (
        <>
            <Form.Item name="packageId" hidden>
                <Input />
            </Form.Item>

            <Form.Item
                label="Package Name"
                name="packageName"
                rules={[
                    {
                        required: true,
                        message: "Please input package name!",
                    },
                ]}
            >
                <Input placeholder="Enter package name" />
            </Form.Item>

            <Form.Item
                label="Type"
                name="type"
                rules={[
                    {
                        required: true,
                        message: "Please select package type!",
                    },
                ]}
            >
                <Select placeholder="Select package type">
                    <Select.Option value="VIP">VIP</Select.Option>
                    <Select.Option value="Prepaid">Prepaid</Select.Option>
                    <Select.Option value="Standard">Standard</Select.Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Price ($)"
                name="price"
                rules={[
                    {
                        required: true,
                        message: "Please input price!",
                    },
                    {
                        type: "number",
                        min: 0,
                        message: "Price must be greater than 0!",
                    },
                ]}
            >
                <InputNumber
                    placeholder="Enter price"
                    style={{ width: "100%" }}
                    min={0}
                    step={0.01}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
            </Form.Item>

            <Form.Item
                label="Duration (Months)"
                name="durationMonths"
                rules={[
                    {
                        required: true,
                        message: "Please input duration!",
                    },
                    {
                        type: "number",
                        min: 1,
                        message: "Duration must be at least 1 month!",
                    },
                ]}
            >
                <InputNumber
                    placeholder="Enter duration in months"
                    style={{ width: "100%" }}
                    min={1}
                    max={12}
                />
            </Form.Item>
        </>
    );

    return (
        <div>
            <ManageTemplate
                columns={columns}
                apiURL="admin/subscriptions/packages"
                formItems={formItems}
                buttonText="Add Package"
            />
        </div>
    );
};

export default ManageSubscription;

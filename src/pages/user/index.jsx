import React, { useState } from "react";
import { Form, Input, Select, Button, Card, Space, Tag } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import ManageTemplate from "../../components/manage-template";
import dayjs from "dayjs";

const ManageUser = () => {
    const [searchFilters, setSearchFilters] = useState({
        role: "",
        status: ""
    });
    const [templateKey, setTemplateKey] = useState(0); // Force re-render

    const columns = [
        {
            title: "User ID",
            dataIndex: "userId",
            key: "userId",
            width: 80,
        },
        {
            title: "Full Name",
            dataIndex: "fullName",
            key: "fullName",
            width: 150,
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 200,
            ellipsis: true,
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
            width: 130,
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            width: 100,
            render: (role) => {
                let color = "default";
                switch (role) {
                    case "Admin":
                        color = "red";
                        break;
                    case "Staff":
                        color = "blue";
                        break;
                    case "Driver":
                        color = "green";
                        break;
                    default:
                        color = "default";
                }
                return <Tag color={color}>{role}</Tag>;
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (status) => (
                <Tag color={status === "Active" ? "green" : "red"}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Created At",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 120,
            render: (date) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: "Updated At",
            dataIndex: "updatedAt",
            key: "updatedAt",
            width: 120,
            render: (date) => dayjs(date).format("DD/MM/YYYY"),
        },
    ];

    const formItems = (
        <>
            <Form.Item name="userId" hidden>
                <Input />
            </Form.Item>

            <Form.Item
                label="Full Name"
                name="fullName"
                rules={[
                    {
                        required: true,
                        message: "Please input full name!",
                    },
                    {
                        min: 2,
                        message: "Full name must be at least 2 characters!",
                    },
                ]}
            >
                <Input placeholder="Enter full name" />
            </Form.Item>

            <Form.Item
                label="Email"
                name="email"
                rules={[
                    {
                        required: true,
                        message: "Please input email!",
                    },
                    {
                        type: "email",
                        message: "Please enter a valid email!",
                    },
                ]}
            >
                <Input placeholder="Enter email address" />
            </Form.Item>

            <Form.Item
                label="Phone"
                name="phone"
                rules={[
                    {
                        required: true,
                        message: "Please input phone number!",
                    },
                    {
                        pattern: /^[+]?[0-9\s\-()]+$/,
                        message: "Please enter a valid phone number!",
                    },
                ]}
            >
                <Input placeholder="Enter phone number" />
            </Form.Item>

            <Form.Item
                label="Role"
                name="role"
                rules={[
                    {
                        required: true,
                        message: "Please select role!",
                    },
                ]}
            >
                <Select placeholder="Select user role">
                    <Select.Option value="Driver">Driver</Select.Option>
                    <Select.Option value="Staff">Staff</Select.Option>
                    <Select.Option value="Admin">Admin</Select.Option>
                </Select>
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
                <Select placeholder="Select user status">
                    <Select.Option value="Active">Active</Select.Option>
                    <Select.Option value="Inactive">Inactive</Select.Option>
                    <Select.Option value="Suspended">Suspended</Select.Option>
                </Select>
            </Form.Item>
        </>
    );

    const handleSearch = () => {
        // Force re-render of ManageTemplate to trigger new API call with filters
        setTemplateKey(prev => prev + 1);
    };

    const handleReset = () => {
        setSearchFilters({ role: "", status: "" });
        setTemplateKey(prev => prev + 1);
    };

    const buildApiUrl = () => {
        let url = "admin/users";
        const params = new URLSearchParams();

        if (searchFilters.role) {
            params.append("role", searchFilters.role);
        }
        if (searchFilters.status) {
            params.append("status", searchFilters.status);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        return url;
    };

    return (
        <div>
            {/* Search Filters */}
            <Card style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                            Filter by Role:
                        </label>
                        <Select
                            placeholder="All Roles"
                            style={{ width: 150 }}
                            value={searchFilters.role || undefined}
                            onChange={(value) => setSearchFilters(prev => ({ ...prev, role: value || "" }))}
                            allowClear
                        >
                            <Select.Option value="Driver">Driver</Select.Option>
                            <Select.Option value="Staff">Staff</Select.Option>
                            <Select.Option value="Admin">Admin</Select.Option>
                        </Select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                            Filter by Status:
                        </label>
                        <Select
                            placeholder="All Statuses"
                            style={{ width: 150 }}
                            value={searchFilters.status || undefined}
                            onChange={(value) => setSearchFilters(prev => ({ ...prev, status: value || "" }))}
                            allowClear
                        >
                            <Select.Option value="Active">Active</Select.Option>
                            <Select.Option value="Inactive">Inactive</Select.Option>
                            <Select.Option value="Suspended">Suspended</Select.Option>
                        </Select>
                    </div>

                    <Space>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                        >
                            Search
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* User Management Table */}
            <ManageTemplate
                key={templateKey}
                columns={columns}
                apiURL={buildApiUrl()}
                formItems={formItems}
                buttonText="Add User"
            />
        </div>
    );
};

export default ManageUser;

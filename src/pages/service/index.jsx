import React, { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, Button, Tag, Tooltip, Image } from 'antd'
import ManageTemplate from '../../components/manage-template'
import { fetchServiceGroup } from '../../service/service-group.api';
import { fetchTypes } from '../../service/type.api';

const { TextArea } = Input;
const { Option } = Select;

function ServicePage() {
    const [serviceGroups, setServiceGroups] = useState([]);
    const [types, setTypes] = useState([]);
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        // Fetch service groups
        const fetch = async () => {
            const serviceGroups = await fetchServiceGroup();
            const types = await fetchTypes();
            setServiceGroups(serviceGroups.data);
            setTypes(types.data);
        };

        fetch();
    }, []);

    const handleImageUrlChange = (e) => {
        const url = e.target.value;
        setImageUrl(url);
    };

    const validateImageUrl = (url) => {
        if (!url) return Promise.reject('Please enter an image URL!');

        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlPattern.test(url)) {
            return Promise.reject('Please enter a valid URL!');
        }

        // Check if URL ends with common image extensions
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
        if (!imageExtensions.test(url)) {
            return Promise.reject('URL must point to an image file (jpg, jpeg, png, gif, webp, svg)!');
        }

        return Promise.resolve();
    };

    const formItems = (
        <>
            <Form.Item
                label="Service Name"
                name="name"
                rules={[
                    { required: true, message: 'Please input the service name!' },
                    { min: 2, message: 'Service name must be at least 2 characters long!' },
                    { max: 100, message: 'Service name cannot exceed 100 characters!' }
                ]}
            >
                <Input
                    placeholder="Enter service name (e.g., Fast Charging, Premium Parking)"
                    showCount
                    maxLength={100}
                />
            </Form.Item>

            <Form.Item
                label="Description"
                name="description"
                rules={[
                    { required: true, message: 'Please input the service description!' },
                    { min: 5, message: 'Description must be at least 5 characters long!' },
                    { max: 500, message: 'Description cannot exceed 500 characters!' }
                ]}
            >
                <TextArea
                    rows={4}
                    placeholder="Enter detailed service description..."
                    showCount
                    maxLength={500}
                />
            </Form.Item>

            <Form.Item
                label="Service Image"
                name="image"
                rules={[
                    { required: true, message: 'Please enter an image URL!' },
                    { validator: (_, value) => validateImageUrl(value) }
                ]}
            >
                <div>
                    <Input
                        placeholder="Paste image URL here (e.g., https://example.com/image.jpg)"
                        onChange={handleImageUrlChange}
                        style={{ marginBottom: 16 }}
                    />
                    {imageUrl && (
                        <div style={{
                            border: '1px dashed #d9d9d9',
                            borderRadius: '6px',
                            padding: '16px',
                            textAlign: 'center',
                            backgroundColor: '#fafafa'
                        }}>
                            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                                Image Preview:
                            </div>
                            <Image
                                width={200}
                                height={150}
                                src={imageUrl}
                                alt="Service preview"
                                style={{
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    border: '1px solid #d9d9d9'
                                }}
                                placeholder={
                                    <div style={{
                                        width: 200,
                                        height: 150,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#f0f0f0',
                                        borderRadius: '6px',
                                        color: '#999'
                                    }}>
                                        Loading...
                                    </div>
                                }
                                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN0MRGNvEAMRYkEjIxLBhCMGQT2lgRcQJOTh7pA+Qk6AScgE/gy5EjGQoSNDEgJYT0vftW/bur6z+nq6urn6fVOl1Vf/vqfe/0dJfASiuAwCAAA=="
                            />
                        </div>
                    )}
                </div>
            </Form.Item>

            <Form.Item
                label="Price"
                name="price"
                rules={[
                    { required: true, message: 'Please input the service price!' },
                    { type: 'number', min: 0, message: 'Price must be a positive number!' }
                ]}
            >
                <InputNumber
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    min={0}
                    max={999999}
                    step={0.01}
                    precision={2}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
            </Form.Item>

            <Form.Item
                label="Service Group"
                name="serviceGroupId"
                rules={[
                    { required: true, message: 'Please select a service group!' }
                ]}
            >
                <Select
                    placeholder="Select a service group"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    {Array.isArray(serviceGroups) && serviceGroups.map(group => (
                        <Option key={group.id} value={group.id}>
                            {group.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Duration (minutes)"
                name="duration"
                rules={[
                    { required: true, message: 'Please input the service duration!' },
                    { type: 'number', min: 1, message: 'Duration must be at least 1 minute!' }
                ]}
            >
                <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter duration in minutes"
                    min={1}
                    max={1440} // 24 hours max
                    addonAfter="minutes"
                />
            </Form.Item>

            <Form.Item
                label="Pet Type"
                name="typeId"
                rules={[
                    { required: true, message: 'Please select a service type!' }
                ]}
            >
                <Select
                    placeholder="Select a pet type"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    {types.map(type => (
                        <Option key={type.id} value={type.id}>
                            {type.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
        </>
    );

    const columns = [
        {
            title: "Image",
            dataIndex: "image",
            key: "image",
            width: 100,
            align: 'center',
            render: (image, record) => (
                <Image
                    width={60}
                    height={60}
                    src={image || '/placeholder-image.png'}
                    alt={record.name}
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                    placeholder={
                        <div style={{
                            width: 60,
                            height: 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '8px'
                        }}>
                            No Image
                        </div>
                    }
                />
            ),
        },
        {
            title: "Service Name",
            dataIndex: "name",
            key: "name",
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (name) => (
                <Tooltip placement="topLeft" title={name}>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                </Tooltip>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            width: 250,
            ellipsis: {
                showTitle: false,
            },
            render: (description) => (
                <Tooltip placement="topLeft" title={description}>
                    <span>{description}</span>
                </Tooltip>
            ),
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            width: 120,
            align: 'right',
            render: (price) => (
                <Tag color={price > 0 ? "green" : "red"} style={{ fontSize: '12px' }}>
                    ${price?.toFixed(2) || '0.00'}
                </Tag>
            ),
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: "Duration",
            dataIndex: "duration",
            key: "duration",
            width: 100,
            align: 'center',
            render: (duration) => (
                <Tag color="blue">
                    {duration} min{duration !== 1 ? 's' : ''}
                </Tag>
            ),
            sorter: (a, b) => a.duration - b.duration,
        },
        {
            title: "Pet Type",
            dataIndex: ["type", "name"],
            key: "type",
            width: 150,
            render: (_, record) => (
                <Tooltip title={record.type?.description}>
                    <Tag color="purple">
                        {record.type?.name || 'N/A'}
                    </Tag>
                </Tooltip>
            ),
            filters: [
                { text: 'Type 1', value: 1 },
                { text: 'Type 2', value: 2 },
                { text: 'Type 3', value: 3 },
            ],
            onFilter: (value, record) => record.type?.id === value,
        },
        {
            title: "Service Group",
            dataIndex: ["serviceGroup", "name"],
            key: "serviceGroup",
            width: 150,
            render: (_, record) => (
                <Tooltip title={record.serviceGroup?.description}>
                    <Tag color="orange">
                        {record.serviceGroup?.name || 'N/A'}
                    </Tag>
                </Tooltip>
            ),
            filters: serviceGroups.map(group => ({
                text: group.name,
                value: group.id,
            })),
            onFilter: (value, record) => record.serviceGroup?.id === value,
        },
        {
            title: "Status",
            dataIndex: "deleted",
            key: "status",
            width: 100,
            align: 'center',
            render: (deleted) => (
                <Tag color={deleted ? "red" : "green"}>
                    {deleted ? "Inactive" : "Active"}
                </Tag>
            ),
            filters: [
                { text: 'Active', value: false },
                { text: 'Inactive', value: true },
            ],
            onFilter: (value, record) => record.deleted === value,
        },
    ];

    return <ManageTemplate columns={columns} apiURL={"/service?type=1"} formItems={formItems} />;
}

export default ServicePage

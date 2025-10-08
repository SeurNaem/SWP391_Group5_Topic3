import React from "react";
import ManageTemplate from "../../components/manage-template";
import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
} from "antd";

function ManageVoucher() {
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      align: "right",
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      sorter: (a, b) => a.value - b.value,
      align: "right",
      render: (value) => `$${value.toFixed(2)}`, // Example: Render as currency
    },
    {
      title: "Available For",
      dataIndex: "availableFor",
      key: "availableFor",
      // Add filters if you have a known set of statuses
      filters: [
        { text: "Public", value: 0 },
        { text: "Admins", value: 1 },
        { text: "Members", value: 2 },
      ],
      onFilter: (value, record) => record.availableFor === value,
    },
    {
      title: "Starts At",
      dataIndex: "startAt",
      key: "startAt",
      render: (text) => new Date(text).toLocaleString(),
      sorter: (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    },
    {
      title: "Ends At",
      dataIndex: "endAt",
      key: "endAt",
      render: (text) => new Date(text).toLocaleString(),
      sorter: (a, b) =>
        new Date(a.endAt).getTime() - new Date(b.endAt).getTime(),
    },
    {
      title: "Created At",
      dataIndex: "createAt",
      key: "createAt",
      render: (text) => new Date(text).toLocaleDateString(), // Render date only
      sorter: (a, b) =>
        new Date(a.createAt).getTime() - new Date(b.createAt).getTime(),
      defaultSortOrder: "descend", // Example: sort by creation date by default
    },
  ];

  const apiURL = "store";

  const availabilityOptions = [
    { value: 0, label: "Public" },
    { value: 1, label: "Admins Only" },
    { value: 2, label: "Members" },
  ];

  const MyFormItems = () => (
    <>
      {/* Code Field */}
      <Form.Item label="Id" name="id" hidden>
        <Input />
      </Form.Item>
      <Form.Item
        label="Promo Code"
        name="code"
        rules={[{ required: true, message: "Please input the promo code!" }]}
      >
        <Input placeholder="e.g., SUMMER25" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          {/* Value Field */}
          <Form.Item
            label="Value"
            name="value"
            rules={[{ required: true, message: "Please enter a value!" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              prefix="$"
              placeholder="50.00"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* Available For Field */}
          <Form.Item
            label="Available For"
            name="availableFor"
            rules={[{ required: true, message: "Please select an audience!" }]}
          >
            <Select
              placeholder="Select who can use this"
              options={availabilityOptions}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          {/* Start At Field */}
          <Form.Item
            label="Start Date & Time"
            name="startAt"
            rules={[{ required: true, message: "Please select a start date!" }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          {/* End At Field with Custom Validation */}
          <Form.Item
            label="End Date & Time"
            name="endAt"
            dependencies={["startAt"]} // This makes the validation re-run when startAt changes
            rules={[
              { required: true, message: "Please select an end date!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !getFieldValue("startAt")) {
                    return Promise.resolve(); // Don't validate if start date isn't set
                  }
                  if (value.isAfter(getFieldValue("startAt"))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("End date must be after the start date!")
                  );
                },
              }),
            ]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      {/* Note: `id` and `createAt` are typically managed by the server.
        - `id` is usually hidden in an edit form.
        - `createAt` is rarely shown or is displayed as read-only info.
        They are omitted here for a clean user-facing form. */}
    </>
  );

  return (
    <ManageTemplate columns={columns} apiURL={apiURL} formItems={MyFormItems} />
  );
}

export default ManageVoucher;

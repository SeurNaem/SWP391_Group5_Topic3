import {
  Avatar,
  Badge,
  Button,
  Form,
  Image,
  Input,
  Switch,
  Tag,
  Tooltip,
  Upload,
} from "antd";
import React from "react";
import ManageTemplate from "../../components/manage-template";
import { UploadOutlined } from "@ant-design/icons";

function ManageStore() {
  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      align: "center",
      width: 100,
      render: (image, record) => (
        <Avatar
          shape="square"
          size={64}
          src={
            image ? (
              <Image
                src={image}
                alt={record.name}
                preview={{ mask: "Preview" }}
              />
            ) : undefined
          }
        >
          {/* Fallback if no image: show first two letters of the name */}
          {record.name.substring(0, 2).toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      // Use ellipsis for long descriptions or a custom render with a Tooltip
      render: (text) => (
        <Tooltip title={text}>
          <span>{text.length > 50 ? `${text.substring(0, 50)}...` : text}</span>
        </Tooltip>
      ),
      // A simpler alternative is to use Ant Design's built-in ellipsis
      // ellipsis: true,
    },
    {
      title: "Feedbacks",
      dataIndex: "feedbacks",
      key: "feedbacks",
      align: "center",
      sorter: (a, b) => a.feedbacks.length - b.feedbacks.length,
      render: (feedbacks) => <Badge count={feedbacks?.length || 0} showZero />,
    },
    {
      title: "Status",
      dataIndex: "deleted",
      key: "deleted",
      align: "center",
      render: (deleted) => (
        <Tag color={deleted ? "volcano" : "green"}>
          {deleted ? "Deleted" : "Active"}
        </Tag>
      ),
      // Add filters to easily find active or deleted items
      filters: [
        { text: "Active", value: false },
        { text: "Deleted", value: true },
      ],
      onFilter: (value, record) => record.deleted === value,
    },
  ];

  const apiURL = "store";

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const formItems = (
    <>
      <Form.Item label="Id" name="id" hidden>
        <Input />
      </Form.Item>
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Please enter a name!" }]}
      >
        <Input placeholder="e.g., Classic Leather Jacket" />
      </Form.Item>

      {/* Description Field */}
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: "Please provide a description!" }]}
      >
        <Input.TextArea rows={4} placeholder="Describe the item..." />
      </Form.Item>

      {/* Image Upload Field */}
      <Form.Item
        label="Image"
        name="image"
        // `valuePropName` and `getValueFromEvent` are needed to correctly handle file list state with antd Form
        valuePropName="fileList"
        getValueFromEvent={normFile}
        // This field is optional, so no `rules` are needed
      >
        <Upload
          action="/upload.do" // Replace with your actual upload endpoint
          listType="picture"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Click to Upload</Button>
        </Upload>
      </Form.Item>

      {/* Status (Deleted) Field - Represented as an "Active" switch */}
      <Form.Item
        name="deleted"
        label="Status"
        valuePropName="checked" // Use `checked` for the value of a Switch
        initialValue={false} // Default new items to not be deleted (i.e., active)
      >
        {/* Note: We are flipping the logic here for better UX.
          The switch is ON when `deleted` is `false` (Active).
          The form submission logic will need to handle this.
          A simpler way is to just name this `active` and transform it before sending to the API.
      */}
        <Switch checkedChildren="Active" unCheckedChildren="Deleted" />
      </Form.Item>
    </>
  );

  return (
    <ManageTemplate columns={columns} apiURL={apiURL} formItems={formItems} />
  );
}

export default ManageStore;

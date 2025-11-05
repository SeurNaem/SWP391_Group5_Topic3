import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { useForm } from "antd/es/form/Form";
import api from "../../config/axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ManageCategory = () => {
  // định nghĩa cái dữ liệu
  // => api
  // 1. tên biến
  // 2. setter
  const [categories, setCategories] = useState();
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // columns (hiển thị cột như nào)
  const colums = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "id",
      render: (id, record) => {
        // record: {name, description}
        return (
          <>
            <Button
              type="primary"
              onClick={() => {
                // 1. open modal
                setOpen(true);

                // 2. fill old data => form
                form.setFieldsValue(record);
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete category"
              onConfirm={async () => {
                // => cho phép delete
                await api.delete(`categories/${id}`);

                fetchCategories(); // cập nhật lại danh sách
                toast.success("Successfully remove category!");
              }}
            >
              <Button type="primary" danger>
                Delete
              </Button>
            </Popconfirm>
          </>
        );
      },
    },
  ];

  const fetchCategories = async () => {
    // gọi tới api và lấy dữ liệu categories
    console.log("fetching data from API...");

    // đợi BE trả về dữ liệu
    const response = await api.get("categories");

    console.log(response.data);
    setCategories(response.data);
  };

  const handleSubmitForm = async (values) => {
    const { id } = values;
    let response;

    if (id) {
      // => update
      response = await api.put(`categories/${id}`, values);
    } else {
      // => create new
      response = await api.post("categories", values);
    }

    console.log(response.data);
    setOpen(false);
    fetchCategories();
    form.resetFields();
    toast.success("Successfully create new category!");
  };

  // khi load trang lên => fetchCategories()
  useEffect(() => {
    // làm gì khi load trang lên
    fetchCategories();
  }, []);

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={() => setOpen(true)}>
          Add category
        </Button>
      </div>
      <Table columns={colums} dataSource={categories} />
      <Modal
        title="Create new category"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          labelCol={{
            span: 24,
          }}
          form={form}
          onFinish={handleSubmitForm}
        >
          <Form.Item label="Id" name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Name"
            name="name"
            rules={[
              {
                required: true,
                message: "Please input your name!",
              },
              {
                min: 3,
                message: "Name must be at least 3 characters long!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              {
                required: true,
                message: "Please provide a description!",
              },
              {
                max: 200,
                message: "Description cannot exceed 200 characters!",
              },
            ]}
          >
            <Input.TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ManageCategory;

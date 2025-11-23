import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { useForm } from "antd/es/form/Form";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../../config/axios";
import dayjs from "dayjs";

const ManageTemplate = ({ columns, apiURL, formItems, buttonText = "Add category", idField = "id", customUpdateHandler = null }) => {
  // định nghĩa cái dữ liệu
  // => api
  // 1. tên biến
  // 2. setter
  const [categories, setCategories] = useState();
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  const fetchCategories = useCallback(async () => {
    // gọi tới api và lấy dữ liệu categories
    console.log("fetching data from API...");

    // đợi BE trả về dữ liệu
    const response = await api.get(apiURL);

    console.log(response.data);
    setCategories(response.data);
  }, [apiURL]);

  const handleSubmitForm = async (values) => {
    const id = values[idField];
    let response;

    if (id) {
      // => update
      if (customUpdateHandler) {
        // Use custom update handler if provided (e.g., for special role update endpoint)
        response = await customUpdateHandler(id, values);
      } else {
        // Extract base URL without query parameters for proper PUT endpoint
        const baseURL = apiURL.split('?')[0];
        response = await api.put(`${baseURL}/${id}`, values);
      }
    } else {
      // => create new
      response = await api.post(apiURL, values);
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
  }, [fetchCategories]);

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={() => setOpen(true)}>
          {buttonText}
        </Button>
      </div>
      <Table
        columns={[
          ...columns,
          {
            title: "Action",
            dataIndex: idField,
            key: idField,
            render: (id, record) => {
              // record: {name, description}
              // Only show delete for non-user management (e.g., category)
              if (apiURL.includes('admin/users')) {
                // User management: remove delete button for admin
                return (
                  <Button
                    type="primary"
                    onClick={() => {
                      setOpen(true);
                      form.setFieldsValue({
                        ...record,
                        createAt: dayjs(record.createAt),
                        startAt: dayjs(record.startAt),
                        endAt: dayjs(record.endAt),
                      });
                    }}
                  >
                    Edit
                  </Button>
                );
              } else {
                // Other management: keep delete button
                return (
                  <>
                    <Button
                      type="primary"
                      onClick={() => {
                        setOpen(true);
                        form.setFieldsValue({
                          ...record,
                          createAt: dayjs(record.createAt),
                          startAt: dayjs(record.startAt),
                          endAt: dayjs(record.endAt),
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title="Delete category"
                      onConfirm={async () => {
                        const baseURL = apiURL.split('?')[0];
                        await api.delete(`${baseURL}/${id}`);
                        fetchCategories();
                        toast.success("Successfully remove category!");
                      }}
                    >
                      <Button type="primary" danger>
                        Delete
                      </Button>
                    </Popconfirm>
                  </>
                );
              }
            },
          },
        ]}
        dataSource={categories}
      />
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
          {formItems}
        </Form>
      </Modal>
    </>
  );
};

export default ManageTemplate;

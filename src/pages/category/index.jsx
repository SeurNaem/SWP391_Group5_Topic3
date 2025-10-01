import { Button, Form, Input, Modal, Popconfirm, Table, message } from 'antd'
import { useForm } from 'antd/es/form/Form';
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  clearError
} from '../../redux/slices/categorySlice';

const ManageCategory = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(state => state.categories);
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      key: 'id',
      render: (id, record) => {
        // record: entire row data
        return (
          <>
            <Button
              type='primary' onClick={() => {
                //1. open modal
                setOpen(true);
                //2. fill old data to form
                form.setFieldsValue(record);
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete category"
              onConfirm={async () => {
                await dispatch(deleteCategory(id));
                message.success("Successfully deleted category!");
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

  const handleSubmit = async (values) => {
    const { id } = values;

    try {
      if (id) {
        // Update existing category
        await dispatch(updateCategory({ id, ...values }));
        message.success("Successfully updated category!");
      } else {
        // Create new category
        await dispatch(createCategory(values));
        message.success("Successfully created new category!");
      }

      setOpen(false);
      form.resetFields();
    } catch {
      message.error("Operation failed. Please try again.");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
  };

  return (
    <>
      <Button type='primary' onClick={() => setOpen(true)}>Add Category</Button>
      <Table dataSource={categories} columns={columns} />
      <Modal
        title="Create new category"
        open={open}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item label='ID' name='id' hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Please input the category name!' },
              { min: 2, message: 'Name must be at least 2 characters long!' },
              { max: 50, message: 'Name must not exceed 50 characters!' },
              { pattern: /^[a-zA-ZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ0-9\s]+$/, message: 'Name can only contain Vietnamese/English letters, numbers, and spaces!' }
            ]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please input the description!' },
              { min: 10, message: 'Description must be at least 10 characters long!' },
              { max: 200, message: 'Description must not exceed 200 characters!' }
            ]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Enter category description"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
              Submit
            </Button>
            <Button onClick={handleCancel}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ManageCategory

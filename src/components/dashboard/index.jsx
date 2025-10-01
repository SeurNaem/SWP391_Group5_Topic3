import React, { useState } from 'react';
import {
  DesktopOutlined,
  PieChartOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Layout, Menu, theme, Button, Dropdown, Avatar, Space, Typography } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/accountSlice';
const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label: <Link to={key}>{label}</Link>,
  };
}
const items = [
  getItem('Home', '/home', <DesktopOutlined />),
  getItem('Manage Charging Stations', '/station', <PieChartOutlined />),
  getItem('Manage Category', '/category', <PieChartOutlined />),
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(state => state.account);
  const navigate = useNavigate();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    localStorage.removeItem('user');
    dispatch(logout());
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  // Dropdown menu items for logged-in user
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <DesktopOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const renderHeaderContent = () => {
    if (user) {
      // User is logged in - show avatar and dropdown
      return (
        <div style={{ float: 'right', marginRight: '24px' }}>
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['hover']}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <Text strong>{user.fullName || user.name || user.email}</Text>
            </Space>
          </Dropdown>
        </div>
      );
    } else {
      // User is not logged in - show login and register buttons
      return (
        <div style={{ float: 'right', marginRight: '24px' }}>
          <Space>
            <Button
              type="default"
              icon={<LoginOutlined />}
              onClick={handleLogin}
            >
              Login
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleRegister}
            >
              Register
            </Button>
          </Space>
        </div>
      );
    }
  };
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 16px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
            Management System
          </div>
          {renderHeaderContent()}
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} items={[{ title: 'User' }, { title: 'Bill' }]} />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};
export default Dashboard;
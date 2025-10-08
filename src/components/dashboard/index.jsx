import React, { useState } from "react";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined, // Added for dropdown menu
} from "@ant-design/icons";
import { Breadcrumb, Layout, Menu, theme, Avatar, Dropdown, Space } from "antd";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; // Import useSelector to get data from Redux
import { logout } from "../../redux/accountSlice";

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label: <Link to={key}>{label}</Link>,
  };
}

const items = [
  getItem("Manage Bike", "bike", <PieChartOutlined />),
  getItem("Manage Category", "category", <PieChartOutlined />),
  getItem("Manage Voucher", "voucher", <PieChartOutlined />),
  getItem("Manage Store", "store", <PieChartOutlined />),
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Get account data from Redux store
  const account = useSelector((state) => state.account);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Define items for the dropdown menu
  const itemsDropdown = [
    {
      key: "1",
      label: <Link to="/profile">Profile</Link>, // Example link
      icon: <UserOutlined />,
    },
    {
      key: "2",
      label: (
        <button
          onClick={() => {
            dispatch(logout());
            navigate("/");
          }}
        >
          Logout
        </button>
      ), // Example link
      icon: <LogoutOutlined />,
      danger: true, // Mark as a dangerous action
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={items}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: "0 24px", background: colorBgContainer }}>
          {/* Header Content: User Info Dropdown */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  {/* Use optional chaining and nullish coalescing for safety */}
                  <span>{account?.user?.name ?? "Guest"}</span>
                </Space>
              </a>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: "0 16px" }}>
          <Breadcrumb
            style={{ margin: "16px 0" }}
            items={[{ title: "User" }, { title: "Bill" }]}
          />
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
        <Footer style={{ textAlign: "center" }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;

import React, { useState, useEffect } from "react";
import {
  PieChartOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/accountSlice";
import { FiUser, FiLogOut, FiShoppingCart } from "react-icons/fi";
import { themeColors } from "../../utils/theme";
import blankAvatar from "../../assets/blank.png";
import { createPortal } from "react-dom";

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
  getItem("Manage Category", "category", <PieChartOutlined />),
  getItem("Manage Subscription", "subscription", <PieChartOutlined />),
  getItem("Manage Charging Station", "charging-station", <PieChartOutlined />),
];

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Get account data from Redux store
  const account = useSelector((state) => state.account);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = {
    name: account?.user?.fullName || account?.fullName || "Admin User",
    avatar: blankAvatar,
  };

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdown if clicking outside of it
      if (isDropdownOpen && !event.target.closest('.user-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // Toggle dropdown when avatar is clicked
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Styles matching home page
  const profileStyles = {
    userInfo: {
      position: 'relative',
      cursor: 'pointer'
    },
    userAvatar: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      cursor: 'pointer'
    },
    avatar: {
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '50%',
      border: `2px solid ${themeColors.primary}`,
      objectFit: 'cover'
    },
    dropdown: {
      position: 'absolute',
      top: 'calc(100% + 0.5rem)',
      right: '0',
      minWidth: '200px',
      maxWidth: '200px',
      backgroundColor: '#1F2937',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
      border: '1px solid #374151',
      padding: '8px 0',
      zIndex: 9999,
      display: 'block'
    },
    dropdownItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      fontSize: '14px',
      color: '#ffffff',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      width: '100%',
      textAlign: 'left',
      fontFamily: 'inherit'
    },
    separator: {
      height: '1px',
      backgroundColor: '#374151',
      margin: '8px 0'
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        collapsedWidth={80}
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
        <Header style={{ padding: "0 24px", background: colorBgContainer, position: 'relative' }}>
          {/* Header Content: Enhanced User Info Display */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              height: "100%",
              position: 'relative'
            }}
          >
            <div
              className="user-dropdown-container"
              style={{
                ...profileStyles.userInfo,
                position: 'relative',
                zIndex: 999
              }}
            >
              <div
                style={profileStyles.userAvatar}
                onClick={toggleDropdown}
              >
                <span style={{ fontWeight: '600', color: '#1F2937' }}>
                  {account?.user?.fullName || account?.fullName || "Admin User"}
                </span>
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  style={profileStyles.avatar}
                />
              </div>

              {isDropdownOpen && createPortal(
                <div
                  style={{
                    position: 'fixed',
                    top: '60px',
                    right: '24px',
                    width: '200px',
                    backgroundColor: '#1F2937',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #374151',
                    zIndex: 10000,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = themeColors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    My Profile
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = themeColors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    Dashboard Stats
                  </div>
                  <div style={{
                    height: '1px',
                    backgroundColor: '#374151',
                    margin: '8px 16px'
                  }}></div>
                  <div
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#F87171',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={handleLogout}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#DC2626';
                      e.target.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#F87171';
                    }}
                  >
                    Logout
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </Header>
        <Content style={{ margin: "0 16px" }}>
          <div
            style={{
              margin: "16px 0",
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;

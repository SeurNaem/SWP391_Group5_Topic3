import { Button, Result } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";

function ProtectedRoute({ role, children }) {
  console.log('=== PROTECTED ROUTE DEBUG ===');
  console.log('ProtectedRoute called with role:', role);
  console.log('Children:', children);

  // so sánh role của account đang đăng nhập và cái role mà page yêu cầu

  const account = useSelector((store) => store.account);
  const navigate = useNavigate();

  console.log('Account from Redux:', account);

  // Extract user role from nested structure
  const userRole = account?.user?.role || account?.role;

  // Enhanced debug logging
  console.log("=== ProtectedRoute Debug ===");
  console.log("Full Redux state account:", account);
  console.log("Account.user:", account?.user);
  console.log("Required role (exact):", role);
  console.log("Account role (direct):", account?.role);
  console.log("Account.user.role:", account?.user?.role);
  console.log("Extracted userRole:", userRole);
  console.log("Role comparison result:", userRole === role);
  console.log("User role type:", typeof userRole);
  console.log("Required role type:", typeof role);
  console.log("Are roles strictly equal?", userRole === role);
  console.log("Account truthy?", !!account);
  console.log("No role required?", !role);
  console.log("========================");

  // Check if user is logged in
  if (!account) {
    console.log("No account found - redirecting to login");
    return (
      <Result
        status="401"
        title="401"
        subTitle="Please log in to access this page."
        extra={
          <Button
            onClick={() => {
              navigate("/login");
            }}
            type="primary"
          >
            Go to Login
          </Button>
        }
      />
    );
  }

  // Case-sensitive role comparison using extracted role
  // If no specific role is required, just check if user is logged in
  if (!role || userRole === role) {
    console.log("Access granted - roles match exactly or no specific role required");
    // cho qua
    return children;
  } else {
    console.log("Access denied - role mismatch");
    // m ko có quyền truy cập
    return (
      <Result
        status="403"
        title="403"
        subTitle={`Sorry, you are not authorized to access this page. Your role: "${userRole}", Required: "${role}"`}
        extra={
          <Button
            onClick={() => {
              navigate("/");
            }}
            type="primary"
          >
            Back Home
          </Button>
        }
      />
    );
  }
}

export default ProtectedRoute;

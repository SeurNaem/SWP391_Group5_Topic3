// jsx
// phối hợp JS & HTML 1 cách dễ dàng

import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Dashboard from "./components/dashboard";
import { ToastContainer } from "react-toastify";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import EbikeHomePage from "./pages/home";
import ProtectedRoute from "./components/protected-route";
import MapPage from "./pages/map";
import PaymentPage from "./pages/payment";
import ManageSubscription from "./pages/subscription";
import ManageChargingStation from "./pages/charging-station";
import ManageUser from "./pages/user";
import Reports from "./pages/report";
import { useSelector } from "react-redux";

// Component to handle admin redirect on home page
function HomePage() {
  const account = useSelector((state) => state.account);

  // If user is logged in as admin, redirect to dashboard
  if (account?.user?.role === "Admin") {
    return <Navigate to="/dashboard/reports" replace />;
  }

  return <EbikeHomePage />;
}

// 1. Component
// là 1 cái function
// trả về 1 cái giao diện

function App() {
  const router = createBrowserRouter([
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute role={"Admin"}>
          <Dashboard />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard/reports" replace />,
        },
        {
          path: "reports",
          element: <Reports />, // Outlet
        },
        {
          path: "subscription",
          element: <ManageSubscription />, // Outlet
        },
        {
          path: "charging-station",
          element: <ManageChargingStation />, // Outlet
        },
        {
          path: "user",
          element: <ManageUser />, // Outlet
        },
      ],
    },
    {
      path: "/",
      element: <HomePage />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
    {
      path: "/map",
      element: <MapPage />,
    },
    {
      path: "/payment",
      element: <PaymentPage />,
    },
  ]);

  return (
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
}

export default App;

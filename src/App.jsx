// jsx
// phối hợp JS & HTML 1 cách dễ dàng

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Dashboard from "./components/dashboard";
import ManageBike from "./pages/bike";
import ManageCategory from "./pages/category";
import { ToastContainer } from "react-toastify";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import EbikeHomePage from "./pages/home";
import ProtectedRoute from "./components/protected-route";
import ManageVoucher from "./pages/voucher";
import ManageStore from "./pages/store";
import ServicePage from "./pages/service";
import MapPage from "./pages/map";
import PaymentPage from "./pages/payment";
<<<<<<< Updated upstream
=======
import ManageSubscription from "./pages/subscription";
import ManageChargingStation from "./pages/charging-station";
import ManageUser from "./pages/user";
import Reports from "./pages/report";
import StaffPage from "./pages/staff";
import ChargingPointsPage from "./pages/staff/charging-points";
import SessionHistoryPage from "./pages/staff/session-history";
import SessionDetailPage from "./pages/staff/session-detail";
import { useSelector } from "react-redux";

// Component to handle admin redirect on home page
function HomePage() {
  const account = useSelector((state) => state.account);

  // If user is logged in as admin, redirect to dashboard
  if (account?.user?.role === "Admin") {
    return <Navigate to="/dashboard/reports" replace />;
  }

  // If user is logged in as staff, redirect to staff page
  if (account?.user?.role === "Staff") {
    return <Navigate to="/staff" replace />;
  }

  return <EbikeHomePage />;
}
>>>>>>> Stashed changes

// 1. Component
// là 1 cái function
// trả về 1 cái giao diện

function App() {
  const router = createBrowserRouter([
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute role={"ADMIN"}>
          <Dashboard />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "bike",
          element: <ManageBike />, // Outlet
        },
        {
          path: "category",
          element: <ManageCategory />, // Outlet
        },
        {
          path: "voucher",
          element: <ManageVoucher />, // Outlet
        },
        {
          path: "store",
          element: <ManageStore />, // Outlet
        },
        {
          path: "service",
          element: <ServicePage />, // Outlet
        },
        {
          path: "map",
          element: <MapPage />, // Outlet
        },
      ],
    },
    {
      path: "/staff",
      element: (
        <ProtectedRoute role={"Staff"}>
          <StaffPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/staff/charging-points/:stationId",
      element: (
        <ProtectedRoute role={"Staff"}>
          <ChargingPointsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/staff/session-history/:stationId",
      element: (
        <ProtectedRoute role={"Staff"}>
          <SessionHistoryPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/staff/session-detail",
      element: (
        <ProtectedRoute role={"Staff"}>
          <SessionDetailPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/",
      element: <EbikeHomePage />,
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

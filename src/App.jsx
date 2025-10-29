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

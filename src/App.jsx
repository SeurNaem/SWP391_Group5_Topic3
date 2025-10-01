import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Dashboard from "./components/dashboard"
import ManageStation from "./pages/station"
import ManageCategory from "./pages/category"
import Login from "./pages/login"
import Register from "./pages/register"
import Home from "./pages/home"
import { ToastContainer } from "react-toastify";

function App() {

  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Login />
    },
    {
      path: "/register",
      element: <Register />
    },
    {
      path: "/",
      element: <Dashboard />,
      children: [
        {
          path: "",
          element: <Home />
        },
        {
          path: "home",
          element: <Home />
        },
        {
          path: "station",
          element: <ManageStation />
        },
        {
          path: "category",
          element: <ManageCategory />
        },
      ],
    },
  ]);

  return (
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
}

export default App

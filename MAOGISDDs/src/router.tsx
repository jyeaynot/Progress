import { createBrowserRouter } from "react-router-dom";
import FarmersPage from "./pages/FarmersPage";
import LoginPage from "./pages/LoginPage";
import LoginDebugPage from "./pages/LoginDebugPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  ...(import.meta.env.DEV
    ? [
        {
          path: "/login/debug",
          element: <LoginDebugPage />,
        },
      ]
    : []),
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <FarmersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/farmers",
    element: (
      <ProtectedRoute>
        <FarmersPage />
      </ProtectedRoute>
    ),
  },
]);

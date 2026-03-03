import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RiskSentimentIndex from "./pages/RiskSentimentIndex";
import ConflictEarlyWarning from "./pages/ConflictEarlyWarning";
import ImpactSimulator from "./pages/ImpactSimulator";
import RegionalInsights from "./pages/RegionalInsights";
import DataSources from "./pages/DataSources";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <RiskSentimentIndex />
          </ProtectedRoute>
        ),
      },
      {
        path: "conflict-warning",
        element: (
          <ProtectedRoute>
            <ConflictEarlyWarning />
          </ProtectedRoute>
        ),
      },
      {
        path: "impact-simulator",
        element: (
          <ProtectedRoute>
            <ImpactSimulator />
          </ProtectedRoute>
        ),
      },
      {
        path: "regional-insights",
        element: (
          <ProtectedRoute>
            <RegionalInsights />
          </ProtectedRoute>
        ),
      },
      {
        path: "data-sources",
        element: (
          <ProtectedRoute>
            <DataSources />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

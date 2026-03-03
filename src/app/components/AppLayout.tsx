import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

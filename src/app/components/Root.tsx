import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";

export default function Root() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

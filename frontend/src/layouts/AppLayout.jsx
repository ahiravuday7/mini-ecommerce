import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { booting } = useAuth();
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
        {booting ? <div>Checking session...</div> : <Outlet />}
      </main>
    </div>
  );
}

import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

function MainLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Navbar />

        <main style={{ padding: "20px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
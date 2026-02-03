// src/App.jsx
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { useUser } from "./hooks/useUser";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { user } = useUser();
  const { theme } = useTheme();

  // Haddii weli aan la helin user (ama loading state)
  if (!user) {
    return (
      <div className={theme === 'dark' ? 'dark bg-gray-900 min-h-screen' : 'min-h-screen'}>
        <Header />
        <Outlet />
      </div>
    );
  }

  // Layout for admin users
  if (user?.role === "admin") {
    return (
      <div className={`${theme === 'dark' ? 'dark bg-gray-900' : ''} flex min-h-screen`}>
        <Sidebar />
        <main className="flex-1 p-4 ml-0 md:ml-16 lg:ml-64 transition-all duration-300">
          <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  // Layout for regular users (user role)
  if (user?.role === "user") {
    return (
      <div className={`${theme === 'dark' ? 'dark bg-gray-900' : ''} flex min-h-screen`}>
        <Sidebar />
        <main className="flex-1 p-4 ml-0 md:ml-16 lg:ml-64 transition-all duration-300">
          <div className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  // Default layout (for other roles or empty)
  return (
    <div className={theme === 'dark' ? 'dark bg-gray-900 min-h-screen' : 'min-h-screen'}>
      <Outlet />
    </div>
  );
}
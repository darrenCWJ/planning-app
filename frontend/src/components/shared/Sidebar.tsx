import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 text-gray-100 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="text-lg font-bold tracking-tight">PlanApp</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        {user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-200 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full text-left text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

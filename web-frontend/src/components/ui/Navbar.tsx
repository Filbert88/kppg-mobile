import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  MessageCircle,
  Users,
  Menu,
  ChevronDown,
  List,
} from "lucide-react";
import { useAuth } from "@/context/authContext";
import { getUserIdFromToken } from "../chat/chatWindow";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export interface UserDetails {
  id: string;
  username: string;
  name: string;
  profilePic: string | null;
  workHistory: string;
  _count: {
    connectionsFrom: number;
    connectionsTo: number;
  };
}

function NavItem({ icon, label, href }: NavItemProps) {
  return (
    <Link
      to={href}
      className="flex flex-col items-center gap-0.5 text-sm text-gray-500 hover:text-gray-900"
    >
      <div className="relative">{icon}</div>
      <span className="text-[12px]">{label}</span>
    </Link>
  );
}

export default function Navbar() {
  const { token, clearAuth } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userId = token ? getUserIdFromToken(token) : null;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    if (userId) {
      const fetchUserDetails = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/user/${userId}`,
            {
              method: "GET",
            }
          );
          const data = await response.json();
          if (data.success) {
            setUserDetails(data.data);
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      };

      fetchUserDetails();
    }
  }, [userId]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    clearAuth();
    setDropdownOpen(false);
    navigate("/auth/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-[999] border-b bg-white">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-2 px-4">
        <Link to="/" className="mr-2">
          <svg
            className="h-8 w-8 text-[#0a66c2]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
          </svg>
        </Link>
        <button
          className="md:hidden ml-auto"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden md:flex flex-1 items-center justify-end gap-6">
          {token ? (
            <>
              <NavItem
                icon={<Home className="h-8 w-8" />}
                label="Home"
                href="/"
              />
              <NavItem
                icon={<Users className="h-8 w-8" />}
                label="My Network"
                href="/network"
              />
              <NavItem
                icon={<MessageCircle className="h-8 w-8" />}
                label="Messaging"
                href="/chat"
              />
              <NavItem
                icon={<List className="h-8 w-8" />}
                label="List Users"
                href="/list-users"
              />
              {userDetails && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    className="flex flex-col items-center"
                    onClick={toggleDropdown}
                    aria-expanded={dropdownOpen}
                  >
                    <img
                      src={userDetails.profilePic || "/profile-icon.jpg"}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex flex-row">
                      <span className="text-xs text-gray-500 hover:text-gray-900">
                        Me
                      </span>{" "}
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-4 w-64 bg-white border rounded-lg shadow-lg z-[999]">
                      <div className="border-b">
                        <div className="p-4 flex items-center gap-4">
                          <img
                            src={userDetails.profilePic || "/profile-icon.jpg"}
                            alt="Profile"
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h3 className="font-bold">{userDetails.name}</h3>
                            <p className="text-sm text-gray-500">
                              {userDetails.workHistory}
                            </p>
                          </div>
                        </div>
                        <div className="px-2 mb-2">
                          <button
                            onClick={() => {
                              navigate(`/profile/${userId}`);
                              setDropdownOpen(false);
                            }}
                            className="w-full text-center rounded-full font-semibold text-[#0A66C2] border-2 border-[#0A66C2] px-4 hover:bg-[#EBF4FD] hover:border-[#004182]"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                      <ul className="p-4 space-y-2">
                        <li>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left text-sm text-gray-700 hover:underline"
                          >
                            Sign Out
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <NavItem
                icon={<List className="h-8 w-8" />}
                label="List Users"
                href="/list-users"
              />
              <div className="flex gap-4">
                <Link
                  to="/auth/login"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                >
                  Register
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b drop-shadow-lg drop-shadow-black">
          <div className="flex flex-col p-4 space-y-4">
            {token ? (
              <>
                <NavItem
                  icon={<Home className="h-6 w-6" />}
                  label="Home"
                  href="/"
                />
                <NavItem
                  icon={<Users className="h-6 w-6" />}
                  label="My Network"
                  href="/network"
                />
                <NavItem
                  icon={<MessageCircle className="h-6 w-6" />}
                  label="Messaging"
                  href="/chat"
                />
                <NavItem
                  icon={<List className="h-6 w-6" />}
                  label="List Users"
                  href="/list-users"
                />
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                >
                  Register
                </Link>
                <Link
                  to="/list-users"
                  className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                >
                  List Users
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

import React, { createContext, useState, useContext, useEffect } from "react";
import Loading from "@/components/ui/loading";
// import { useNavigate } from "react-router-dom";
interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // const navigate = useNavigate();
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/get-token`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const result = await response.json();
        if (result.success && result.data?.token) {
          setTokenState(result.data.token);
        } else {
          // navigate("/auth/login");
          setTokenState(null);
        }
      } catch (error) {
        console.error("Failed to fetch token:", error);
        setTokenState(null);
        // navigate("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  const setToken = (token: string | null) => {
    setTokenState(token);
  };

  const clearAuth = async () => {
    try {
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/push/delete`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Failed to clear token from server:", error);
    }
    setTokenState(null);
  };

  if (loading) {
    return <Loading />;
  }
  
  return (
    <AuthContext.Provider value={{ token, setToken, clearAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

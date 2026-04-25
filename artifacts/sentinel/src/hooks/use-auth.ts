import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("sentinel_auth") === "true";
  });
  const [, setLocation] = useLocation();

  const login = () => {
    localStorage.setItem("sentinel_auth", "true");
    setIsAuthenticated(true);
    setLocation("/");
  };

  const logout = () => {
    localStorage.removeItem("sentinel_auth");
    setIsAuthenticated(false);
    setLocation("/login");
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem("sentinel_auth") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return { isAuthenticated, login, logout };
}

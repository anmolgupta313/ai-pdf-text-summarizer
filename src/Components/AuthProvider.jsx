"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); 

  useEffect(() => {
    fetch("/Api/Auth/Me")
      .then((r) => r.json())
      .then((data) => setUser(data.success ? data.user : null))
      .catch(() => setUser(null));
  }, []);

  async function login(email, password) {
    const res = await fetch("/Api/Auth/Login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) setUser(data.user);
    return data;
  }

  async function register(name, email, password) {
    const res = await fetch("/Api/Auth/Register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (data.success) setUser(data.user);
    return data;
  }

  async function logout() {
    await fetch("/Api/Auth/Logout", { method: "POST" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

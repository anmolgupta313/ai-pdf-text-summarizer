"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import AuthModal from "./AuthModal";

function Navbar() {
  const { user, logout, setBtnValue, btnValue } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (user === undefined) return null;

  return (
    <>
      <nav className=" dark:bg-black w-full flex justify-between items-center px-8 py-4">
        <span className="font-semibold text-lg">PDF Summarizer</span>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm opacity-70">Hi, {user.name}</span>
              <button
                onClick={() => {
                  logout();
                  return setBtnValue !== "url" && setBtnValue("url");
                }}
                className="submit-btn dark:text-black bg-white px-4 py-1.5 rounded-2xl cursor-pointer text-sm"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="submit-btn dark:text-black bg-white px-4 py-1.5 rounded-2xl cursor-pointer text-sm"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}

export default Navbar;

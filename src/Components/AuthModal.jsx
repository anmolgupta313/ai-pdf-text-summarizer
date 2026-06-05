import { useState } from "react";
import { useAuth } from "./AuthProvider";
import CloseIcon from "@mui/icons-material/Close";

function AuthModal({ onClose, setBtnValue }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result =
      mode === "login"
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);

    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Something went wrong");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="background-glass rounded-3xl p-8 w-full max-w-md relative">
        <CloseIcon
          onClick={() => {
            onClose;
            setBtnValue("url");
          }}
          className="absolute top-4 right-4 cursor-pointer"
          sx={{ fontSize: "1.2rem" }}
        />

        <h2 className="text-xl font-semibold mb-6 text-center">
          {mode === "login" ? "Sign in" : "Create account"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <input
              name="name"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
              className="url_input pl-3 w-full background"
            />
          )}

          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            className="url_input pl-3 w-full background"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className="url_input pl-3 w-full background"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="submit-btn bg-white dark:text-black p-2 rounded-2xl cursor-pointer w-full mt-2"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm mt-5">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="underline cursor-pointer"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthModal;

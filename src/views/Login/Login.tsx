"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent, ChangeEvent } from "react";
import { LoginNavbar } from "./LoginNavbar";
import { LoginFooter } from "./LoginFooter";
import { authAPI, saveToken } from "../../utils/api";

export function Login() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let response;
      if (isSignup) {
        // Signup
        response = await authAPI.signup(formData);
      } else {
        // Signin
        response = await authAPI.signin(formData.email, formData.password);
      }

      // Save token
      saveToken(response.data.token);

      // Redirect to hello page
      router.push("/hello");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <LoginNavbar />

      <div className="login-content">
        <div className="login-card">
          <h2>{isSignup ? "Create an account" : "Login"}</h2>
          <p className="login-subtitle">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button 
              type="button" 
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>

          {error && (
            <div style={{
              background: "rgba(255, 0, 0, 0.1)",
              color: "#ff6b6b",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="login-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="login-password">
              <input
                type="password"
                name="password"
                placeholder="Enter your Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span className="login-eye">
                <svg fill="#fff" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.92,11.6C19.9,6.91,16.1,4,12,4S4.1,6.91,2.08,11.6a1,1,0,0,0,0,.8C4.1,17.09,7.9,20,12,20s7.9-2.91,9.92-7.6A1,1,0,0,0,21.92,11.6ZM12,18c-3.17,0-6.17-2.29-7.9-6C5.83,8.29,8.83,6,12,6s6.17,2.29,7.9,6C18.17,15.71,15.17,18,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2,2,0,0,1,12,14Z"/>
                </svg>
              </span>
            </div>

            {isSignup && (
              <label className="login-terms">
                <input type="checkbox" required />
                <span>
                  I agree to the <a href="#">Terms &amp; Conditions</a>
                </span>
              </label>
            )}

            <button type="submit" className="login-primary" disabled={loading}>
              {loading ? "Processing..." : isSignup ? "Create account" : "Login"}
            </button>
          </form>

          <div className="login-divider">
            <span>Or register with</span>
          </div>

          <div className="login-social">
            <button type="button" className="login-social-btn">
              <svg width="26" height="27" viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M5.33039 13.0101C5.33039 12.165 5.47076 11.3547 5.72129 10.5947L1.33615 7.24609C0.481512 8.98134 0 10.9366 0 13.0101C0 15.0819 0.48092 17.036 1.33437 18.77L5.71714 15.4149C5.46898 14.6584 5.33039 13.8511 5.33039 13.0101Z" fill="#FBBC05"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M13.0294 5.32283C14.8654 5.32283 16.5238 5.9734 17.8267 7.03796L21.6172 3.25284C19.3074 1.24199 16.3461 0 13.0294 0C7.88023 0 3.45482 2.94471 1.33569 7.24733L5.72083 10.596C6.73123 7.52885 9.61142 5.32283 13.0294 5.32283Z" fill="#EB4335"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M13.0296 20.6989C9.61167 20.6989 6.73148 18.4929 5.72107 15.4258L1.33594 18.7738C3.45506 23.0771 7.88047 26.0218 13.0296 26.0218C16.2077 26.0218 19.2419 24.8933 21.5192 22.779L17.3567 19.561C16.1823 20.3009 14.7034 20.6989 13.0296 20.6989Z" fill="#34A853"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M25.4688 13.0102C25.4688 12.2414 25.3504 11.4134 25.1727 10.6445H13.0312V15.6716H20.02C19.6705 17.3856 18.7194 18.7033 17.3583 19.5609L21.5208 22.7788C23.9129 20.5586 25.4688 17.2513 25.4688 13.0102Z" fill="#4285F4"/>
              </svg>
              Google
            </button>
            <button type="button" className="login-social-btn">
              <svg width="23" height="28" viewBox="0 0 23 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.4675 4.32257C16.4421 3.17861 17.0991 1.5853 16.9193 0C15.5148 0.0541528 13.8157 0.908611 12.8087 2.05122C11.9044 3.06522 11.115 4.68543 11.3273 6.2396C12.8939 6.35737 14.493 5.46787 15.4675 4.32257ZM18.9806 14.3843C19.0198 18.4823 22.6843 19.8455 22.7249 19.8631C22.6951 19.9592 22.1396 21.8055 20.7946 23.7143C19.6308 25.3633 18.4237 27.0055 16.5219 27.0407C14.6538 27.0745 14.0523 25.9658 11.9152 25.9658C9.77955 25.9658 9.1118 27.0054 7.34377 27.0744C5.50815 27.1407 4.10913 25.2904 2.9372 23.6469C0.539265 20.2854 -1.2923 14.1475 1.16781 10.0049C2.38976 7.94848 4.57276 6.64426 6.94366 6.61177C8.74549 6.57792 10.4473 7.78843 11.5489 7.78843C12.6506 7.78843 14.7187 6.33308 16.8922 6.54699C17.8019 6.58354 20.3567 6.90293 21.9963 9.23281C21.8638 9.31268 18.9482 10.9592 18.9806 14.3843Z" fill="white"/>
              </svg>
              Apple
            </button>
          </div>
        </div>
      </div>

      <LoginFooter />
    </div>
  );
}

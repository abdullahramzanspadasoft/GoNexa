"use client";

import { useState } from "react";
import Link from "next/link";
// import { Logo } from "../icons/Logo";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="navbar-wrapper">
      <div className="navbar">
        <h1 className="navbar-logo">
          {/* <Logo /> */}

          <img
            src="/Asset 2-8.png"
            style={{ width: "145px" }}
            alt="GoNexa Logo"
          />
        </h1>

        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <Link
            className="navbar-mobile-login-button"
            href="/login?mode=login"
            onClick={() => setIsMenuOpen(false)}
          >
            Login
          </Link>
          <a href="#" onClick={() => setIsMenuOpen(false)}>Products</a>
          <a href="#" onClick={() => setIsMenuOpen(false)}>Pricing</a>
          <a href="#" onClick={() => setIsMenuOpen(false)}>Affiliate</a>
          <a href="#" onClick={() => setIsMenuOpen(false)}>Blogs</a>
          <a href="#" onClick={() => setIsMenuOpen(false)}>About us</a>
        </div>

        <Link
          className="navbar-button"
          href="/login?mode=login"
          onClick={() => setIsMenuOpen(false)}
        >
          Login
        </Link>

        <button className="navbar-menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  );
}

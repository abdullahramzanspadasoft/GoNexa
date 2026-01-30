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
          <a href="#">Products</a>
          <a href="#">Pricing</a>
          <a href="#">Blogs</a>
          <a href="#">About us</a>
          <a href="">Affiliate</a>
        </div>

        <Link
          className="navbar-button"
          href="/login"
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

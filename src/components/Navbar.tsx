import { useState } from "react";
import { Logo } from "../icons/Logo";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="navbar-wrapper">
      <div className="navbar">
        <h1 className="navbar-logo">
          <Logo />
        </h1>

        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <a href="#">Products</a>
          <a href="#">Pricing</a>
          <a href="#">Blogs</a>
          <a href="#">About us</a>
          <a href="">Affiliate</a>
        </div>

        <button className="navbar-button">Login</button>

        <button className="navbar-menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
// import { Logo } from "../icons/Logo";
import logo from ".././../public/Asset 2-8.png";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="navbar-wrapper">
      <div className="navbar">
        <h1 className="navbar-logo">
          {/* <Logo /> */}

          <img src={logo}
          style={{width:"145px"}}
          alt="GoNexa Logo" />        </h1>

        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <a href="#">Products</a>
          <a href="#">Pricing</a>
          <a href="#">Blogs</a>
          <a href="#">About us</a>
          <a href="">Affiliate</a>
        </div>

        <button
          className="navbar-button"
          type="button"
          onClick={() => {
            window.location.hash = "#/login";
            setIsMenuOpen(false);
          }}
        >
          Login
        </button>

        <button className="navbar-menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  );
}

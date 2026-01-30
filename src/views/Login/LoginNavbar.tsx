import Link from "next/link";

export function LoginNavbar() {
  return (
    <div className="login-navbar-wrapper">
      <div className="login-navbar">
        <Link href="/">
          <img src="/Asset 2-8.png" alt="GoNexa Logo" className="login-navbar-logo" />
        </Link>
      </div>
    </div>
  );
}

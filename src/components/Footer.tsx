export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2>GoNexa</h2>
          <p>© 2026 GoNexa by SwizStudio. Revamping the digital businesses.</p>
        </div>

        <div className="footer-column">
          <h4>Company</h4>
          <div className="footer-links">
            <a href="#">Home</a>
            <a href="#">About</a>
            <a href="#">Products</a>
            <a href="#">Pricing Plans</a>
            <a href="#">Careers</a>
            <a href="#">Contact Us</a>
          </div>
        </div>

        <div className="footer-column footer-contact">
          <h4>Reach us out</h4>
          <p>
            <strong>For General Queries</strong>
            <br />
            people@gonexa.io
          </p>
          <p>
            <strong>For Job Related Queries</strong>
            <br />
            careers@gonexa.io
          </p>
          <p>
            <strong>For Support</strong>
            <br />
            support@gonexa.io
          </p>
        </div>

        <div className="footer-column">
          <h4>Follow us</h4>
          <div className="footer-social">
            {["IG", "FB", "IN", "LN", "X", "YT", "TT", "WA"].map((label) => (
              <a key={label} href="#" aria-label={label}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

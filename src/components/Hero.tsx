export function Hero() {
  return (
    <section className="hero-section">
      <div className="glow-bg-1" />
      <div className="glow-bg-2" />

      <div className="hero-content">
        <h2 className="hero-title">
          The All-in-One solution for
          <br className="hero-break" />
          social media management
          <br className="hero-break" />
          & growth
        </h2>

        <p className="hero-description">
          GoNexa one dashboard to schedule, engage, automate, and grow across
          all your social platforms.
        </p>

        <div className="hero-form">
          <input
            type="email"
            placeholder="Enter your email"
            className="hero-input"
            style={{textAlign:'center',}}
          />
          <button className="hero-button">
            Get started for free
          </button>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="about-section">
      <style>{`
        .about-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .about-image img {
          max-width: 100%;
          height: auto;
        }

        .about-content {
          flex: 1;
        }

        @media (max-width: 768px) {
          .about-container {
            flex-direction: column;
            text-align: center;
          }
          
          .about-title {
            font-size: 1.8rem;
          }
        }
      `}</style>

      <div className="about-container">
        <div className="about-image">
          <img
            src="/Mask group.png"
            alt="Happy team members"
          />
        </div>

        <div className="about-content">
          <h2 className="about-title">Elevate Your Business <br /> with GoNexa</h2>

          <p className="about-description">
            GoNexa helps creators and businesses manage social media the smart way without switching between multiple apps. We bring scheduling, analytics, inbox, email marketing, and WhatsApp automation into one simple platform to make growth faster and easier. Our goal is to keep brands consistent, connected, and in control from one dashboard because success should feel smooth, not complicated.
          </p>

          <button className="about-button">Join GoNexa</button>
        </div>
      </div>
    </section>
  );
}

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
          border-radius: 16px;
        }

        .about-content {
          flex: 1;
        }

        @media (max-width: 768px) {
          .about-container {
            flex-direction: column;
            text-align: center;
            padding: 40px 16px;
            gap: 24px;
          }
          
          .about-image {
            width: 100%;
            max-width: 320px;
            margin: 0 auto;
          }

          .about-image img {
            border-radius: 20px;
            padding: 1px;
          }
          
          .about-title {
            font-size: 31px !important;
            line-height: 1.3 !important;
            margin-bottom: 16px !important;
            font-weight: 600 !important;
          }

          .about-description {
            font-size: 16px !important;
            line-height: 1.6 !important;
            margin-bottom: 24px !important;
            color: #666 !important;
            text-align: justify !important;
            text-justify: inter-word;
          }

          .about-button {
            width: 100% !important;
            max-width: 280px;
            padding: 14px 24px !important;
            font-size: 16px !important;
            margin: 0 auto;
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
          <h2 className="about-title">Elevate Your Business <br></br>with GoNexa</h2>

          <p className="about-description">
            GoNexa helps creators and businesses manage social media the smart way without switching between multiple apps. We bring scheduling, analytics, inbox, email marketing, and WhatsApp automation into one simple platform to make growth faster and easier. Our goal is to keep brands consistent, connected, and in control from one dashboard because success should feel smooth, not complicated.
          </p>

          <button className="about-button">Join GoNexa</button>
        </div>
      </div>
    </section>
  );
}

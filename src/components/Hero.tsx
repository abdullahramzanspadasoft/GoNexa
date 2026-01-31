"use client";

import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login?mode=signup");
  };

  return (
    <section className="hero-section">
      <style>{`
        @media (max-width: 640px) {
          .hero-section {
            padding: 40px 16px 60px !important;
          }
          .hero-content {
            max-width: 100% !important;
          }
          .hero-title {
            font-size: 24px !important;
            line-height: 1.3 !important;
            margin-bottom: 16px !important;
            width: 100% !important;
            margin-left: 0 !important;
            text-align: center !important;
          }
          .hero-description {
            font-size: 14px !important;
            margin-bottom: 24px !important;
            line-height: 1.5 !important;
            padding: 0 10px;
          }
          .hero-form {
            flex-direction: column !important;
            gap: 16px !important;
            width: 100%;
          }
            // xnsdksdskdsbdfds
          .hero-button {
            width: 100% !important;
            max-width: 320px;
            padding: 14px 24px !important;
            font-size: 16px !important;
          }
          .hero-input {
            width: 100% !important;
            max-width: 320px;
            padding: 14px 20px !important;
            font-size: 14px !important;
          }
        }
      `}</style>
      <div className="glow-bg-1" />
      <div className="glow-bg-2" />

      <div className="hero-content">
        <h2 className="hero-title">
          The All-in-One solution for
          <br />
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
          <button className="hero-button" onClick={handleGetStarted}>
            Get started for free
          </button>
       
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import data from "../data.json";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="pricing-section">
      <div className="pricing-container">
        <div className="pricing-header">
          <h2 className="pricing-title">GoNexa Pricing</h2>
          <p className="pricing-subtitle">
            Choose a Plan That Matches Your Goals, Delivers Real Value, and Lets You Upgrade Anytime.
          </p>
        </div>

        <div className="pricing-toggle">
          <button
            className={`pricing-toggle-btn ${!isYearly ? "active" : ""}`}
            onClick={() => setIsYearly(false)}
          >
            Pay monthly
          </button>
          <button
            className={`pricing-toggle-btn ${isYearly ? "active" : ""}`}
            onClick={() => setIsYearly(true)}
          >
            Pay yearly (2 months free)
          </button>
        </div>

        <div className="pricing-cards">
          {data.pricingPlans.map((plan, i) => (
            <div key={i} className="pricing-card">
              <div className="pricing-card-header-top">
                <h3 className="pricing-card-name">{plan.name}</h3>
              </div>

              <div className="pricing-card-content">
                <p className="pricing-card-price">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</p>

                <div className="pricing-card-features">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="pricing-feature">
                      {feature}
                    </div>
                  ))}
                </div>

                <button className="pricing-button">Buy Now</button>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-dots">
          <div className="pricing-dot active" />
          <div className="pricing-dot" />
          <div className="pricing-dot" />
          <div className="pricing-dot" />
        </div>
      </div>
    </section>
  );
}

import { useState, useRef, useEffect } from "react";
import data from "../data.json";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const cardsRef = useRef<HTMLDivElement>(null);
  
  // Duplicate cards for slider (6 cards total: 3 original + 3 duplicates)
  const allPlans = [...data.pricingPlans, ...data.pricingPlans];
  const totalCards = allPlans.length;
  const cardsPerView = 3;
  // Always show 3 dots for mobile responsive
  const totalDots = 3;

  const scrollToCard = (index: number) => {
    if (cardsRef.current) {
      const cardWidth = cardsRef.current.scrollWidth / totalCards;
      const scrollPosition = index * cardWidth * cardsPerView;
      cardsRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      setActiveDot(index);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (cardsRef.current) {
        const scrollLeft = cardsRef.current.scrollLeft;
        const cardWidth = cardsRef.current.scrollWidth / totalCards;
        const currentIndex = Math.round(scrollLeft / (cardWidth * cardsPerView));
        setActiveDot(Math.min(currentIndex, totalDots - 1));
      }
    };

    const cardsElement = cardsRef.current;
    if (cardsElement) {
      cardsElement.addEventListener('scroll', handleScroll);
      return () => cardsElement.removeEventListener('scroll', handleScroll);
    }
  }, [totalCards, totalDots]);

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
            Pay yearly (2&nbsp;months&nbsp;free)
          </button>
        </div>

        <div className="pricing-cards-wrapper">
          <div className="pricing-cards" ref={cardsRef}>
            {allPlans.map((plan, i) => (
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
        </div>

        <div className="pricing-dots">
          {Array.from({ length: totalDots }).map((_, index) => (
            <div
              key={index}
              className={`pricing-dot ${activeDot === index ? "active" : ""}`}
              onClick={() => scrollToCard(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

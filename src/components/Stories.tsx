import { useState, useEffect } from "react";
import data from "../data.json";
import king from '../../public/king.png';

export function Stories() {
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const displayedStories = isMobile 
    ? (showAll ? data.storiesList : data.storiesList.slice(0, 3))
    : data.storiesList;

  return (
    <section className="stories-section">
      <style>
        {`
          .stories-grid-adaptive {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: 260px;
            gap: 24px;
            width: 100%;
            padding: 40px 0;
          }

          .story-card-0 {
            grid-row: span 2;
          }

          @media (max-width: 1024px) {
            .stories-grid-adaptive {
              grid-template-columns: repeat(2, 1fr);
            }
            .story-card-0 {
              grid-row: span 1;
            }
          }

          @media (max-width: 640px) {
            .stories-grid-adaptive {
              grid-template-columns: 1fr;
              grid-auto-rows: auto;
              gap: 16px;
              padding: 24px 0;
            }
            .story-card-adaptive {
              min-height: 280px;
            }
            .stories-title {
              font-size: 28px !important;
              margin-bottom: 12px !important;
            }
            .stories-description {
              font-size: 14px !important;
              padding: 0 10px;
              line-height: 1.5 !important;
            }
          }
        `}
      </style>

      <div className="stories-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div className="stories-header" style={{ textAlign: 'center' }}>
          <h2 className="stories-title" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Stories and Insights</h2>
          <p className="stories-description" style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            Everything About Modern Technology, New Trends, Product Insights, and Practical Ways to Scale Without the Confusion
          </p>
        </div>

        <div className="stories-grid-adaptive">
          {displayedStories.map((story, i) => (
            <div
              key={i}
              className={`story-card-adaptive story-card-${i}`}
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '30px',
                backgroundImage: `url(${king})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
                  zIndex: 1
                }} 
              />

              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: '19px',
                    lineHeight: 1.25,
                    color: 'white'
                  }}
                >
                  {story.title}
                </h3>
                
                <button 
                  style={{
                    marginTop: '20px', 
                    background: "linear-gradient(90deg, #5865f2 0%, #a855f7 100%)",

                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    width: 'fit-content'
                  }}
                >
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="stories-view-all"
          onClick={() => setShowAll(!showAll)}
          style={{
            background: "linear-gradient(90deg, #5865f2 0%, #a855f7 100%)",
            padding: "16px 70px",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "18px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "transform 0.2s, opacity 0.2s",
            display: isMobile ? "block" : "block",
          }}
        >
          {showAll ? "Show Less" : "View All"}
        </button>
      </div>
    </section>
  );
}

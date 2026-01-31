import data from "../data.json";

const featureIcons = [
  "/Social%20Media%20Management%20Icon.svg",
  "/Social%20Media%20Scheduling%20Icon.svg",
  "/Social%20Analytics%20Icon%20(1).svg",
  "/Social%20Inbox%20Icon.svg",
  "/Email%20Marketing%20Icon%20(1).svg",
  "/Whatsapp%20Automation%20Icon.svg",
];

export function Features() {
  return (
    <section className="features-section">
      <style>{`
        @media (max-width: 640px) {
          .features-section {
            padding: 0 16px 60px 16px !important;
          }
          .features-container {
            display: flex !important;
            flex-direction: column;
            gap: 16px !important;
            overflow: visible;
            padding-bottom: 0;
          }
          .feature-card {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 220px;
          }
          .feature-title {
            font-size: 20px !important;
          }
          .feature-description {
            font-size: 14px !important;
          }
        }
      `}</style>
      <div className="features-container">
        {data.features.map((title, i) => (
          <div
            key={i}
            className="feature-card"
          >
            <div className="feature-icon-container">
              <img
                src={featureIcons[i % featureIcons.length]}
                alt=""
                width={28}
                height={26}
                className="feature-icon-top"
                aria-hidden="true"
              />
              <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="feature-icon-bottom">
                <rect width="45" height="45" rx="7" fill="url(#paint0_linear_795_2672)"/>
                <defs>
                  <linearGradient id="paint0_linear_795_2672" x1="1.57343" y1="37" x2="42.1615" y2="8.898" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4C6AFF"/>
                    <stop offset="0.969529" stopColor="#8A5BFF"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>

  <h3 className="feature-title">
              {title.split("\n").map((line, index) => (
                <span key={index}>
                  {line}
                  <br />
                </span>
              ))}
            </h3>

            <p style={{color:"white"}} className="feature-description">
              The All-in-One solution for social media management & growth.
              The All-in-One solution for social media.
            </p>

            </div>
          
         
          </div>  
        ))}
      </div>
    </section>
  );
}

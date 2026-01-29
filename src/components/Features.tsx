import data from "../data.json";

export function Features() {
  return (
    <section className="features-section">
      <style>{`
        @media (max-width: 640px) {
          .features-section {
            padding: 0 16px 60px 16px !important;
          }
          .features-container {
            max-width: 360px !important;
            margin: 0 auto;
            justify-items: center;
          }
          .feature-card {
            width: 100% !important;
            max-width: 340px !important;
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
              <svg width="28" height="26" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="feature-icon-top">
                <path d="M0 19.1158V6.16125C3.22951e-06 4.5548 0.624877 3.01301 1.73937 1.86449L1.79283 1.81006C2.94078 0.656061 4.4977 0.0078867 6.12106 0.0078834L8.1488 0C8.68256 7.29894e-06 9.11528 0.434999 9.11528 0.971587C9.11528 1.50818 8.68256 1.94317 8.1488 1.94317L6.12106 1.95106C5.01027 1.95106 3.94504 2.39457 3.15965 3.1841C2.37426 3.97364 1.93297 5.04462 1.93297 6.16125V19.1158C1.93297 20.2324 2.37417 21.3031 3.15961 22.0928L3.19665 22.1295C3.97839 22.8961 5.0277 23.326 6.12106 23.326H21.5848C22.6956 23.326 23.7608 22.8823 24.5462 22.0928C25.3317 21.3031 25.7729 20.2324 25.7729 19.1158V11.3431C25.7729 10.8065 26.2056 10.3715 26.7394 10.3715C27.2732 10.3715 27.7059 10.8065 27.7059 11.3431V19.1158C27.7059 20.7478 27.061 22.3128 25.913 23.4668C24.7652 24.6207 23.2083 25.2692 21.5848 25.2692H6.12106C4.4976 25.2691 2.94071 24.6207 1.79283 23.4669C0.644944 22.3128 3.51494e-06 20.7478 0 19.1158Z" fill="white"/>
                <path d="M24.5406 3.17944C25.326 3.9691 25.7672 5.03983 25.7672 6.15644L25.7672 7.59193C25.7672 8.1257 26.1999 8.55841 26.7337 8.55841C27.2675 8.55841 27.7002 8.1257 27.7002 7.59193L27.7002 6.15644C27.7002 4.52439 27.0553 2.95938 25.9074 1.80536C24.7595 0.651493 23.2026 0.00307044 21.5791 0.00306744L5.85516 0.00306606C5.31856 0.00306601 4.88357 0.438061 4.88357 0.974654C4.88357 1.51125 5.31856 1.94624 5.85516 1.94624L21.5791 1.94624C22.6725 1.94625 23.7218 2.37614 24.5035 3.1427L24.5406 3.17944Z" fill="white"/>
                <rect x="7.0918" y="6.08167" width="5.06547" height="5.06547" rx="1" fill="white"/>
                <rect x="15.1929" y="6.08167" width="5.06547" height="5.06547" rx="1" fill="white"/>
                <rect x="15.1929" y="14.1872" width="5.06547" height="5.06547" rx="1" fill="white"/>
                <rect x="7.0918" y="14.1872" width="5.06547" height="5.06547" rx="1" fill="white"/>
              </svg>
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

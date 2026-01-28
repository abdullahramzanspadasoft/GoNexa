import data from "../data.json";

export function Products() {
  return (
    <section className="products-section" style={{ padding: "80px 0", backgroundColor: "#f8f9fa" }}>
      <style>
        {`
          .products-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          @media (max-width: 1024px) {
            .products-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 640px) {
            .products-section {
              padding: 40px 0 !important;
            }
            .products-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
            .products-title {
              font-size: 28px !important;
            }
          }
        `}
      </style>

      <div className="products-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <div className="products-header" style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 className="products-title" style={{ fontSize: "36px", fontWeight: "700", marginBottom: "16px" }}>
            GoNexa Products
          </h2>
          <p className="products-description" style={{ maxWidth: "700px", margin: "0 auto", color: "#666", lineHeight: "1.6" }}>
            GoNexa Built for founders & businesses who want clear insights, faster growth, & easier digital operations without switching between multiple tools
          </p>
        </div>

        <div className="products-grid">
          {data.productsList.map((product, i) => (
            <div
              key={i}
              style={{
                backgroundImage: `url(/hii.png)`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                padding: "31px 32px",
                borderRadius: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "11px",
                color: "#fff",
                minHeight: "220px",
                position: "relative",
              }}
            >
              <div style={{ width: "45px", height: "45px", marginBottom: "8px" }}>
                <svg
                  width="45"
                  height="45"
                  viewBox="0 0 45 45"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="45" height="45" rx="7" fill={`url(#paint0_linear_${i})`} />
                  <g transform="translate(8.5, 9.5) scale(0.65)">
                    <path
                      d="M0 19.1158V6.16125C0 4.5548 0.624877 3.01301 1.73937 1.86449L1.79283 1.81006C2.94078 0.656061 4.4977 0.0078867 6.12106 0.0078834L8.1488 0C8.68256 7.29894e-06 9.11528 0.434999 9.11528 0.971587C9.11528 1.50818 8.68256 1.94317 8.1488 1.94317L6.12106 1.95106C5.01027 1.95106 3.94504 2.39457 3.15965 3.1841C2.37426 3.97364 1.93297 5.04462 1.93297 6.16125V19.1158C1.93297 20.2324 2.37417 21.3031 3.15961 22.0928L3.19665 22.1295C3.97839 22.8961 5.0277 23.326 6.12106 23.326H21.5848C22.6956 23.326 23.7608 22.8823 24.5462 22.0928C25.3317 21.3031 25.7729 20.2324 25.7729 19.1158V11.3431C25.7729 10.8065 26.2056 10.3715 26.7394 10.3715C27.2732 10.3715 27.7059 10.8065 27.7059 11.3431V19.1158C27.7059 20.7478 27.061 22.3128 25.913 23.4668C24.7652 24.6207 23.2083 25.2692 21.5848 25.2692H6.12106C4.4976 25.2691 2.94071 24.6207 1.79283 23.4669C0.644944 22.3128 0 20.7478 0 19.1158Z"
                      fill="white"
                    />
                    <rect x="7.0918" y="6.08167" width="5.06547" height="5.06547" rx="1" fill="white" />
                    <rect x="15.1929" y="6.08167" width="5.06547" height="5.06547" rx="1" fill="white" />
                    <rect x="15.1929" y="14.1872" width="5.06547" height="5.06547" rx="1" fill="white" />
                    <rect x="7.0918" y="14.1872" width="5.06547" height="5.06547" rx="1" fill="white" />
                  </g>
                  <defs>
                    <linearGradient
                      id={`paint0_linear_${i}`}
                      x1="1.57343"
                      y1="37"
                      x2="42.1615"
                      y2="8.898"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#4C6AFF" />
                      <stop offset="0.969529" stopColor="#8A5BFF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <h3
                className="product-name"
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "600",
                  lineHeight: "1.3",
                }}
              >
                {product.name.split("\n").map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
              </h3>

              <p
                className="product-description"
                style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "1.5",
                  opacity: 0.8,
                  maxWidth: "90%",
                }}
              >
                {product.description}
              </p>
            </div>
          ))}
        </div>

        <div className="products-button-container" style={{ textAlign: "center", marginTop: "48px" }}>
          <button   style={{
    padding: "16px 70px",
    background: "linear-gradient(90deg, #5865f2 0%, #a855f7 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.2s, opacity 0.2s",
  }}>
            Joins <span
              style={{

                color: "white",
                fontWeight: 700,
                fontSize: "18px",
                cursor: "pointer",
                transition: "transform 0.2s, opacity 0.2s",
                borderRadius: "12px",
                background: "linear-gradient(90deg, #5865f2 0%, #a855f7 100%)",
                border: "none",
              }}>GoNexa</span>
          </button>
        </div>
      </div>
    </section>
  );
}

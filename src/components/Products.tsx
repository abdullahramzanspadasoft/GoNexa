import data from "../data.json";

const productIcons = [
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 13h2M12 13h2M16 13h2M8 17h2M12 17h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 17V10M12 17V7M17 17v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 17h-2a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M11 12h8a3 3 0 0 1 3 3v5l-3-2h-8a3 3 0 0 1-3-3v-1a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" />
      <path d="m4 8 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 0 1-12.3 6.7L4 20l1.3-3.7A8 8 0 1 1 20 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9.5 9.5h.01M14.5 9.5h.01M9 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
];

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
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  background: "linear-gradient(180deg, #4C6AFF 0%, #8A5BFF 100%)",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {productIcons[i % productIcons.length]}
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

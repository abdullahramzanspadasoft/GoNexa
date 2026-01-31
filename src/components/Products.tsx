import data from "../data.json";

const productIcons = [
  "/Social%20Media%20Management%20Icon.svg",
  "/Social%20Media%20Scheduling%20Icon.svg",
  "/Social%20Analytics%20Icon%20(1).svg",
  "/Social%20Inbox%20Icon.svg",
  "/Email%20Marketing%20Icon%20(1).svg",
  "/Whatsapp%20Automation%20Icon.svg",
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
              padding: 40px 16px !important;
              display: flex !important;
              justify-content: center !important;
            }
            .products-container {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              padding: 0 16px !important;
              gap: 0px
            }
            .products-header {
              width: 100%;
            }
            .products-grid {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              gap: 16px !important;
              max-width: 360px !important;
              width: 100% !important;
            }
            .products-grid > div {
              width: 100% !important;
              max-width: 340px !important;
              margin: 0 auto !important;
            }
            .products-title {
              font-size: 28px !important;
            }
            .products-description {
              font-size: 14px !important;
              padding: 0 10px;
            }
            .products-button-container {
              width: 100%;
              display: flex;
              justify-content: center;
            }
            .products-button-container button {
              width: 100%;
              max-width: 280px;
              padding: 14px 24px !important;
              font-size: 16px !important;
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
                <img
                  src={productIcons[i % productIcons.length]}
                  alt=""
                  width={22}
                  height={22}
                  aria-hidden="true"
                />
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
          <button className="cta-hover" style={{
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
                border: "none",
              }}>GoNexa</span>
          </button>
        </div>
      </div>
    </section>
  );
}

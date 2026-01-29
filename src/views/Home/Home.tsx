import { Navbar } from "../../components/Navbar";
import { Hero } from "../../components/Hero";
import { Features } from "../../components/Features";
import { About } from "../../components/About";
import { TrustedBy } from "../../components/TrustedBy";
import { Stats } from "../../components/Stats";
import { Pricing } from "../../components/Pricing";
import { Products } from "../../components/Products";
import { Stories } from "../../components/Stories";
import { Footer } from "../../components/Footer";

export function Home() {
  return (
    <div className="app-container">
      <Navbar />
      <Hero />
      <Features />
      <About />
      <TrustedBy />
      <Stats />
      <Pricing />
      <Products />
      <Stories />
      <Footer />
    </div>
  );
}

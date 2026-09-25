import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import HeroSection from "../components/home/HeroSection";
import HomeCarousel from "../components/home/HomeCarousel";
import BranchesSection from "../components/home/BranchesSection";
import SpecialtiesSection from "../components/home/SpecialtiesSection";
import HighlightsSection from "../components/home/HighlightsSection";
/*
 * HOME PAGE
 * ---------------------------------------------------------------------------
 * La pagina solo compone secciones.
 * Cada seccion mantiene su propia responsabilidad y puede evolucionar sin
 * convertir HomePage en un archivo dificil de mantener.
 */

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        <HeroSection />
        <HomeCarousel />
        <SpecialtiesSection />
        <HighlightsSection />
        <BranchesSection />
</main>

      <SiteFooter />
    </>
  );
}


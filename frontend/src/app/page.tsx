import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategoryShowcase from "@/components/CategoryShowcase";
import NewLaunch from "@/components/NewLaunch";
import Footer from "@/components/Footer";
// import StatsCounter from "@/components/StatsCounter";
import FeaturedSpotlight from "@/components/FeaturedSpotlight";
// import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import NewsletterCTA from "@/components/NewsletterCTA";
import BackToTop from "@/components/BackToTop";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <CategoryShowcase />
      {/* <StatsCounter /> */}
      <FeaturedSpotlight />
      <NewLaunch />
      {/* <TestimonialsCarousel /> */}
      <NewsletterCTA />
      <Footer />
      <BackToTop />
    </main>
  );
}
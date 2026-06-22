import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategoryShowcase from "@/components/CategoryShowcase";
import NewLaunch from "@/components/NewLaunch";
import Footer from "@/components/Footer";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import TrustBar from "@/components/TrustBar";
import StatsCounter from "@/components/StatsCounter";
import FeaturedSpotlight from "@/components/FeaturedSpotlight";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import NewsletterCTA from "@/components/NewsletterCTA";
import BackToTop from "@/components/BackToTop";

export default function Home() {
  return (
    <main>
      <AnnouncementTicker />
      <Navbar />
      <Hero />
      <TrustBar />
      <CategoryShowcase />
      <StatsCounter />
      <FeaturedSpotlight />
      <NewLaunch />
      <TestimonialsCarousel />
      <NewsletterCTA />
      <Footer />
      <BackToTop />
    </main>
  );
}
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ParallaxStory from "@/components/ParallaxStory";
import CategoryShowcase from "@/components/CategoryShowcase";
import PinnedStory from "@/components/PinnedStory";
import NewLaunch from "@/components/NewLaunch";
import Footer from "@/components/Footer";
// import StatsCounter from "@/components/StatsCounter";
import FeaturedSpotlight from "@/components/FeaturedSpotlight";
import HorizontalGallery from "@/components/HorizontalGallery";
// import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import NewsletterCTA from "@/components/NewsletterCTA";
import BackToTop from "@/components/BackToTop";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <ParallaxStory />
      <CategoryShowcase />
      <PinnedStory />
      {/* <StatsCounter /> */}
      <FeaturedSpotlight />
      <HorizontalGallery />
      <NewLaunch />
      {/* <TestimonialsCarousel /> */}
      <NewsletterCTA />
      <Footer />
      <BackToTop />
    </main>
  );
}
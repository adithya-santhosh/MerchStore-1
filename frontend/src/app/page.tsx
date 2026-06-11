import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategoryShowcase from "@/components/CategoryShowcase";
import NewLaunch from "@/components/NewLaunch";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <CategoryShowcase />
      <NewLaunch />
      <Footer />
    </main>
  );
}
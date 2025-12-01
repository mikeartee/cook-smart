import { MainLayout } from '@/components/main-layout';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { TestimonialsSection } from '@/components/testimonials-section';

export default function Home() {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
    </MainLayout>
  );
}

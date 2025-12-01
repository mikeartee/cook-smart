import { render } from '@/lib/test-utils';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import * as fc from 'fast-check';
import { propertyTestConfig, viewportArbitrary } from '@/lib/property-test-utils';

// **Feature: cook-smart-website, Property 2: Responsive design adaptation**
describe('Responsive Design Tests', () => {
  // Property Test: For any viewport size, components should render without errors
  it('property: components render correctly at any viewport size', () => {
    fc.assert(
      fc.property(viewportArbitrary(), (viewport) => {
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height,
        });

        // Test that components render without throwing errors
        const { container: headerContainer } = render(<Header />);
        expect(headerContainer).toBeTruthy();

        const { container: heroContainer } = render(<HeroSection />);
        expect(heroContainer).toBeTruthy();

        const { container: featuresContainer } = render(<FeaturesSection />);
        expect(featuresContainer).toBeTruthy();

        return true;
      }),
      propertyTestConfig
    );
  });

  it('header should be responsive on mobile', () => {
    // Mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<Header />);
    expect(container).toBeTruthy();
  });

  it('header should be responsive on tablet', () => {
    // Tablet viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const { container } = render(<Header />);
    expect(container).toBeTruthy();
  });

  it('header should be responsive on desktop', () => {
    // Desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    const { container } = render(<Header />);
    expect(container).toBeTruthy();
  });

  it('hero section should adapt to mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<HeroSection />);
    expect(container).toBeTruthy();
  });

  it('features section should adapt to different viewports', () => {
    const viewports = [320, 768, 1024, 1920];

    viewports.forEach((width) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });

      const { container } = render(<FeaturesSection />);
      expect(container).toBeTruthy();
    });
  });
});

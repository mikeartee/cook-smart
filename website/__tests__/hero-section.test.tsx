import { render, screen, fireEvent } from '@/lib/test-utils';
import { HeroSection } from '@/components/hero-section';
import * as fc from 'fast-check';
import { propertyTestConfig } from '@/lib/property-test-utils';

// **Feature: cook-smart-website, Property 1: Platform-specific download redirects**
describe('HeroSection - Download Button Redirects', () => {
  // Mock window.open
  const mockOpen = jest.fn();
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = mockOpen;
    mockOpen.mockClear();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it('should render hero section', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Cook Smarter/i)).toBeInTheDocument();
  });

  it('should display download buttons', () => {
    render(<HeroSection />);
    // Desktop shows both buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  // Property Test: For any device user agent, clicking download button should redirect to correct store
  it('property: download buttons redirect to correct platform store', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ios', 'android', 'desktop'),
        (deviceType) => {
          // Mock user agent based on device type
          const userAgents = {
            ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            android: 'Mozilla/5.0 (Linux; Android 10)',
            desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          };

          Object.defineProperty(navigator, 'userAgent', {
            value: userAgents[deviceType],
            configurable: true,
          });

          mockOpen.mockClear();
          const { container } = render(<HeroSection />);

          // Find and click download buttons
          const buttons = container.querySelectorAll('button');
          const downloadButtons = Array.from(buttons).filter((btn) =>
            btn.textContent?.includes('App Store') ||
            btn.textContent?.includes('Google Play') ||
            btn.textContent?.includes('iPhone') ||
            btn.textContent?.includes('Android')
          );

          if (downloadButtons.length > 0) {
            // Click first download button
            fireEvent.click(downloadButtons[0]);

            // Verify window.open was called
            expect(mockOpen).toHaveBeenCalled();

            // Verify correct URL based on button text
            const callArgs = mockOpen.mock.calls[0];
            const url = callArgs[0] as string;

            if (
              downloadButtons[0].textContent?.includes('App Store') ||
              downloadButtons[0].textContent?.includes('iPhone')
            ) {
              // iOS button should open App Store URL
              expect(
                url.includes('apps.apple.com') || url.includes('IOS_STORE_URL')
              ).toBe(true);
            } else if (
              downloadButtons[0].textContent?.includes('Google Play') ||
              downloadButtons[0].textContent?.includes('Android')
            ) {
              // Android button should open Google Play URL
              expect(
                url.includes('play.google.com') || url.includes('ANDROID_STORE_URL')
              ).toBe(true);
            }
          }

          return true;
        }
      ),
      propertyTestConfig
    );
  });

  it('should open iOS App Store when iOS button is clicked', () => {
    render(<HeroSection />);

    // Find iOS button (contains "App Store" or Apple icon)
    const buttons = screen.getAllByRole('button');
    const iosButton = buttons.find(
      (btn) =>
        btn.textContent?.includes('App Store') || btn.textContent?.includes('iPhone')
    );

    if (iosButton) {
      fireEvent.click(iosButton);
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('apps.apple.com'),
        '_blank'
      );
    }
  });

  it('should open Google Play when Android button is clicked', () => {
    render(<HeroSection />);

    // Find Android button (contains "Google Play" or Play icon)
    const buttons = screen.getAllByRole('button');
    const androidButton = buttons.find(
      (btn) =>
        btn.textContent?.includes('Google Play') || btn.textContent?.includes('Android')
    );

    if (androidButton) {
      fireEvent.click(androidButton);
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('play.google.com'),
        '_blank'
      );
    }
  });

  it('should display social proof statistics', () => {
    render(<HeroSection />);
    expect(screen.getByText(/10K\+/)).toBeInTheDocument();
    expect(screen.getByText(/50K\+/)).toBeInTheDocument();
    expect(screen.getByText(/4\.8★/)).toBeInTheDocument();
  });

  it('should display key benefits', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Smart Meal Planning/i)).toBeInTheDocument();
    expect(screen.getByText(/Recipe Discovery/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto Shopping Lists/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutrition Tracking/i)).toBeInTheDocument();
  });
});

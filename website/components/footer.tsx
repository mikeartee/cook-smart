'use client';

import React from 'react';
import Link from 'next/link';

export function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">Cook Smart</h2>
            <p className="text-sm mb-4">
              Your personal cooking assistant for discovering recipes, planning meals, and cooking smarter.
            </p>
            <p className="text-sm text-gray-400">
              Connect with us: <a href="mailto:services.cooksmart@gmail.com" className="hover:text-white transition-colors">services.cooksmart@gmail.com</a>
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/recipes" className="hover:text-white transition-colors">
                  Recipes
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/accessibility" className="hover:text-white transition-colors">
                  Accessibility
                </Link>
              </li>
              <li>
                <Link href="/legal/community-guidelines" className="hover:text-white transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/legal/copyright" className="hover:text-white transition-colors">
                  Copyright Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/security-disclosure" className="hover:text-white transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/legal/do-not-sell" className="hover:text-white transition-colors">
                  Do Not Sell My Info
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm mb-4">
              Get the latest recipes and cooking tips delivered to your inbox.
            </p>
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                type="email"
                id="footer-email"
                name="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                aria-required="true"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm">
              &copy; {currentYear} Cook Smart. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/legal/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span aria-hidden="true">•</span>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span aria-hidden="true">•</span>
              <Link href="/legal/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
              <span aria-hidden="true">•</span>
              <Link href="/legal/accessibility" className="hover:text-white transition-colors">
                Accessibility
              </Link>
              <span aria-hidden="true">•</span>
              <button
                onClick={() => {
                  // Cookie settings modal would open
                  alert('Cookie preferences modal would open here');
                }}
                className="hover:text-white transition-colors"
              >
                Cookie Settings
              </button>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              Recipe data provided by{' '}
              <a
                href="https://www.themealdb.com/"
                className="hover:text-gray-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                TheMealDB
              </a>
              {' '}and internal sources.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}


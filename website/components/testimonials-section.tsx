'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from './ui/button';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
}

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sarah J.',
      role: 'Beta Tester',
      image: '👩‍🍳',
      quote:
        "Excited to be part of the Cook Smart beta! The meal planning feature is already making my life easier. Can't wait to see what's next!",
      rating: 5,
    },
    {
      id: 2,
      name: 'Michael C.',
      role: 'Beta Tester',
      image: '💪',
      quote:
        'Love being an early tester! The recipe collection is growing fast and the team actually listens to feedback. This app has real potential!',
      rating: 5,
    },
    {
      id: 3,
      name: 'Emily R.',
      role: 'Beta Tester',
      image: '👩‍🎓',
      quote:
        "So glad I joined the beta! It's free right now and I get to help shape a cooking app that actually works for students. The developers are super responsive!",
      rating: 5,
    },
    {
      id: 4,
      name: 'David T.',
      role: 'Beta Tester',
      image: '👨‍💼',
      quote:
        'Being part of the beta is awesome! I get early access to features and my suggestions actually get implemented. This is going to be huge when it launches!',
      rating: 5,
    },
    {
      id: 5,
      name: 'Lisa P.',
      role: 'Beta Tester',
      image: '👩‍🍳',
      quote:
        "Thrilled to be testing Cook Smart! The interface is intuitive and the recipe collection keeps growing. Plus it's completely free during beta - no brainer!",
      rating: 5,
    },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="bg-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Loved by <span className="text-primary">Beta Testers</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our early adopters are saying about their Cook Smart BETA experience
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-2xl bg-card p-8 shadow-lg md:p-12">
            {/* Quote Icon */}
            <Quote className="absolute left-8 top-8 h-12 w-12 text-primary/20" />

            {/* Testimonial Content */}
            <div className="relative">
              <div className="mb-8 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
                  {currentTestimonial.image}
                </div>
              </div>

              <blockquote className="mb-8 text-center text-xl font-medium leading-relaxed md:text-2xl">
                "{currentTestimonial.quote}"
              </blockquote>

              {/* Rating */}
              <div className="mb-4 flex justify-center">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <span key={i} className="text-2xl text-yellow-500">
                    ★
                  </span>
                ))}
              </div>

              {/* Author */}
              <div className="text-center">
                <div className="font-semibold">{currentTestimonial.name}</div>
                <div className="text-sm text-muted-foreground">{currentTestimonial.role}</div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-primary'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Beta Program Highlights */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl">🎉</div>
            <div className="font-semibold">100% FREE</div>
            <div className="text-sm text-muted-foreground">During BETA testing</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl">👥</div>
            <div className="font-semibold">100+ Beta Testers</div>
            <div className="text-sm text-muted-foreground">Join our growing community</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl">🚀</div>
            <div className="font-semibold">Early Access</div>
            <div className="text-sm text-muted-foreground">Shape the future of Cook Smart</div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
      name: 'Sarah Johnson',
      role: 'Busy Mom of 3',
      image: '👩‍🍳',
      quote:
        "Cook Smart has transformed how I feed my family. Meal planning used to take hours, now it's done in minutes. My kids actually eat vegetables now!",
      rating: 5,
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Fitness Enthusiast',
      image: '💪',
      quote:
        'The nutrition tracking is incredible. I hit my macros every day without thinking about it. Lost 15 pounds in 2 months while eating delicious food!',
      rating: 5,
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'College Student',
      image: '👩‍🎓',
      quote:
        "As a broke college student, this app is a lifesaver. The budget-friendly recipes and shopping lists help me eat healthy without breaking the bank.",
      rating: 5,
    },
    {
      id: 4,
      name: 'David Thompson',
      role: 'Working Professional',
      image: '👨‍💼',
      quote:
        'I used to order takeout every night. Now I cook 5 nights a week and save over $400/month. The quick recipes are perfect for my busy schedule.',
      rating: 5,
    },
    {
      id: 5,
      name: 'Lisa Park',
      role: 'Home Chef',
      image: '👩‍🍳',
      quote:
        'The recipe discovery feature is amazing! I\'ve tried cuisines I never would have attempted. My dinner parties are now legendary among friends.',
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
            Loved by <span className="text-primary">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our users are saying about their Cook Smart experience
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

        {/* Trust Badges */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl">🏆</div>
            <div className="font-semibold">App of the Day</div>
            <div className="text-sm text-muted-foreground">Featured by Apple</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl">⭐</div>
            <div className="font-semibold">4.8 Star Rating</div>
            <div className="text-sm text-muted-foreground">Over 5,000 reviews</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl">🎖️</div>
            <div className="font-semibold">Editor's Choice</div>
            <div className="text-sm text-muted-foreground">Google Play Store</div>
          </div>
        </div>
      </div>
    </section>
  );
}

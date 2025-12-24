'use client';

import { useState } from 'react';
import { Star, Play, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Testimonial {
  id: string;
  name: string;
  photo: string;
  story: string;
  metrics: {
    timeSaved?: string;
    mealsCooked?: number;
    moneySaved?: string;
  };
  goal: string;
  diet: string;
  skillLevel: string;
  videoUrl?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    photo: '/testimonials/sarah.jpg',
    story: 'Cook Smart transformed my meal planning! I went from ordering takeout 5 times a week to cooking healthy meals at home. The app made it so easy to find recipes that fit my busy schedule.',
    metrics: { timeSaved: '10 hours/week', mealsCooked: 156, moneySaved: '$400/month' },
    goal: 'Save Time',
    diet: 'Vegetarian',
    skillLevel: 'Beginner',
  },
  {
    id: '2',
    name: 'Michael Chen',
    photo: '/testimonials/michael.jpg',
    story: 'As someone trying to eat healthier, Cook Smart has been a game-changer. The nutritional information and meal planning features help me stay on track with my fitness goals.',
    metrics: { mealsCooked: 203, moneySaved: '$300/month' },
    goal: 'Eat Healthier',
    diet: 'High-Protein',
    skillLevel: 'Intermediate',
    videoUrl: 'https://example.com/video',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    photo: '/testimonials/emily.jpg',
    story: 'I love how Cook Smart helps me reduce food waste. The smart grocery lists and meal planning mean I only buy what I need, and I use everything I purchase.',
    metrics: { timeSaved: '5 hours/week', mealsCooked: 89, moneySaved: '$200/month' },
    goal: 'Reduce Waste',
    diet: 'Gluten-Free',
    skillLevel: 'Advanced',
  },
];

export default function TestimonialsPage(): React.ReactElement {
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');

  const filteredTestimonials = TESTIMONIALS.filter((t) => {
    if (goalFilter !== 'all' && t.goal !== goalFilter) return false;
    if (dietFilter !== 'all' && t.diet !== dietFilter) return false;
    if (skillFilter !== 'all' && t.skillLevel !== skillFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <h1 className="mb-4 text-4xl font-bold">Success Stories</h1>
          <p className="text-lg text-muted-foreground">
            Real people, real results. See how Cook Smart has helped thousands transform their cooking journey.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>
          
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="all">All Goals</option>
            <option value="Save Time">Save Time</option>
            <option value="Eat Healthier">Eat Healthier</option>
            <option value="Reduce Waste">Reduce Waste</option>
          </select>

          <select
            value={dietFilter}
            onChange={(e) => setDietFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="all">All Diets</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="High-Protein">High-Protein</option>
            <option value="Gluten-Free">Gluten-Free</option>
          </select>

          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="all">All Skill Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {filteredTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="overflow-hidden">
              <div className="p-6">
                <div className="mb-4 flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                    <div className="flex h-full items-center justify-center text-2xl font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-xl font-bold">{testimonial.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{testimonial.goal}</Badge>
                      <Badge variant="outline">{testimonial.diet}</Badge>
                      <Badge variant="outline">{testimonial.skillLevel}</Badge>
                    </div>
                  </div>
                  {testimonial.videoUrl && (
                    <Button variant="outline" size="sm">
                      <Play className="mr-2 h-4 w-4" />
                      Watch
                    </Button>
                  )}
                </div>

                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="mb-6 text-muted-foreground">{testimonial.story}</p>

                <div className="grid gap-4 sm:grid-cols-3">
                  {testimonial.metrics.timeSaved && (
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{testimonial.metrics.timeSaved}</p>
                      <p className="text-sm text-muted-foreground">Time Saved</p>
                    </div>
                  )}
                  {testimonial.metrics.mealsCooked && (
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{testimonial.metrics.mealsCooked}</p>
                      <p className="text-sm text-muted-foreground">Meals Cooked</p>
                    </div>
                  )}
                  {testimonial.metrics.moneySaved && (
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{testimonial.metrics.moneySaved}</p>
                      <p className="text-sm text-muted-foreground">Money Saved</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTestimonials.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No testimonials match your filters</p>
          </Card>
        )}

        <div className="mt-12 rounded-lg bg-primary p-8 text-center text-primary-foreground">
          <h2 className="mb-4 text-3xl font-bold">Share Your Story</h2>
          <p className="mb-6 text-lg opacity-90">
            Have you had success with Cook Smart? We'd love to hear about your journey!
          </p>
          <Button variant="secondary" size="lg">
            Submit Your Story
          </Button>
        </div>
      </div>
    </div>
  );
}

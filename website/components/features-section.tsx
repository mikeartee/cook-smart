'use client';

import {
  AlertTriangle,
  Calendar,
  ChefHat,
  Heart,
  Shield,
  ShoppingCart,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: ChefHat,
      title: '1M+ Recipe Database',
      description:
        "Access over 1 million recipes from the world's largest database. Search by ingredients, cuisine, dietary needs, or browse trending recipes updated twice daily.",
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Shield,
      title: 'Allergy Safety Analysis',
      description:
        'Automatic recipe safety checks for your allergies. Get instant alerts for allergens, severity indicators, and smart ingredient substitutions.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: AlertTriangle,
      title: 'Cross-Contamination Warnings',
      description:
        'Advanced safety checks warn you about potential cross-contamination risks. Cook with confidence knowing your meals are safe.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Heart,
      title: 'Personalized Recommendations',
      description:
        "AI-powered recipe suggestions based on your allergies, dietary preferences, and taste profile. Discover safe recipes you'll love.",
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      icon: Calendar,
      title: 'Smart Meal Planning',
      description:
        'Plan your entire week in minutes. Our AI suggests balanced meals based on your preferences, dietary needs, and schedule.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: ShoppingCart,
      title: 'Auto Shopping Lists',
      description:
        'Automatically generate shopping lists from your meal plan. Organize by store section and check off items as you shop.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: TrendingUp,
      title: 'Nutrition Tracking',
      description:
        'Track calories, macros, and nutrients effortlessly. See detailed breakdowns for every meal and stay on top of your health goals.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Users,
      title: 'Family Sharing',
      description:
        'Share meal plans with family members. Coordinate cooking duties and ensure everyone eats well together.',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      icon: Zap,
      title: 'Quick & Easy',
      description:
        'Find recipes that fit your time. Filter by prep time and get step-by-step guidance with timers and notifications.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Everything You Need to
            <span className="text-primary"> Cook Smart</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to make meal planning, cooking, and eating healthy easier
            than ever before.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group rounded-2xl border bg-card p-8 transition-all hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}
                >
                  <Icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* App Screenshots Section */}
        <div className="mt-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Screenshot 1 */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold">Meal Planning</h4>
                </div>
                <div className="aspect-[9/16] overflow-hidden rounded-xl bg-white shadow-xl">
                  <img
                    src="/images/meal-planning.png"
                    alt="Cook Smart Meal Planning Screen"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Screenshot 2 */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 p-8 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                    <ChefHat className="h-8 w-8 text-orange-600" />
                  </div>
                  <h4 className="font-semibold">Recipe Browser</h4>
                </div>
                <div className="aspect-[9/16] overflow-hidden rounded-xl bg-white shadow-xl">
                  <img
                    src="/images/recipe-browser.png"
                    alt="Cook Smart Recipe Browser Screen"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Screenshot 3 */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-8 shadow-lg transition-transform hover:scale-105">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold">Shopping List</h4>
                </div>
                <div className="aspect-[9/16] overflow-hidden rounded-xl bg-white shadow-xl">
                  <img
                    src="/images/shopping-list.png"
                    alt="Cook Smart Shopping List Screen"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 rounded-2xl bg-primary/5 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">1M+</div>
              <div className="text-sm text-muted-foreground">Recipes Available</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Beta Testers</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">FREE</div>
              <div className="text-sm text-muted-foreground">During BETA</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">🎉</div>
              <div className="text-sm text-muted-foreground">Join Now</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

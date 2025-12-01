import { ChefHat, Users, Heart, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AboutPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <h1 className="mb-4 text-4xl font-bold">About Cook Smart</h1>
          <p className="text-lg text-muted-foreground">
            Empowering home cooks to create delicious meals with confidence
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <h2 className="mb-4 text-3xl font-bold">Our Mission</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Cook Smart was created to make home cooking accessible, enjoyable, and stress-free for
              everyone. We believe that cooking should be a joyful experience, not a daily chore.
              Our app combines smart meal planning, personalized recipes, and intuitive tools to
              help you cook better, save time, and reduce food waste.
            </p>
          </div>

          <div className="mb-12 grid gap-6 sm:grid-cols-2">
            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Our Vision</h3>
              <p className="text-muted-foreground">
                To become the world's most trusted cooking companion, helping millions of people
                discover the joy of home cooking.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Our Values</h3>
              <p className="text-muted-foreground">
                Simplicity, quality, and community. We're committed to creating tools that make
                cooking easier while fostering a supportive community of food lovers.
              </p>
            </Card>
          </div>

          <div className="mb-12">
            <h2 className="mb-6 text-3xl font-bold">What We Offer</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ChefHat className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Thousands of Recipes</h3>
                  <p className="text-muted-foreground">
                    Access a vast collection of recipes from professional chefs and home cooks,
                    with new additions every week.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Community-Driven</h3>
                  <p className="text-muted-foreground">
                    Join a vibrant community of food enthusiasts. Share your recipes, get
                    inspiration, and connect with fellow cooks.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-primary p-8 text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-bold">Join Our Community</h2>
            <p className="mb-6 text-lg opacity-90">
              Download Cook Smart today and start your journey to becoming a more confident cook.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={process.env.NEXT_PUBLIC_ANDROID_STORE_URL || '#'}
                className="rounded-lg bg-background px-6 py-3 font-medium text-foreground hover:bg-background/90"
              >
                Download for Android
              </a>
              <a
                href={process.env.NEXT_PUBLIC_IOS_STORE_URL || '#'}
                className="rounded-lg bg-background px-6 py-3 font-medium text-foreground hover:bg-background/90"
              >
                Download for iOS
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

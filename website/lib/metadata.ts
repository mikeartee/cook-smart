import { Metadata } from 'next';

interface GenerateMetadataProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cooksmartapp.com';
const siteName = 'Cook Smart';

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  ogImage = '/og-image.png',
  canonical,
  article,
}: GenerateMetadataProps): Metadata {
  const fullTitle = `${title} | ${siteName}`;
  const canonicalUrl = canonical || siteUrl;
  const imageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: article?.author ? [{ name: article.author }] : undefined,
    openGraph: {
      type: article ? 'article' : 'website',
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
            authors: article.author ? [article.author] : undefined,
            tags: article.tags,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      site: '@cooksmartapp',
      creator: '@cooksmartapp',
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// Generate JSON-LD structured data
export function generateStructuredData(props: GenerateMetadataProps) {
  const { title, description, canonical, article } = props;
  const canonicalUrl = canonical || siteUrl;

  if (article) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      url: canonicalUrl,
      datePublished: article.publishedTime,
      dateModified: article.modifiedTime,
      author: {
        '@type': 'Person',
        name: article.author,
      },
      publisher: {
        '@type': 'Organization',
        name: siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.png`,
        },
      },
      keywords: article.tags?.join(', '),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description,
    url: canonicalUrl,
  };
}

// Recipe structured data
export function generateRecipeStructuredData(recipe: {
  name: string;
  description: string;
  image?: string;
  cookingTime: number;
  servings: number;
  ingredients: Array<{ name: string; amount: string; unit: string }>;
  instructions: string[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  author: { name: string };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.description,
    image: recipe.image ? `${siteUrl}${recipe.image}` : undefined,
    author: {
      '@type': 'Person',
      name: recipe.author.name,
    },
    prepTime: `PT${recipe.cookingTime}M`,
    cookTime: `PT${recipe.cookingTime}M`,
    totalTime: `PT${recipe.cookingTime}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeIngredient: recipe.ingredients.map(
      (ing) => `${ing.amount} ${ing.unit} ${ing.name}`.trim()
    ),
    recipeInstructions: recipe.instructions.map((instruction, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text: instruction,
    })),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${recipe.nutritionalInfo.calories} calories`,
      proteinContent: `${recipe.nutritionalInfo.protein}g`,
      carbohydrateContent: `${recipe.nutritionalInfo.carbs}g`,
      fatContent: `${recipe.nutritionalInfo.fat}g`,
      fiberContent: `${recipe.nutritionalInfo.fiber}g`,
    },
  };
}


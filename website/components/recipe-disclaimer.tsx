import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function RecipeDisclaimer(): React.ReactElement {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg" role="alert">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-yellow-800 mb-1">Important Health & Safety Information</p>
          <ul className="text-yellow-700 space-y-1">
            <li>
              <strong>Allergens:</strong> Always check ingredients for allergens. Recipe sources may not list all allergens.
            </li>
            <li>
              <strong>Nutritional Information:</strong> Nutritional data is approximate and may not be accurate. Consult a healthcare professional for dietary advice.
            </li>
            <li>
              <strong>Food Safety:</strong> Follow proper food handling and cooking procedures. Cook foods to safe internal temperatures.
            </li>
            <li>
              <strong>Medical Advice:</strong> This recipe is not medical advice. Consult healthcare professionals regarding dietary restrictions or health conditions.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


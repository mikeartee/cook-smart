/**
 * Component test for the shared RecipeCard.
 *
 * Verifies the rating-display behaviour added in slice #6: the rating chip
 * renders only when totalRatings > 0, and the average is formatted to one
 * decimal place. Also confirms the chip is hidden cleanly for the
 * no-rating-data shape (totalRatings === 0 or undefined props).
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {RecipeCard} from './RecipeCard';

// react-native-vector-icons doesn't render in jsdom-style test environments
// without a font file; mock it to a recognisable text node so we can assert
// presence of the icon by name without booting the native module.
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const ReactNative = require('react-native');
  const ReactRuntime = require('react');
  return ({name}: {name: string}) =>
    ReactRuntime.createElement(
      ReactNative.Text,
      {testID: `icon-${name}`},
      name,
    );
});

const baseRecipe = {
  id: 'recipe-1',
  title: 'Chicken Tikka Masala',
  description: 'A creamy tomato-based curry with tender chicken pieces.',
  cookingTime: 45,
  servings: 4,
  difficulty: 'medium',
  cuisine: 'indian',
};

describe('RecipeCard rating chip', () => {
  it('renders the rating chip when totalRatings > 0', () => {
    const {queryByTestId, getByText} = render(
      <RecipeCard
        recipe={{...baseRecipe, avgRating: 4.2, totalRatings: 37}}
        onPress={jest.fn()}
      />,
    );

    expect(queryByTestId('recipe-card-rating')).not.toBeNull();
    expect(getByText('4.2')).toBeTruthy();
    expect(getByText('(37)')).toBeTruthy();
    expect(queryByTestId('icon-star')).not.toBeNull();
  });

  it('hides the rating chip when totalRatings is 0', () => {
    const {queryByTestId} = render(
      <RecipeCard
        recipe={{...baseRecipe, avgRating: 0, totalRatings: 0}}
        onPress={jest.fn()}
      />,
    );

    expect(queryByTestId('recipe-card-rating')).toBeNull();
    expect(queryByTestId('icon-star')).toBeNull();
  });

  it('hides the rating chip when both rating props are undefined', () => {
    const {queryByTestId} = render(
      <RecipeCard recipe={baseRecipe} onPress={jest.fn()} />,
    );

    expect(queryByTestId('recipe-card-rating')).toBeNull();
    expect(queryByTestId('icon-star')).toBeNull();
  });

  it('hides the rating chip when totalRatings is undefined even if avgRating is set', () => {
    // Defensive case: a partial response shouldn't render a misleading "0 ratings"
    // chip just because avgRating happens to be defined.
    const {queryByTestId} = render(
      <RecipeCard
        recipe={{...baseRecipe, avgRating: 4.5}}
        onPress={jest.fn()}
      />,
    );

    expect(queryByTestId('recipe-card-rating')).toBeNull();
  });

  it('formats avgRating to exactly one decimal place', () => {
    const {getByText} = render(
      <RecipeCard
        recipe={{...baseRecipe, avgRating: 4.234, totalRatings: 12}}
        onPress={jest.fn()}
      />,
    );

    expect(getByText('4.2')).toBeTruthy();
  });

  it('uses singular "rating" wording when totalRatings === 1 (accessibility label)', () => {
    const {getByLabelText} = render(
      <RecipeCard
        recipe={{...baseRecipe, avgRating: 5.0, totalRatings: 1}}
        onPress={jest.fn()}
      />,
    );

    expect(
      getByLabelText('Rated 5.0 out of 5 stars from 1 rating'),
    ).toBeTruthy();
  });

  it('uses plural "ratings" wording when totalRatings > 1 (accessibility label)', () => {
    const {getByLabelText} = render(
      <RecipeCard
        recipe={{...baseRecipe, avgRating: 4.0, totalRatings: 7}}
        onPress={jest.fn()}
      />,
    );

    expect(
      getByLabelText('Rated 4.0 out of 5 stars from 7 ratings'),
    ).toBeTruthy();
  });
});

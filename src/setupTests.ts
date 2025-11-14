// @ts-ignore
import 'react-native-gesture-handler/jestSetup';

// @ts-ignore
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// @ts-ignore
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
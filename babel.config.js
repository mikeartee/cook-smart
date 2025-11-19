module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/utils': './src/utils',
          '@/types': './src/types',
          '@/hooks': './src/hooks',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
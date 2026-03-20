module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js','.android.js','.js','.ts','.tsx','.json'],
          alias: {
            '@':            './src',
            '@api':         './src/api',
            '@components':  './src/components',
            '@screens':     './src/screens',
            '@navigation':  './src/navigation',
            '@stores':      './src/stores',
            '@hooks':       './src/hooks',
            '@types':       './src/types',
            '@utils':       './src/utils',
            '@constants':   './src/constants',
            '@assets':      './src/assets',
            '@i18n':        './src/i18n',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};

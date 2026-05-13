module.exports = function (api) {
  api.cache.forever();
  
  const plugins = [];
  
  if (process.env.NODE_ENV === 'production') {
    plugins.push([
      'transform-remove-console',
      { exclude: ['error', 'warn'] },
    ]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins,
  };
};

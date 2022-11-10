const { getLoaders, loaderByName } = require("@craco/craco");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const { hasFoundAny, matches } = getLoaders(
        webpackConfig,
        loaderByName("babel-loader")
      );

      if (hasFoundAny) {
        matches.forEach((c) => {
          // Modify test to include cjs for @chainsafe/libp2p-gossipsub rpc module
          if (c.loader.test.toString().includes("mjs")) {
            if (c.loader.test.toString().includes("jsx")) {
              c.loader.test = /\.(js|cjs|mjs|jsx|ts|tsx)$/;
            } else {
              c.loader.test = /\.(js|cjs|mjs|ts)$/;
            }
          }
        });
      }

      return webpackConfig;
    },
  },
};

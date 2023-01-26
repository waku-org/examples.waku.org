const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "index.js",
  },
  experiments: {
    asyncWebAssembly: true,
  },
  mode: "development",
  plugins: [
    new CopyWebpackPlugin({
      patterns: ["index.html", "favicon.ico", "favicon.png", "manifest.json"],
    }),
  ],
};

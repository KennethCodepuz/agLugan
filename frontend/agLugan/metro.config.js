const { getDefaultConfig } = require("expo/metro-config"); // or 'metro-config' if bare RN

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath =
  require.resolve("react-native-svg-transformer");
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);
config.resolver.sourceExts.push("svg");

module.exports = config;

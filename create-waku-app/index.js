#!/usr/bin/env node
const packageJson = require("./package.json");
const semver = require("semver");

const currentNodeVersion = process.versions.node;
const supportedNodeVersion = packageJson.engines.node;

if (!semver.satisfies(currentNodeVersion, supportedNodeVersion)) {
  console.error(
    `You are running Node ${currentNodeVersion}.\n` +
    `@waku/create-app works only with ${packageJson.engines.node}.\n` +
    `Please update your version of Node.`
  );
  process.exit(1);
}

const { init } = require("./createApp");

init(packageJson.name, packageJson.description, packageJson.version);

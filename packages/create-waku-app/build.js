#!/usr/bin/env node
const path = require("path");
const fs = require("fs-extra");

const packageJson = require("./package.json");
const examplesFolder = path.resolve("./examples");

async function run() {
    fs.ensureDirSync(examplesFolder);

    const supportedExamples = Object.entries(packageJson.wakuExamples);

    console.log("Started copying supported Waku examples.");

    const copyPromises = supportedExamples.map(([name, relativePath]) => {
        const resolvedPath = path.resolve(__dirname, relativePath);
        const destinationPath = path.resolve(examplesFolder, name);
        
        return fs.copy(resolvedPath, destinationPath, { filter: nodeModulesFiler }).catch((error) => {
            console.error(`Failed to copy example ${name} to ${destinationPath} with ${error.message}`);
            throw Error(error.message);
        });
    });

    await Promise.all(copyPromises)
        .then(() => {
            console.log("Finished copying examples.");
        })
        .catch((error) => {
            console.error("Failed to copy examples due to " + error.message);
        });
}

function nodeModulesFiler(src) {
    if (src.includes("node_modules")) {
        return false;
    }

    return true;
}

run();

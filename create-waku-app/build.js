#!/usr/bin/env node
const path = require("path");
const fs = require("fs-extra");

const examplesSource = path.resolve(__dirname, "../examples");
const examplesDestination = path.resolve(__dirname, "./examples");

function run() {
    fs.ensureDirSync(examplesDestination);

    try {
        console.log("Started copying supported Waku examples.");
        fs.copySync(examplesSource, examplesDestination, { filter: nodeModulesFiler });
        console.log("Finished copying examples.");
    } catch (error) {
        console.error("Failed to copy examples due to " + error.message);
        throw Error(error.message);
    }
}

function nodeModulesFiler(src) {
    if (src.includes("node_modules")) {
        return false;
    }

    return true;
}

run();

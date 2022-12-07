const path = require("path");
const fs = require("fs-extra");
const execSync = require("child_process").execSync;

const { Command } = require("commander");
const validateProjectName = require("validate-npm-package-name");

const DEFAULT_TEMPLATE = "web-chat";
const supportedExamplesDir = path.resolve(__dirname, "./examples");

const init = (name, description, version, supportedExamples) => {
    let appName;
    const program = new Command()
        .name(name)
        .description(description)
        .version(version, "-v, --version", "output the version number")
        .arguments("<project-directory>", "Project directory to initialize Waku app")
        .action(_appName => {
            appName = _appName;
        })
        .option(
            "-t, --template <path-to-template>", 
            "specify a template for the created project"
        )
        .allowUnknownOption()
        .parse();

    const options = program.opts();
    const template = options.template || DEFAULT_TEMPLATE;

    if (!supportedExamples[template]) {
        const supportedExamplesMessage = Object.keys(supportedExamples).reduce((acc, v) => {
            acc += `\t${v}\n`;
            return acc;
        }, "");

        console.error(`Unknown template: ${template}`);
        console.error(`We support only following templates:\n${supportedExamplesMessage}`)
        process.exit(1);
    }

    createApp(appName, template);
};

function createApp(name, template) {
    const appRoot = path.resolve(name);
    const appName = path.basename(appRoot);

    const templateDir = path.resolve(supportedExamplesDir, template);

    terminateIfAppExists(appName);
    terminateIfProjectNameInvalid(appName);

    console.log(`Initializing ${appName} from ${template} template.`);

    fs.ensureDirSync(appName);
    fs.copySync(templateDir, appRoot);

    runNpmInApp(appRoot);
    runGitInit(appRoot);
}

function runNpmInApp(root) {
    const packageJsonPath = path.resolve(root, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
        return;
    }

    console.log("Installing npm packages.");
    try {
        execSync(`npm install --prefix ${root}`, { stdio: "ignore" });
        console.log("Successfully installed npm dependencies.");
    } catch (e) {
        console.warn("Failed to install npm dependencies", e);
    }
}

function runGitInit(root) {
    if (isInGitRepository()) {
        return;
    }

    console.log("Initiating git repository.");
    try {
        execSync(`git init ${root}`, { stdio: "ignore" });
        console.log("Successfully initialized git repo.");
    } catch (e) {
        console.warn("Git repo not initialized", e);
    }
}

function isInGitRepository() {
    try {
        execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
        return true;
    } catch (e) {
        return false;
    }
}

function terminateIfProjectNameInvalid(name) {
    const validationResult = validateProjectName(name);

    if (!validationResult.validForNewPackages) {
        console.error(`Cannot create a project named ${name} because of npm naming restrictions:\n`);
        [...(validationResult.errors || []), ...(validationResult.warnings || [])]
            .forEach(error => console.error(`  * ${error}`));
        console.error("\nPlease choose a different project name.");
        process.exit(1);
    }
}

function terminateIfAppExists(appRoot) {
    if (fs.existsSync(appRoot)) {
        console.error(`Cannot create a project because it already exists by the name: ${appRoot}`);
        process.exit(1);
    }
}

module.exports = { init };
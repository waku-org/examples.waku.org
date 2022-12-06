const fs = require("fs-extra");
const path = require("path");
const { Command } = require('commander');
const validateProjectName = require('validate-npm-package-name');

const supportedExamplesDir = path.resolve("./examples");

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
    const template = options.template || "web-chat";

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

    fs.copySync(templateDir, appRoot);
    // initNpmOrYarn(appRoot);
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
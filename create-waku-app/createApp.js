const path = require("path");
const fs = require("fs-extra");
const enquirer = require("enquirer");
const execSync = require("child_process").execSync;

const { Command } = require("commander");
const validateProjectName = require("validate-npm-package-name");

const DEFAULT_EXAMPLE = "light-chat";

const supportedExamplesDir = path.resolve(__dirname, "./examples");
const supportedExamples = readDirNames(supportedExamplesDir);

const init = async (name, description, version) => {
  let appName;
  let template;

  const options = new Command()
    .name(name)
    .description(description)
    .version(version, "-v, --version", "output the version number")
    .arguments(
      "<project-directory>",
      "Project directory to initialize Waku app"
    )
    .action((_appName) => {
      appName = _appName;
    })
    .option(
      "-t, --template <path-to-template>",
      "specify a template for the created project or you can use the wizard."
    )
    .allowUnknownOption()
    .parse()
    .opts();

  template = options.template;

  if (!template) {
    const templatePrompt = new enquirer.Select({
      name: "template",
      message: "Select template",
      choices: buildChoices(supportedExamples),
    });

    try {
      template = await templatePrompt.run();
    } catch (e) {
      console.error(`Failed at selecting a template: ${e.message}`);
      process.exit(1);
    }
  }

  if (!supportedExamples[template]) {
    const supportedExamplesMessage = Object.keys(supportedExamples).reduce(
      (acc, v) => {
        acc += `\t${v}\n`;
        return acc;
      },
      ""
    );

    console.error(`Unknown template: ${template}`);
    console.error(
      `We support only following templates:\n${supportedExamplesMessage}`
    );
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
    console.error(
      `Cannot create a project named ${name} because of npm naming restrictions:\n`
    );
    [
      ...(validationResult.errors || []),
      ...(validationResult.warnings || []),
    ].forEach((error) => console.error(`  * ${error}`));
    console.error("\nPlease choose a different project name.");
    process.exit(1);
  }
}

function terminateIfAppExists(appRoot) {
  if (fs.existsSync(appRoot)) {
    console.error(
      `Cannot create a project because it already exists by the name: ${appRoot}`
    );
    process.exit(1);
  }
}

function readDirNames(target) {
  return fs
    .readdirSync(target, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name)
    .reduce((acc, name) => {
      acc[name] = path.resolve(target, name);
      return acc;
    }, {});
}

function buildChoices(examples) {
  // handle a case if default example will be deleted without updating this place
  if (!examples[DEFAULT_EXAMPLE]) {
    return Object.keys(examples);
  }

  return [
    DEFAULT_EXAMPLE,
    ...Object.keys(examples).filter((v) => v !== DEFAULT_EXAMPLE),
  ];
}

module.exports = { init };

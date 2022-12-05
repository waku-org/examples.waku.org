const { Command } = require('commander');

const packageJson = require('./package.json');

let appName;

const createApp = () => {
    const program = new Command()
        .name(packageJson.name)
        .description(packageJson.description)
        .version(packageJson.version)
        .arguments("<project-directory>", "Project directory to initialize Waku app")
        .action(name => {
            appName = name;
        })
        .option(
            "-t, --template <path-to-template>", 
            "specify a template for the created project"
        )
        .allowUnknownOption()
        .parse();

    const options = program.opts();

    console.log(`Initializing ${appName} from template ${options.template || "default"}`);
};

module.exports = { createApp };
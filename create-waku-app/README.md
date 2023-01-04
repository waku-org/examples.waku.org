## @waku/create-app

This package is here to help you bootstrap your next Waku dapp.

Usage:
- `yarn create @waku/app [options] <project-dir>`
- `npx @waku/create-app [options] <project-dir>`

For options you can specify template from which to initialize your app. Template correlates directly to the name of example you can see in this repository.

#### How to add support for new example:
Extend `wakuExamples` property defined in `package.json` in this package with the name of the example and relative path to it where folder of the example should be the same as it's name.
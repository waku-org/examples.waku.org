function readPackage(pkg) {
    // Freeze webpack transient dependency
    if (pkg.dependencies.webpack) {
        pkg.dependencies.webpack = '5.65.0';
    }

    return pkg
}

module.exports = {
    hooks: {
        readPackage
    }
}

const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const path = require("path");

module.exports = function webpackConfigOverrides(p = {}) {

    const {
        config = [],
        options,
    } = p;

    const {
        paths
    } = options;

    const {
        rootPath,
        buildToolsPath
    } = paths;

    const serverConfig = config[0];
    const clientConfig = config[1];

    try {
        serverConfig.externals = [
            "./chunk-manifest.json",
            "./asset-manifest.json",
            nodeExternals({
                    modulesFromFile: true,
                    additionalModuleDirs: [
                        path.resolve(buildToolsPath, "../"),
                        path.resolve(buildToolsPath, "../../src"),
                        path.resolve(rootPath, "node_modules")
                    ],
                    allowlist: [
                        /^three\/examples\/jsm/,
                    ]
                }
            ),
        ];
        serverConfig.module.rules[2].include = [
            ...serverConfig.module.rules[2].include,
            path.resolve(rootPath, "node_modules", "three/examples/jsm/")
        ];
        clientConfig.resolve = {
            ...clientConfig.resolve,
            fallback: {
                "path": require.resolve("path-browserify"),
                "fs": false
            }
        }
    } catch (e){
        console.log(e)
    }

    const newConfig = [
        serverConfig,
        clientConfig
    ];

    let newCompiler;
    try {
        newCompiler = webpack(newConfig);
    } catch (e){
        console.log(e)
    }

    console.log("[WEBPACK] config changed...");

    // noinspection WebpackConfigHighlighting
    return {
        compiler: newCompiler,
        config: newConfig
    }


}

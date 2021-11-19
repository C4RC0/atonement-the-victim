import wapplrClient from "wapplr";
import wapplrPwa from "wapplr-pwa";
import wapplrReact from "wapplr-react";

import setContents from "../common/setContents";

import {getConfig as getCommonConfig} from "../common/config";

export function getConfig(p = {}) {

    const {config = {}} = p;

    const clientConfig = config.client || {};
    const commonConfig = getCommonConfig(p).config;

    const common = {...commonConfig.common};

    const client = {
        ...clientConfig,
    };

    return {
        config: {
            ...config,
            common: common,
            client: client,
        },
    }

}

export default async function createClient(p) {

    const {config} = getConfig(p);
    const wapp = p.wapp || wapplrClient({...p, config});

    await wapplrPwa({wapp});
    wapplrReact({wapp});

    setContents({wapp});

    return wapp;
}

export async function createMiddleware(p = {}) {
    // eslint-disable-next-line no-unused-vars
    // noinspection JSUnusedLocalSymbols
    const wapp = p.wapp || await createClient(p);
    return [
        function middleware(req, res, next) {
            next()
        }
    ]

}

const defaultConfig = {
    config: {
        globals: {
            DEV: (typeof DEV !== "undefined") ? DEV : undefined,
            WAPP: (typeof WAPP !== "undefined") ? WAPP : undefined,
            RUN: (typeof RUN !== "undefined") ? RUN : undefined,
            TYPE: (typeof TYPE !== "undefined") ? TYPE : undefined,
            ROOT: (typeof ROOT !== "undefined") ? ROOT : "/",
            NAME: (typeof NAME !== "undefined") ? NAME : undefined,
        }
    }
};

export async function run(p = defaultConfig) {

    if (p?.config?.globals && !p.config.globals.RUN){
        p.config.globals.RUN = p.config?.globals.NAME || "atonement-the-victim"
    }

    const {config} = getConfig(p);
    const wapp = await createClient({...p, config });

    const globals = wapp.globals;
    const {DEV} = globals;

    const app = wapp.client.app;
    app.use(await createMiddleware({wapp, ...p}));
    wapp.client.listen();

    if (typeof DEV !== "undefined" && DEV && module.hot){
        app.hot = module.hot;
        module.hot.accept();
    }

    return wapp;
}

if (typeof RUN !== "undefined" && RUN === "atonement-the-victim") {
    run();
}

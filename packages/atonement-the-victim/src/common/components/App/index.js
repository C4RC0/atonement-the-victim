import React, {useContext, useState, useEffect, useRef} from "react";
import getUtils from "wapplr-react/dist/common/Wapp/getUtils";
import {WappContext} from "wapplr-react/dist/common/Wapp";

import {withMaterialTheme} from "../Template/withMaterial";
import Template from "../Template";
import {materialTheme, materialMediaQuery} from "../Template/materialTheme";

import messages from "../../config/constants/messages";
import labels from "../../config/constants/labels";
import titles from "../../config/constants/titles";
import routes from "../../config/constants/routes";
import menus from "../../config/constants/menus";

import NotFound from "../NotFound";
import Concept from "../Concept";
import Canvas from "../Canvas";
import Video from "../Video";

import AppContext from "./context";

import style from "./style.css";
import getMenu from "./menu";
import getTopMenu from "./topMenu";

let ThemedTemplate;

export default function App(props) {

    const context = useContext(WappContext);

    const {wapp, res} = context;
    const utils = getUtils(context);
    const {subscribe} = props;

    if (!ThemedTemplate){
        ThemedTemplate = withMaterialTheme({theme: materialTheme, mediaQuery: materialMediaQuery, classNamePrefix: wapp.globals.WAPP}, Template);
    }

    wapp.styles.use(style);

    const container = useRef();

    const [url, setUrl] = useState(utils.getRequestUrl());
    const [position] = useState(wapp.globals.NAME === wapp.globals.RUN ? "fixed" : "sticky");
    const [fullscreen] = useState(wapp.globals.NAME === wapp.globals.RUN);

    useEffect(function (){

        function onLocationChange(newUrl){
            if (url !== newUrl){
                setUrl(newUrl);
            }
        }

        const unsub = subscribe.locationChange(onLocationChange);
        return function useUnsubscribe(){
            unsub();
        }
    }, [subscribe, url]);

    const route = res.wappResponse.route;
    const requestPath = route.requestPath;

    const template = {};

    const appContext = {messages, labels, titles, routes, menus, template};

    const canvas = (requestPath.startsWith(routes.canvasRoute) || requestPath === "/");
    const video = (requestPath.startsWith(routes.videoRoute) || requestPath.startsWith(routes.recordRoute));

    return (
        <AppContext.Provider value={appContext}>
            <div
                ref={container}
                className={style.app}
            >
                <ThemedTemplate
                    position={position}
                    fullscreen={fullscreen}
                    getMenu={getMenu}
                    getTopMenu={getTopMenu}
                    effect={(p)=>{template.actions = p?.actions}}
                    transparentAppBar={canvas}
                    pageContentNoPadding={canvas}
                    disableFooter={canvas}
                    Logo={null}
                >
                    {
                          canvas ?
                              <Canvas />
                                  :
                            (requestPath === routes.conceptRoute) ?
                              <Concept /> :
                                (video) ?
                                    <Video /> :
                              <NotFound disableLoginButtons={true} />
                    }
                </ThemedTemplate>
            </div>
        </AppContext.Provider>
    );
}

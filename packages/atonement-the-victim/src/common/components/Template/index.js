import React, {useContext, useEffect, useState, useRef} from "react";
import {WappContext, withWapp} from "wapplr-react/dist/common/Wapp";
import getUtils from "wapplr-react/dist/common/Wapp/getUtils";
import Log from "wapplr-react/dist/common/Log";
import DefaultLogo from "wapplr-react/dist/common/Logo";

import clsx from "clsx";

import MaterialDrawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";

import MenuIcon from "@material-ui/icons/Menu";
import CloseIcon from '@material-ui/icons/Close';

import {storage as defaultStorage} from "../../utils/localStorage";

import AppContext from "../App/context";
import Menu from "../Menu";

import {withMaterialTheme, withMaterialStyles} from "./withMaterial";
import {materialTheme, materialMediaQuery} from "./materialTheme";

import defaultStyle from "./style.css";
import materialStyle from "./materialStyle";

const containers = {};

function Template(props) {

    const {

        /*style*/
        style = defaultStyle,
        materialStyle,
        position = "relative",
        fullscreen,
        breakPoint = 960,
        transparentAppBar = false,
        pageContentNoPadding = false,
        disableFooter = false,

        /*content*/
        title = "",
        children,
        Logo = DefaultLogo,
        logoHref = "/",
        FooterLogo,
        getMenu = function () {return []},
        getTopMenu = function () {return []},
        menuProps = {},
        topMenuProps = {},

        /*utils*/
        subscribe,

    } = props;

    const appBarPosition = position;
    const fixedDrawer = (appBarPosition === "fixed");

    //const materialTheme = useTheme();

    const context = useContext(WappContext);
    const appContext = useContext(AppContext);
    const utils = getUtils(context);

    const {wapp} = context;
    const {siteName = "Wapplr"} = wapp.config;
    const copyright = `${siteName} ${new Date().getFullYear()} ©`;

    wapp.styles.use(style);

    const {
        storage = function storage(data) {
            return defaultStorage(data, wapp.globals.NAME);
        }
    } = appContext;

    const container = useRef();
    if (!containers[wapp.globals.WAPP]){
        containers[wapp.globals.WAPP] = {};
    }

    const initialState = (typeof window !== "undefined" && window[wapp.config.appStateName]) || {req:{timestamp: Date.now()}};
    const firstRender = (utils.getGlobalState().req.timestamp === initialState.req.timestamp || wapp.target === "node");

    const [open, _setOpen] = useState((firstRender) ? false : storage().drawerOpen);
    const [sticky, _setSticky] = useState(false);
    const [narrow, _setNarrow] = useState((!firstRender && typeof window !== "undefined" && containers[wapp.globals.WAPP].current) ? containers[wapp.globals.WAPP].current.offsetWidth < breakPoint : false);
    const [user, setUser] = useState(utils.getRequestUser());

    async function handleDrawerClose() {
        if (open) {
            storage({drawerOpen: false});
            await _setOpen(false);
        }
    }

    async function handleDrawerToggle() {
        storage({drawerOpen: !open});
        await _setOpen(!open);
    }

    function onClick(e, {href}) {
        if (href) {
            wapp.client.history.push({
                search: "",
                hash: "",
                ...wapp.client.history.parsePath(href)
            });
        }
        e.preventDefault();
    }

    function onUserChange(user){
        setUser((user?._id) ? user : null);
    }

    useEffect(function didMount(){

        function setOpen(value){
            if (open !== value){
                _setOpen(value)
            }
        }

        function setSticky(value){
            if (sticky !== value){
                _setSticky(value)
            }
        }

        function setNarrow(value){
            if (narrow !== value){
                _setNarrow(value)
            }
        }

        function onScroll() {
            if (appBarPosition === "sticky") {
                if (container.current) {
                    if (container.current.scrollTop > 0) {
                        setSticky(true);
                    } else {
                        setSticky(false);
                    }
                }
            } else if (appBarPosition === "fixed") {
                if (window.scrollY > 0) {
                    setSticky(true);
                } else {
                    setSticky(false);
                }
            } else {
                setSticky(false);
            }
        }

        function onResize() {
            if (container.current) {
                if (container.current.offsetWidth > breakPoint) {
                    setNarrow(false);
                } else {
                    setNarrow(true);
                }
            } else {
                if (window.innerWidth > breakPoint) {
                    setNarrow(false);
                } else {
                    setNarrow(true);
                }
            }
        }

        function addScrollListeners() {
            if (appBarPosition === "sticky") {
                if (container.current) {
                    container.current.addEventListener("scroll", onScroll);
                    return function removeEventListener(){
                        if (container.current) {
                            container.current.removeEventListener("scroll", onScroll);
                        }
                    }
                }
            } else if (appBarPosition === "fixed") {
                window.addEventListener("scroll", onScroll);
                return function removeEventListener(){
                    window.removeEventListener("scroll", onScroll);
                }
            } else {
                return function removeEventListener(){}
            }
        }

        function addResizeListeners() {
            if (container.current && typeof ResizeObserver !== "undefined") {
                const resizeObserver = new ResizeObserver((entries) => {
                    onResize(entries);
                });
                resizeObserver.observe(container.current);
                return function removeEventListener(){
                    resizeObserver.disconnect();
                }
            } else {
                window.addEventListener("resize", onResize);
                return function removeEventListener(){
                    window.removeEventListener("resize", onResize);
                }
            }
        }

        const removeScrollListeners = addScrollListeners();
        const removeResizeListeners = addResizeListeners();
        const unsub = subscribe.userChange(onUserChange);

        const storageDrawerOpen = storage().drawerOpen;
        if (typeof storageDrawerOpen == "boolean" && open !== storageDrawerOpen){
            setOpen(storageDrawerOpen);
        }

        onResize();
        onScroll();

        containers[wapp.globals.WAPP].current = container.current;

        if (props.effect){
            props.effect({
                actions: {
                    scrollTop: async function () {
                        if (appBarPosition === "sticky") {
                            if (container.current) {
                                container.current.scrollTop = 0;
                                await new Promise(resolve => setTimeout(resolve, 1));
                            }
                        } else if (appBarPosition === "fixed") {
                            window.scrollTo(0,0);
                            await new Promise(resolve => setTimeout(resolve, 1));
                        }
                    },
                    getState: function () {
                        return {open, sticky, narrow}
                    },
                    getStyle: function (){
                        return style || {}
                    }
                }
            })
        }

        return function willUnmount() {
            removeScrollListeners();
            removeResizeListeners();
            unsub();

            if (props.effect){
                props.effect(null)
            }

        }

    }, [user, open, sticky, narrow, subscribe, appBarPosition, breakPoint, storage, wapp.globals.WAPP]);

    const menu = getMenu({appContext, context});
    const topMenu = getTopMenu({appContext, context});

    const reallyDoesOpen = !!(open && menu?.length);

    return (
        <div
            ref={container}
            className={
                clsx(
                    materialStyle.root,
                    style.root,
                    {[style.fullscreen]: fullscreen},
                    {[style.narrow]: narrow},
                    {[style.drawerOpen] : reallyDoesOpen},
                    {[style.transparentAppBar] : transparentAppBar},
                )
            }>
            <AppBar
                position={appBarPosition}
                className={
                    clsx(
                        materialStyle.appBar,
                        style.appBar,
                        {[style.appBarPositionSticky]: appBarPosition === "sticky"},
                        {[materialStyle.appBarSticky]: sticky},
                        {[style.appBarSticky]: sticky},
                    )}
            >
                <Toolbar className={style.toolbar}>
                    {(menu?.length) ?
                        <IconButton
                            color={"inherit"}
                            aria-label={"open drawer"}
                            onClick={handleDrawerToggle}
                            className={clsx(materialStyle.menuButton, style.menuButton)}
                        >
                            {(reallyDoesOpen) ? <CloseIcon/> : <MenuIcon/>}
                        </IconButton>
                        :
                        null
                    }
                    {
                        (Logo) ?
                            <div
                                className={clsx(
                                    style.logo,
                                    {[style.cursorPointer] : logoHref}
                                )}
                                onClick={(e) => onClick(e, {href: logoHref})}
                            >
                                <Logo />
                            </div>
                            : null
                    }
                    {
                        (title) ?
                            <div
                                className={clsx(
                                    style.title,
                                    {[style.cursorPointer] : logoHref}
                                )}
                                onClick={(e) => onClick(e, {href: logoHref})}
                            >
                                <Typography variant={"h6"} noWrap>
                                    {title}
                                </Typography>
                            </div>
                            :
                            <div
                                className={clsx(
                                    style.title,
                                    {[style.cursorPointer] : logoHref}
                                )}
                                onClick={(e) => onClick(e, {href: logoHref})}
                            />
                    }
                    {
                        (topMenu?.length) ?
                            <div className={style.topMenu}>
                                <Menu
                                    menu={topMenu}
                                    menuProperties={{user, drawerClose: handleDrawerClose, open:reallyDoesOpen, narrow}}
                                    {...topMenuProps}
                                />
                            </div>
                            : null
                    }
                </Toolbar>
            </AppBar>
            <div className={style.mainContainer}>
                <MaterialDrawer
                    variant={"permanent"}
                    style={{marginLeft: reallyDoesOpen ? "0px" : "-320px"}}
                    className={clsx(
                        style.drawer,
                        {
                            [style.drawerNarrow]: narrow,
                            [style.drawerFixed]: fixedDrawer,
                            [materialStyle.drawerOpen]: reallyDoesOpen,
                            [materialStyle.drawerClose]: !reallyDoesOpen,
                            [style.drawerOpen]: reallyDoesOpen,
                            [style.drawerClose]: !reallyDoesOpen,
                        },
                    )}
                    classes={{
                        paper: clsx(
                            style.drawerPaper,
                            {
                                [style.drawerPaperFixed]: fixedDrawer,
                                [style.drawerPaperAbsoluteWithStickyAppBar]: !fixedDrawer && appBarPosition === "sticky",
                                [materialStyle.drawerOpen]: reallyDoesOpen,
                                [materialStyle.drawerClose]: !reallyDoesOpen,
                                [style.drawerOpen]: reallyDoesOpen,
                                [style.drawerClose]: !reallyDoesOpen,
                            }
                        )
                    }}
                    open={reallyDoesOpen}
                    PaperProps={{
                        style:{marginLeft: reallyDoesOpen ? "0px" : "-320px"}
                    }}
                    ModalProps={{
                        keepMounted: true,
                    }}
                >
                    <div className={materialStyle.drawerContainer}>
                        <Divider />
                        {
                            (menu && menu.length) ?
                                <Menu
                                    menu={menu}
                                    menuProperties={{user, drawerClose: handleDrawerClose, open:reallyDoesOpen, narrow}}
                                    list={true}
                                    {...menuProps}
                                />
                                : null
                        }
                    </div>
                </MaterialDrawer>
                <main className={clsx(
                    style.content,
                    {[style.narrowAndOpen]: narrow && reallyDoesOpen}
                )}>
                    <div
                        className={
                            clsx(
                                materialStyle.drawerLayer,
                                style.drawerLayer,
                                {[style.drawerLayerShow]: narrow && reallyDoesOpen}
                            )
                        }
                        onClick={handleDrawerClose}
                    />
                    <div className={style.page}>
                        {(appBarPosition === "fixed" && fixedDrawer) ? <div className={style.pagePaddingTop} /> : null}
                        <div className={clsx(
                            style.pageContent,
                            {[style.pageContentNoPadding] : pageContentNoPadding},
                        )} >
                            {children}
                        </div>
                    </div>
                    {(!disableFooter) ?
                        <footer className={style.footer}>
                            <div className={style.footerOneColumn}>
                                {FooterLogo ?
                                    <div className={style.footerLogo}>
                                        <FooterLogo/>
                                    </div>
                                    :
                                    null
                                }
                                <div className={style.copyright}>
                                    {copyright}
                                </div>
                                {(wapp.globals.DEV) ?
                                    <div className={style.log}>
                                        <Log Parent={null} Logo={null}/>
                                    </div> : null
                                }
                            </div>
                        </footer>
                        :
                        null
                    }
                </main>
            </div>
        </div>
    )
}

const WappComponent = withWapp(Template);

const StyledComponent = withMaterialStyles(materialStyle, WappComponent);

export default StyledComponent;

export const ThemedComponent = withMaterialTheme({theme: materialTheme, mediaQuery: materialMediaQuery}, StyledComponent);

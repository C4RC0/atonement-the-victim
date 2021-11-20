import React, {PureComponent, useContext, createContext} from "react";
import { ServerStyleSheets, withStyles, StylesProvider, createGenerateClassName } from "@material-ui/styles";
import { createTheme as createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import StyledEngineProvider from "@material-ui/core/StyledEngineProvider";

import {WappContext} from "wapplr-react/dist/common/Wapp";

const generateClassNameFunctions = {};

export const MaterialStylesContext = createContext({generateClassName: null, classNamePrefix: null});

export function withMaterialTheme(options = {}, ComposedComponent) {

    class WithMaterialTheme extends PureComponent {
        constructor(props, context) {

            super(props, context);
            const {wapp} = this.context;

            const mediaQuery = this.getMediaQueries(options.mediaQuery);

            this.theme = this.getTheme({theme: options.theme, mediaQuery});

            const classNamePrefix = options.classNamePrefix || wapp.globals.WAPP;
            this.classNamePrefix = classNamePrefix;

            if (!generateClassNameFunctions[classNamePrefix] || wapp.target === "node") {
                const _generateClassName = createGenerateClassName({
                    seed: classNamePrefix,
                    productionPrefix: classNamePrefix
                });
                generateClassNameFunctions[classNamePrefix] = function (...attributes) {
                    return _generateClassName(...attributes);
                }
            }

            const generateClassName = generateClassNameFunctions[classNamePrefix];
            this.generateClassName = generateClassName;

            this.sheets = new ServerStyleSheets({serverGenerateClassName: generateClassName});

            if (wapp.target === "node"){
                this.addStyle();
            }

            this.state = {
                mediaQuery
            }

        }
        mediaQueryListener = (e) => {
            if (e.type === "change") {
                const media = e.media;
                const prevState = this.state.mediaQuery;
                const mediaQuery = {
                    ...prevState,
                    [media]: e.matches
                };
                this.theme = this.getTheme({theme: options.theme, mediaQuery});
                this.setState(mediaQuery);
            }
        };
        getMediaQueries(queries) {
            const mediaQueryListener = this.mediaQueryListener;
            const mediaQuery = {};
            const shouldRemoveListenersForMedia = this.shouldRemoveListenersForMedia || {};
            queries.forEach(function(query) {
                const key = query;
                const mediaQueryList = (typeof window !== "undefined") ? window.matchMedia(query) : false;
                if (mediaQueryList && typeof mediaQueryList.addEventListener !== "undefined"){
                    if (shouldRemoveListenersForMedia[key]){
                        shouldRemoveListenersForMedia[key]();
                        delete shouldRemoveListenersForMedia[key];
                    }
                    mediaQueryList.addEventListener("change", mediaQueryListener);
                    shouldRemoveListenersForMedia[key] = function removeMediaListener() {
                        mediaQueryList.removeEventListener("change", mediaQueryListener)
                    }
                }
                mediaQuery[key] = mediaQueryList;
                if (mediaQuery[key] && typeof mediaQuery[key].matches !== "undefined"){
                    mediaQuery[key] = mediaQuery[key].matches;
                }
            });
            this.shouldRemoveListenersForMedia = shouldRemoveListenersForMedia;
            return mediaQuery;
        }
        componentWillUnmount() {
            const shouldRemoveListenersForMedia = this.shouldRemoveListenersForMedia || {};
            Object.keys(shouldRemoveListenersForMedia).forEach(function (key) {
                shouldRemoveListenersForMedia[key]();
            })
        }
        getTheme = ({theme, ...props}) => {
            return createMuiTheme(
                (typeof options.theme == "function") ?
                    options.theme(props) :
                    options.theme
            );
        };
        createCssModule() {
            const sheets = this.sheets;
            return {
                _module: {
                    id: "./src/common/components/Template/materialStyle.css"
                },
                _getCss: function () {
                    return sheets.toString();
                }
            }
        }
        addStyle() {
            const {wapp} = this.context;
            const module = this.createCssModule();
            wapp.styles.add(module);
        }
        render() {

            const {wapp} = this.context;

            if (wapp.target === "node"){

                return this.sheets.collect(
                    <ThemeProvider theme={this.theme}>
                        <MaterialStylesContext.Provider value={{generateClassName: this.generateClassName, classNamePrefix: this.classNamePrefix}}>
                            <StylesProvider generateClassName={this.generateClassName}>
                                <StyledEngineProvider generateClassName={this.generateClassName}>
                                    <ComposedComponent {...this.props} />
                                </StyledEngineProvider>
                            </StylesProvider>
                        </MaterialStylesContext.Provider>
                    </ThemeProvider>
                )

            }

            return (
                <ThemeProvider theme={this.theme}>
                    <MaterialStylesContext.Provider value={{generateClassName: this.generateClassName, classNamePrefix: this.classNamePrefix}}>
                        <StylesProvider generateClassName={this.generateClassName}>
                            <StyledEngineProvider generateClassName={this.generateClassName}>
                                <ComposedComponent {...this.props} />
                            </StyledEngineProvider>
                        </StylesProvider>
                    </MaterialStylesContext.Provider>
                </ThemeProvider>
            )

        }
    }

    const displayName = ComposedComponent.displayName || ComposedComponent.name || "Component";

    WithMaterialTheme.displayName = `WithMaterialTheme(${displayName})`;
    WithMaterialTheme.contextType = WappContext;
    WithMaterialTheme.ComposedComponent = ComposedComponent;

    return WithMaterialTheme;

}

export function withMaterialStyles(styles = {}, ComposedComponent) {

    class WithMaterialStyles extends PureComponent {
        render() {
            const {classes, forwardedRef, ...rest} = this.props;
            return <ComposedComponent {...rest} ref={forwardedRef} materialStyle={classes} />
        }
    }

    const displayName = ComposedComponent.displayName || ComposedComponent.name || "Component";

    WithMaterialStyles.displayName = `WithMaterialStyles(${displayName})`;
    WithMaterialStyles.contextType = WappContext;
    WithMaterialStyles.ComposedComponent = ComposedComponent;

    return React.forwardRef((props, ref) => {
        const {generateClassName, classNamePrefix = "default"} = useContext(MaterialStylesContext);
        WithMaterialStyles.StyledComponent = withStyles(styles, {generateClassName: generateClassName || generateClassNameFunctions[classNamePrefix]})(WithMaterialStyles);
        const StyledComponent = WithMaterialStyles.StyledComponent;
        return <StyledComponent {...props} forwardedRef={ref} />;
    });

}

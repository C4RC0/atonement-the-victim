import React, {useContext, useState, useEffect} from "react";

import {WappContext, withWapp} from "wapplr-react/dist/common/Wapp";
import getUtils from "wapplr-react/dist/common/Wapp/getUtils";

import AppContext from "../App/context";
import {withMaterialStyles} from "../Template/withMaterial";

import style from "./style.css";
import materialStyle from "./materialStyle";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import clsx from "clsx";

function NotFound(props) {

    const appContext = useContext(AppContext);
    const context = useContext(WappContext);
    const utils = getUtils(context);
    const {subscribe, materialStyle, disableLoginButtons} = props;
    const {wapp, res} = context;

    const {redirect = res.wappResponse.route.requestPath} = props;

    wapp.styles.use(style);

    const [user, setUser] = useState(utils.getRequestUser());

    function onUserChange(user){
        setUser((user?._id) ? user : null);
    }

    useEffect(function (){
        const unsub = subscribe.userChange(onUserChange);
        return function useUnsubscribe(){
            unsub();
        }
    }, [user]);

    function onClick(e, {action}) {

        let pathname = "";

        if (action === "back"){
            return wapp.client.history.go(-1);
        }

        if (action === "home"){
            pathname = "/"
        }

        if (action === "login"){
            pathname = (redirect) ? appContext.routes.accountRoute+"/login?redirect="+redirect : appContext.routes.accountRoute+"/login"
        }

        if (action === "signup"){
            pathname = (redirect) ? appContext.routes.accountRoute+"/signup?redirect="+redirect : appContext.routes.accountRoute+"/login"
        }

        wapp.client.history.push({
            search:"",
            hash:"",
            ...wapp.client.history.parsePath(pathname)
        });

        e.preventDefault();

    }

    return (
        <div className={clsx(materialStyle.root, style.notFound)}>
            <Container fixed className={style.container} maxWidth={"lg"}>
                <Paper elevation={3}>
                    <AppBar position={"relative"} className={style.appBar}>
                        <Toolbar>
                            <div className={style.titleContainer}>
                                <div className={style.title}>
                                    <Typography variant={"h6"} className={style.title}>
                                        {appContext.messages.notFoundNotAvailable}
                                    </Typography>
                                </div>
                                {(!user && !disableLoginButtons) ?
                                    <div className={style.subtitle}>
                                        <Typography
                                            variant={"subtitle1"}
                                            color={"textSecondary"}
                                            className={style.subtitle}
                                        >
                                            {appContext.messages.notFoundLoginText}
                                        </Typography>
                                    </div>
                                    :
                                    null
                                }
                            </div>
                        </Toolbar>
                    </AppBar>
                    <div className={clsx(materialStyle.content, style.content)}>
                        <Button
                            variant={"contained"}
                            color={"secondary"}
                            onClick={function (e) {
                                onClick(e, {action:"back"})
                            }}
                        >
                            {appContext.labels.notFoundButtonBack}
                        </Button>
                        <Button
                            variant={"contained"}
                            color={"secondary"}
                            onClick={function (e) {
                                onClick(e, {action:"home"})
                            }}
                        >
                            {appContext.labels.notFoundButtonHome}
                        </Button>
                        {(!user && !disableLoginButtons) ?
                            <>
                                <Button
                                    variant={"contained"}
                                    color={"secondary"}
                                    onClick={function (e) {
                                        onClick(e, {action:"login"})
                                    }}
                                >
                                    {appContext.labels.notFoundButtonLogin}
                                </Button>
                                <Button
                                    variant={"contained"}
                                    color={"secondary"}
                                    onClick={function (e) {
                                        onClick(e, {action:"signup"})
                                    }}
                                >
                                    {appContext.labels.notFoundButtonSignup}
                                </Button>
                            </>
                            :
                            null
                        }
                    </div>
                </Paper>
            </Container>
        </div>
    )
}

const WappComponent = withWapp(NotFound);

export default withMaterialStyles(materialStyle, WappComponent);

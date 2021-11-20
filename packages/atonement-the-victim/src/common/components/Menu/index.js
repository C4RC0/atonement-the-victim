import React, {useContext, useState, useEffect} from "react";

import {WappContext} from "wapplr-react/dist/common/Wapp";

import IconButton from "@material-ui/core/IconButton";
import MaterialMoreIcon from "@material-ui/icons/MoreVert";
import MaterialMenu from "@material-ui/core/Menu";
import List from "@material-ui/core/List";
import MenuItem from "@material-ui/core/MenuItem";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import Collapse from "@material-ui/core/Collapse";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";

import style from "./style.css";
import materialStyle from "./materialStyle"
import {withMaterialStyles} from "../Template/withMaterial";
import clsx from "clsx";
import AppContext from "../App/context";

function GenerateMenuFunc(props) {

    const appContext = useContext(AppContext);
    const {storage} = appContext;
    const {menu, ...rest} = props;
    const {ItemComponent, menuComponentProps, parentRoute, menuProperties, onClick, style, materialStyle, menuKey = "menu_0"} = rest;

    const [open, _setOpen] = useState((storage) ? storage()[menuKey] : false);

    async function setOpen(value) {
        if (value !== open) {
            if (storage) {
                storage({[menuKey]: value});
            }
            await _setOpen(value);
        }
    }

    if (menu.divider){
        return (
            <Divider/>
        )
    }

    const name = (typeof menu.name == "function") ? menu.name(menuProperties) : menu.name;
    const target = menu.target || "self";
    const href = (typeof menu.href == "function") ? menu.href(menuProperties) : menu.href;
    const Icon = menu.Icon;
    const show = (menu.role) ? menu.role(menuProperties) : true;
    const inner = !(target === "_blank" || (href && href.slice(0,7) === "http://") || (href && href.slice(0,8) === "https://"));
    const paddingLeft = menu.paddingLeft;
    const className = (typeof menu.className == "function") ? menu.className({...menuProperties, style}) : menu.className;

    if (show) {

        return (
            <>
                <ItemComponent
                    ref={props.forwardedRef}
                    button
                    component={"a"}
                    target={target}
                    href={(inner) ? parentRoute + href : href}
                    onClick={async function (e) {
                        if (menu.items?.length){
                            e.preventDefault();
                            await setOpen(!open);
                            return;
                        }
                        await onClick(e, menu)
                    }}
                    className={clsx(materialStyle.listItem, {[className]: className})}
                    {...(paddingLeft) ? {sx:{pl: paddingLeft}} : {}}
                >
                    {(Icon) ?
                        <ListItemIcon className={materialStyle.listItemIcon}>
                            <Icon/>
                        </ListItemIcon> : null
                    }
                    <ListItemText className={(menu.items?.length) ? style.collapseButtonLabel : null} primary={name}/>
                    {(menu.items?.length) ?
                        <ListItemSecondaryAction className={style.collapseIcon}>
                            <IconButton edge={"end"} aria-label={"open"} onClick={()=>setOpen(!open)}>
                                {(open) ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </ListItemSecondaryAction>
                        : null
                    }
                </ItemComponent>
                {(menu.items?.length) ?
                    <Collapse in={open}  className={style.collapseContainer}>
                        <div className={style.collapse}>
                            <List {...menuComponentProps} {...{sx: { pl: (paddingLeft) ? paddingLeft : 0}, component:"div",  disablePadding:true}} >
                                {[...menu.items.map((m, k)=><GenerateMenu menu={m} key={"menu_collapse_item_" + k} {...rest} menuKey={menuKey+k}/>)]}
                            </List>
                        </div>
                    </Collapse>
                    :
                    null
                }
            </>
        )

    }

    return null;

}

const GenerateMenu = React.forwardRef((props, ref) => {
    return <GenerateMenuFunc {...props} forwardedRef={ref} />;
});

function Menu(props) {

    const context = useContext(WappContext);
    const appContext = useContext(AppContext);

    const {wapp} = context;
    const {template} = appContext;

    wapp.styles.use(style);

    const {
        parentRoute = "",
        materialStyle = {},
        list,
        effect,
        menuKey = "menu",
        MoreIcon = MaterialMoreIcon
    } = props;

    const menuProperties = {...(props.menuProperties) ? props.menuProperties : {}, appContext, context};

    const [anchorEl, setAnchorEl] = useState(null);
    const [menu, setMenu] = useState(props.menu || []);

    function handleMenuOpen (event) {
        setAnchorEl(event.currentTarget);
    }

    function handleMenuClose () {
        setAnchorEl(null);
    }

    async function onClick(e, menu) {

        const target = menu.target || "self";
        const href = (typeof menu.href == "function") ? menu.href(menuProperties) : menu.href;
        const disableParentRoute = menu.disableParentRoute;
        const inner = !(target === "_blank" || (href && href.slice(0,7) === "http://") || (href && href.slice(0,8) === "https://"));

        if (inner) {
            e.preventDefault();
        }

        if (menu.onClickBefore){
            await menu.onClickBefore(menuProperties);
        }

        if (menu.onClick){
            if (anchorEl !== null) {
                await setAnchorEl(null);
            }
            return menu.onClick(e, menuProperties);
        }

        if (inner){

            wapp.client.history.push({
                search:"",
                hash:"",
                ...wapp.client.history.parsePath((disableParentRoute) ? href : parentRoute + href)
            });

            if (template?.actions){
                template.actions.scrollTop();
            }

            if (anchorEl !== null) {
                setAnchorEl(null);
            }

        }
    }

    const actions = {
        close: handleMenuClose,
        setMenu: setMenu
    };

    useEffect(function () {
        if (effect){
            effect({
                actions
            })
        }
    });

    const featuredMenus = [...menu.filter(function (menu) {return !!(menu.featured && !list)})];
    const showFeaturedMenu = [...featuredMenus.filter(function (menu) {return (menu.role) ? menu.role(menuProperties) : true})];

    const moreMenus = [...menu.filter(function (menu) {return !(menu.featured && !list)})];
    const showMoreMenu = [...moreMenus.filter(function (menu) {return (menu.role) ? menu.role(menuProperties) : true})];

    const MenuComponent = (list) ? List : MaterialMenu;
    const ItemComponent = (list) ? ListItem : MenuItem;
    const menuComponentProps = (list) ? {} : {
        anchorEl,
        keepMounted: true,
        open:Boolean(anchorEl),
        onClose:handleMenuClose
    };

    const generateMenuProps = {ItemComponent, menuComponentProps, parentRoute, menuProperties, onClick, style, materialStyle};

    return (
        <>  {
            (showFeaturedMenu.length) ?
                [...featuredMenus.map(function (menu, key) {
                    const target = menu.target || "self";
                    const href = (typeof menu.href == "function") ? menu.href(menuProperties) : menu.href;
                    const Icon = menu.Icon;
                    const show = (menu.role) ? menu.role(menuProperties) : true;
                    const inner = !(target === "_blank" || (href && href.slice(0,7) === "http://") || (href && href.slice(0,8) === "https://"));
                    const Element = menu.Element;

                    if (show) {

                        if (Element){
                            return (
                                <Element key={"featured"+key} />
                            )
                        }

                        return (
                            <IconButton
                                key={"featured"+key}
                                component={"a"}
                                color={"inherit"}
                                onClick={async function (e) {await onClick(e, menu);}}
                                href={(inner) ? parentRoute + href : href}
                            >
                                {(Icon) ? <Icon/> : null}
                            </IconButton>
                        )
                    }

                    return null;
                })]
                :
                null
        }
            {
                (showMoreMenu.length > 0) ?
                    <>
                        {(!list) ?
                            <IconButton
                                className={style.menu}
                                color={"inherit"}
                                onClick={handleMenuOpen}
                                aria-controls={"post-menu"}
                                aria-haspopup={"true"}
                                aria-label={"post-menu"}
                            >
                                <MoreIcon />
                            </IconButton>
                            : null
                        }
                        <MenuComponent
                            className={clsx(materialStyle.menu, style.menu)}
                            id={"post-menu"}
                            {...menuComponentProps}
                        >
                            {[...moreMenus.map((m, k)=><GenerateMenu menu={m} key={"menu_item_" + k} {...generateMenuProps} menuKey={menuKey+"_"+k}/>)]}
                        </MenuComponent>
                    </>
                    :
                    null
            }
        </>
    )
}

export default withMaterialStyles(materialStyle, Menu);

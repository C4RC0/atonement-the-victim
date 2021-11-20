export default function makeMaterialStyle(theme) {

    return {
        "@global": {
            ".MuiInputBase-input": {
                boxSizing: "content-box!important"
            },
        },
        root: {
            "& $appBar": {
                zIndex: theme.zIndex.drawer,
                boxShadow: theme.shadows[0]
            },
            "& $appBarSticky": {
                boxShadow: theme.shadows[3]
            },
            "& $drawerOpen": {
                transition: theme.transitions.create("margin-left", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            },
            "& $drawerClose": {
                transition: theme.transitions.create("margin-left", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
            },
            "& $drawerLayer": {
                transition: theme.transitions.create("opacity", {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
                zIndex: theme.zIndex.drawer - 1,
            },
            "& $listItem": {
                color: theme.palette.text.primary
            },
            "& $listItemIcon": {
                color: theme.palette.text.primary
            },
        },
        appBar: {},
        appBarSticky: {},
        drawerOpen: {},
        drawerClose: {},
        drawerLayer: {},
        listItem: {},
        listItemIcon: {},
    }
}

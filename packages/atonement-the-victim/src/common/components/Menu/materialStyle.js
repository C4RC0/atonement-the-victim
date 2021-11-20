export default function makeMaterialStyle(theme) {

    return {
        menu: {
            "& $listItem": {
                color: theme.palette.text.primary
            },
            "& $listItemIcon": {
                color: theme.palette.text.primary
            }
        },
        listItem: {},
        listItemIcon: {}
    }
}

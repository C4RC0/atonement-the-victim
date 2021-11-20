export default function makeMaterialStyle(theme) {
    return {
        root: {
            "& $content": {
                "& > *": {
                    margin: theme.spacing(1),
                },
            }
        },
        content: {}
    }
}

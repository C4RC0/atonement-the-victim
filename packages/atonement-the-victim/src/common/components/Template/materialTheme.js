export const materialTheme = function (p = {}) {

    const {mediaQuery = {}} = p;
    const prefersDarkMode = mediaQuery["(prefers-color-scheme: dark)"];
    const printMode = mediaQuery["print"];

    const dark = !!(prefersDarkMode && !printMode);

    return {
        palette: {
            primary: {
                main: (dark) ? "#ffffff" : "#000000",
            },
            secondary: {
                main: (dark) ? "#ffffff" : "#000000",
            },
            background: {
                paper: (dark) ? "#303338" : "#ffffff",
            },
            mode: dark ? "dark" : "light",
        },
    }
};

export const materialMediaQuery = ["(prefers-color-scheme: dark)", "print"];

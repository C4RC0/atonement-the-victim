import App from "./components/App";
import routes from "./config/constants/routes";
import titles from "./config/constants/titles";

export default function setContents(p = {}) {

    const {wapp} = p;

    function getTitle({wapp, res, title}) {
        const config = wapp.getTargetObject().config;
        const {siteName = "Wapplr"} = config;
        const {statusCode, statusMessage, errorMessage} = res.wappResponse;
        if (statusCode === 404) {
            title = statusMessage || "Not found";
        }
        if (statusCode === 500) {
            title = errorMessage || statusMessage || "Internal Server Error";
        }
        return title + " | " + siteName;
    }

    wapp.contents.add({
        canvas: {
            render: App,
            renderType: "react",
            title: function (p) {
                return getTitle({...p, title: titles.canvasTitle})
            }
        },
        video: {
            render: App,
            renderType: "react",
            title: function (p) {
                return getTitle({...p, title: titles.videoTitle})
            }
        },
        concept: {
            render: App,
            renderType: "react",
            title: function (p) {
                return getTitle({...p, title: titles.conceptTitle})
            }
        },
    });

    wapp.router.replace([
        {path: "/", contentName: "canvas"},
        {path: routes.canvasRoute, contentName: "canvas"},
        {path: "/canvas", contentName: "canvas"},
        {path: routes.conceptRoute, contentName: "concept"},
        {path: routes.videoRoute, contentName: "video"},
        {path: routes.recordRoute, contentName: "video"},
    ])

}

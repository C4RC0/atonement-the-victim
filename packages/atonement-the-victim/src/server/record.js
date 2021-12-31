import puppeteer from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import path from "path";

const delay = ms => new Promise(r => setTimeout(r, ms));

async function screenCaptureChromium(p = {}) {

    const {
        url = "/",
        savePath = "./assets/video.mp4",
        config = {
            followNewTab: true,
            fps: 60,
            ffmpeg_Path: null,
            videoFrame: {
                width: 864,
                height: 1080,
            },
            aspectRatio: "4:5",
        }
    } = p;

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--ignore-certificate-errors",
            "--ignore-certificate-errors-spki-list",
            "--use-cmd-decoder=passthrough",
            "--disable-extensions"
        ],
        ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    // noinspection JSUnusedLocalSymbols
    page.on("request", interceptedRequest => {});

    page.on('console', message => console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`));
    page.on('pageerror', ({ message }) => console.log(message));
    page.on('response', response => console.log(`${response.status()} ${response.url()}`));
    page.on('requestfailed', request => console.log(`${request.failure().errorText} ${request.url()}`));

    await page.setViewport({width:config.videoFrame.width, height:config.videoFrame.height});
    await page.goto(url);
    await delay(15000);

    const recorder = new PuppeteerScreenRecorder(page, config);
    await recorder.start(savePath);

    await delay(60000);

    await recorder.stop();
    await browser.close();

    return {
        url: savePath
    }

}

export default async function middleware(req, res, next) {
    const requestPath = req.wappRequest.path || req.wappRequest.url;
    const route = "/record";
    if (requestPath.slice(0, route.length) === route){

        const {globals} = req.wappRequest.wapp;
        const dirname = globals.ROOT || __dirname;
        const publicFolder = "public";

        if (globals.DEV) {
            await screenCaptureChromium({
                url: req.wappRequest.protocol + "://" + req.wappRequest.hostname + "/",
                savePath: path.resolve(dirname, publicFolder, "assets", "video4.mp4"),
            })
        }

    }

    return next();
}

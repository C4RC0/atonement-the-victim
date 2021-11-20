import React, {useContext} from "react";
import {WappContext} from "wapplr-react/dist/common/Wapp";
import clsx from "clsx";

import style from "./style.css";
import photo from "./photo.jpg";
import original from "./the-original.jpg";
import howWasItMade from "./how-was-it-made.jpg";
import preview1 from "./preview-1920x1080.jpg";

export default function Concept() {

    const context = useContext(WappContext);
    const {wapp} = context;
    wapp.styles.use(style);

    return (
        <div className={style.concept}>
            <div className={style.section}>
                <div className={style.title}>
                    <span className={style.hatchet}>{"Atonement "}</span>
                    <span className={style.on}>{"The "}</span>
                    <span className={style.table}>{"Victim"}</span>
                </div>
                <div className={style.subtitle}>
                    {"A new-media-art website for the 3D reproduction of the 'Atonement (The Victim)' painting"}
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"Concept"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div>{"This artwork is also part of a series in which I rework my previously painted oil paintings with modern technology."}</div>
                    </div>
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"1881. The original"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div>{"1881. Mihaly Zichy - 319x150 canvas with oil."}</div>
                    </div>
                    <div className={clsx(style.column, style.grayBgForPhoto)}>
                        <img alt={"1881. The original, Mihaly Zichy - 319x150 canvas with oil."} className={style.photo} src={original}/>
                    </div>
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"2012. The first reproduction"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div>{"In 2012, I painted this reproduction on a 40x50 canvas with oil." }</div>
                    </div>
                    <div className={clsx(style.column, style.grayBgForPhoto)}>
                        <img alt={"2012. The first reproduction, 40x50 canvas with oil."} className={style.photo} src={photo}/>
                    </div>
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"How was it made?"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div>{"I made this version in 3D with awesome Three Js library. In this interactive form, it is also valid as an independent artwork within the new-media-art genre."}</div>
                        <div className={clsx(style.column, style.grayBgForPhoto)}>
                            <img alt={"How was it made?"} className={style.howWasItMade} src={howWasItMade}/>
                        </div>
                    </div>
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"About me"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div><span>{"You can read more about me on my "}</span><span><a href={"https://github.com/C4RC0"} target={"_blank"}>{"Github"}</a></span></div>
                    </div>
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"Preview"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div className={clsx(style.column, style.grayBgForPhoto)}>
                            <img alt={"Preview"} className={style.previews} src={preview1}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

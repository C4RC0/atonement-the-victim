import React, {useContext} from "react";
import {WappContext} from "wapplr-react/dist/common/Wapp";

import style from "./style.css";

export default function Video() {

    const context = useContext(WappContext);
    const {wapp} = context;
    wapp.styles.use(style);

    return (
        <div className={style.video} >
            <video width="100%" height="100%" controls>
                <source src="/assets/video_final_864x1080_60fps.mp4" type="video/mp4" />
            </video>
        </div>
    );
}

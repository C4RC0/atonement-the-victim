import React, {useContext, useEffect, useRef} from "react";
import {WappContext} from "wapplr-react/dist/common/Wapp";
import style from "./style.css";
import clsx from "clsx";

import * as THREE from "three";

if (typeof window !== "undefined"){
    window.THREE = THREE;
}

if (typeof global !== "undefined") {
    global.THREE = THREE;
}

import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader.js";
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {Sky} from "three/examples/jsm/objects/Sky.js";

import { SelectiveBloomEffect, EffectPass, EffectComposer, RenderPass, KernelSize, BlendFunction, BloomEffect, TextureEffect } from "postprocessing";

const containers = {};

export default function Canvas(props) {

    const context = useContext(WappContext);

    const {wapp} = context;
    const {fullscreen = true} = props;

    wapp.styles.use(style);

    const container = useRef();
    const composition = useRef();
    const compositionBg = useRef();

    if (!containers[wapp.globals.WAPP]){
        containers[wapp.globals.WAPP] = {};
    }

    useEffect(function didMount(){

        containers[wapp.globals.WAPP].current = container.current;

        let scene;
        let camera;
        let composer;
        let renderer;
        let raycaster;
        const pointer = new THREE.Vector2();
        let selectiveBloomEffect;

        let reqId = null;
        let removeInputListeners;
        let controls;
        let target;
        let userCameraMoveing = false;
        let removeControlListeners;
        let enableOrbitControls = wapp.globals.DEV;

        let bgRenderer;
        let bgScene;
        let bgCamera;
        let bgComposer;

        const cloudParticles = [];
        let cloudGeo;
        let cloudMaterial;

        let boxes;
        let animInt;
        const toggleTimeouts = {};
        let runnings = [];

        function initBgGraphics() {

            const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;

            bgScene = new THREE.Scene();
            bgScene.background = new THREE.Color( 0xe5693e );

            /*Camera, Renderer*/

            bgCamera = new THREE.PerspectiveCamera( 60, parentContainer.offsetWidth/parentContainer.offsetHeight, 0.01, 1000 );

            bgRenderer = new THREE.WebGLRenderer({
                antialias: true,
                canvas: compositionBg.current,
                alpha: false,
                powerPreference: "high-performance",
                stencil: false,
            });

            bgRenderer.setSize( parentContainer.offsetWidth, parentContainer.offsetHeight );
            bgRenderer.shadowMap.enabled = true;
            bgRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
            bgRenderer.toneMappingExposure = 0.6
            bgRenderer.toneMapping = THREE.ACESFilmicToneMapping;

            /*Lights*/

            const hemiLight = new THREE.HemisphereLight( 0x3d4044, 0x3d4044, 1.8 );

            const ambient = new THREE.AmbientLight(0x555555);

            const directionalLight = new THREE.DirectionalLight(0xff8c19);
            directionalLight.position.set(0,0,-1);

            const orangeLight = new THREE.PointLight(0xcc6600,5,500,1.7);
            orangeLight.position.set(-50,150,150);

            const redLight = new THREE.PointLight(0xd8547e,10,500,1.7);
            redLight.position.set(0,150,150);

            const blueLight = new THREE.PointLight(0x3677ac,5,500,1.7);
            blueLight.position.set(50,150,150);

            /*Fog*/

            bgScene.fog = new THREE.FogExp2(0x111116, 0.007);

            //bgRenderer.setClearColor(bgScene.fog.color);

            /*Clouds*/

            let loader = new THREE.TextureLoader();

            const clouds = new THREE.Object3D();
            clouds.position.set(0,0,100);

            loader.load("/assets/smoke.png", function(texture){
                cloudGeo = new THREE.PlaneBufferGeometry(100,100);
                cloudMaterial = new THREE.MeshLambertMaterial({
                    map:texture,
                    transparent: true
                });

                for(let p=0; p<50; p++) {
                    let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
                    cloud.position.set(
                        (Math.random() * 200)-100,
                        Math.random() * 100,
                        Math.random() * 100
                    );
                    cloud.material.opacity = 0.55;
                    cloud.rotation.z = Math.random()*2*Math.PI;
                    cloud.rotation.y = Math.PI;
                    cloudParticles.push(cloud);
                    clouds.add(cloud);
                }
            });

            loader.load("/assets/stars.jpg", function(texture){

                const textureEffect = new TextureEffect({
                    blendFunction: BlendFunction.COLOR_DODGE,
                    texture: texture
                });
                textureEffect.blendMode.opacity.value = 0.2;

                const bloomEffect = new BloomEffect({
                    blendFunction: BlendFunction.COLOR_DODGE,
                    kernelSize: KernelSize.SMALL,
                    useLuminanceFilter: true,
                    luminanceThreshold: 0.3,
                    luminanceSmoothing: 0.75
                });
                bloomEffect.blendMode.opacity.value = 1.5;

                const effectPass = new EffectPass(
                    bgCamera,
                    bloomEffect,
                    textureEffect
                );
                effectPass.renderToScreen = true;

                bgComposer.addPass(effectPass);

            });

            /*Background effect composer*/

            bgComposer = new EffectComposer( bgRenderer );
            bgComposer.addPass(new RenderPass(bgScene, bgCamera));

            /*Sky*/

            const sky = new Sky();
            sky.scale.setScalar( 10000 );

            const skyUniforms = sky.material.uniforms;

            skyUniforms[ "turbidity" ].value = 4;
            skyUniforms[ "rayleigh" ].value = 5;
            skyUniforms[ "mieCoefficient" ].value = 0.005;
            skyUniforms[ "mieDirectionalG" ].value = 0.8;

            const pmremGenerator = new THREE.PMREMGenerator( bgRenderer );
            const phi = THREE.MathUtils.degToRad( 91 );
            const theta = THREE.MathUtils.degToRad( 20 );
            const sun = new THREE.Vector3();
            sun.setFromSphericalCoords( 1, phi, theta );
            sky.material.uniforms[ "sunPosition" ].value.copy( sun );
            bgScene.environment = pmremGenerator.fromScene( sky ).texture;

            /*Scene add*/

            bgScene.add(hemiLight);
            bgScene.add(ambient);
            bgScene.add(directionalLight);
            bgScene.add(orangeLight);
            bgScene.add(redLight);
            bgScene.add(blueLight);
            bgScene.add(sky);
            bgScene.add(clouds)

        }

        function initGraphics() {

            const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera( 60, parentContainer.offsetWidth/parentContainer.offsetHeight, 0.01, 1000 );
            window.camera = camera;

            camera.position.z = -1;
            camera.position.y = 1.86;
            camera.position.x = 0.05;

            target = new THREE.Vector3(0.05, 1.83, 1.5);
            camera.lookAt(target.x, target.y, target.z);

            raycaster = new THREE.Raycaster();

            renderer = new THREE.WebGLRenderer({
                antialias: true,
                canvas: composition.current,
                alpha: true,
                powerPreference: "high-performance",
                stencil: false,
            });

            renderer.setSize( parentContainer.offsetWidth, parentContainer.offsetHeight );
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            renderer.autoClear = false;
            renderer.toneMappingExposure = Math.pow( 1, 4.0 );

            const renderScene = new RenderPass( scene, camera );

            selectiveBloomEffect = new SelectiveBloomEffect(scene, camera, {
                blendFunction: BlendFunction.SCREEN,
                kernelSize: KernelSize.MEDIUM,
                luminanceThreshold: 0.4,
                luminanceSmoothing: 0.2,
                intensity: 1,
            })

            const bloomEffect = new EffectPass(camera, selectiveBloomEffect);

            bloomEffect.renderToScreen = true;

            composer = new EffectComposer( renderer );
            composer.addPass( renderScene );
            composer.addPass( bloomEffect );

            /*Ground*/

            const groundGeo = new THREE.PlaneGeometry( 5000, 2 );
            const groundMat = new THREE.MeshLambertMaterial( { color: 0x6b6e66 } );

            const ground = new THREE.Mesh( groundGeo, groundMat );
            ground.position.y = 1;
            ground.position.z = 1;
            ground.rotation.x = - Math.PI / 2;
            ground.receiveShadow = true;

            const groundY = ground.position.y;

            const boxMaterialProps = {
                roughness: 3,
                bumpScale: 0.008,
                metalness: 0.2
            }

            /*Boxes*/

            boxes = new THREE.Group();

            const boxGeometryProps = [100,100]

            const box0 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.14, 0.15, 0.15, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0xff474d, ...boxMaterialProps } )
            )
            box0.position.set(0.435,groundY+0.15/2, 0.925)
            box0.receiveShadow = true;
            box0.castShadow = true;
            boxes.add(box0);

            const box1 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.14, 0.15, 0.3, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0xff474d, ...boxMaterialProps } )
            )
            box1.position.set(0.295,groundY+0.15/2, 1)
            box1.receiveShadow = true;
            box1.castShadow = true;
            boxes.add(box1);

            const box2 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.25, 0.25, 0.25, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps} )
            )
            box2.position.set(0.1,groundY+0.25/2, 1)
            box2.receiveShadow = true;
            box2.castShadow = true;
            boxes.add(box2)

            const box3 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.20, 0.18, 0.18, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps } )
            )
            box3.position.set(-0.115,groundY+0.18/2, 1.05)
            box3.receiveShadow = true;
            box3.castShadow = true;
            boxes.add(box3)

            const box4 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.36, 0.4, 0.18, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps } )
            )
            box4.position.set(-0.115-0.27,groundY+0.4/2, 1.05)
            box4.receiveShadow = true;
            box4.castShadow = true;
            boxes.add(box4)

            const box5 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.36, 0.18, 0.08, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0xff8a40, ...boxMaterialProps } )
            )
            box5.position.set(-0.115-0.27,groundY+0.18/2, 0.92)
            box5.receiveShadow = true;
            box5.castShadow = true;
            boxes.add(box5)

            const box6 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.18, 0.3, 0.6, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps } )
            )
            box6.position.set(-0.115,groundY+0.3/2, 1.44)
            box6.receiveShadow = true;
            box6.castShadow = true;
            boxes.add(box6)

            const box7 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.36, 0.2, 0.2, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps } )
            )
            box7.position.set(-0.28,groundY+0.28+0.18/2, 1)
            box7.receiveShadow = true;
            box7.castShadow = true;
            boxes.add(box7)

            const box8 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.14, 0.14, 0.26, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0xa84142, ...boxMaterialProps } )
            )
            box8.position.set(-0.38,(groundY+0.28+0.18/2+0.2/2)+0.14/2, 1.12)
            box8.receiveShadow = true;
            box8.castShadow = true;
            boxes.add(box8)


            let body;

            new MTLLoader().setMaterialOptions({side: THREE.DoubleSide}).load( "./assets/obj/body.mtl", function ( materials ) {

                materials.preload();

                new OBJLoader()
                    .setMaterials( materials )
                    .load("./assets/obj/body.obj", function ( object ) {

                            body = object;
                            body.scale.x = 0.8;
                            body.scale.y = 0.8;
                            body.scale.z = 0.8;
                            body.position.y = 1.1;
                            body.position.x = 0.8;
                            body.position.z = 1.1;

                            body.rotation.set(-Math.PI / 8, Math.PI / 2, 0);
                            body.castShadow = true;
                            body.receiveShadow = true;

                            body.traverse(function(child){child.castShadow = true;})

                            scene.add(body);

                        },
                        function ( xhr ) {},
                        function ( error ) {
                            console.log(error)
                        }
                    );

            } );

            const spotLight = new THREE.SpotLight(0xffffff, 1);
            spotLight.shadow.camera.near = 0.01;
            spotLight.shadow.camera.far = 10;
            spotLight.lookAt(0,0,0);
            spotLight.castShadow = true;
            spotLight.position.set(-1, 3, 0);
            spotLight.lookAt(0,0,0);
            spotLight.shadow.mapSize.width = 4096;
            spotLight.shadow.mapSize.height = 4096;

            const hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.5 );

            scene.add(hemiLight);
            scene.add(spotLight);
            scene.add(ground);
            scene.add(boxes);

        }

        function initControls() {

            if (enableOrbitControls) {

                controls = new OrbitControls(camera, renderer.domElement);
                controls.target = target;
                controls.update();

                controls.enableZoom = false;
                controls.enablePan = false;
                controls.enableDamping = false;
                controls.minPolarAngle = Math.PI/2-0.5;
                controls.maxPolarAngle = Math.PI/2+0.1;
                controls.minAzimuthAngle = camera.rotation.y-4;
                controls.maxAzimuthAngle = camera.rotation.y-2;

                let wait;
                const start = function () {
                    if (wait) {
                        clearTimeout(wait);
                    }
                    userCameraMoveing = 1;
                };
                const end = function () {
                    if (wait) {
                        clearTimeout(wait);
                    }
                    userCameraMoveing = 1;
                    wait = setTimeout(function () {
                        userCameraMoveing = 0;
                    }, 100)
                };
                removeControlListeners = function () {
                    controls.removeEventListener("start", start);
                    controls.removeEventListener("end", end);
                };
                controls.addEventListener("start", start);
                controls.addEventListener("end", end);

            }
        }

        function glow(object) {
            if (object) {
                const isActive = object.userData.isActive;
                if (isActive) {
                    if (object.userData.tempMaterial) {
                        object.material = object.userData.tempMaterial;
                    }
                    object.userData.isActive = false;
                } else {
                    let color = 0x28ddb7;
                    if (!object.userData.tempMaterial) {
                        object.userData.tempMaterial = object.material;
                    }
                    if (object.userData.tempMaterial?.color) {
                        color = object.userData.tempMaterial.color;
                    }
                    object.material = new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0.9});
                    object.userData.isActive = true;
                }

                const selection = selectiveBloomEffect.selection;

                if (object.userData.isActive) {
                    if (!selection.has(object)) {
                        selection.add(object);
                    }
                } else {
                    if (selection.has(object)) {
                        selection.delete(object);
                    }
                }

            }
        }

        function initInput() {

            let doClickOnRelease = false;

            const click = function (event) {
                if (doClickOnRelease) {
                    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
                    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
                    raycaster.setFromCamera(pointer, camera);
                    const intersects = raycaster.intersectObjects(boxes.children, true);
                    const object = intersects[0]?.object;

                    glow(object)
                }
            };

            const down = function (){
                doClickOnRelease = true;
            }

            const move = function (){
                if (enableOrbitControls) {
                    doClickOnRelease = false;
                }
            }

            container.current.addEventListener( "click", click );
            container.current.addEventListener( "mousedown", down );
            container.current.addEventListener( "mousemove", move );

            container.current.addEventListener( "touchstart", down );
            container.current.addEventListener( "touchmove", move );


            removeInputListeners = function () {
                if (container.current) {
                    container.current.removeEventListener( "click", click );
                    container.current.removeEventListener( "mousedown", down );
                    container.current.removeEventListener( "mousemove", move );

                    container.current.removeEventListener( "touchstart", down );
                    container.current.removeEventListener( "touchmove", move );
                }
            }
        }

        function initAnim() {

            const totalTime = 5000;
            const toggleTime = (totalTime/2)/boxes.children.length;

            function toggleAndAgain(key, wait) {
                const object = boxes.children[key];
                if (object){
                    glow(object)
                    if (toggleTimeouts[key]){
                        clearTimeout(toggleTimeouts[key]);
                    }
                    toggleTimeouts[key] = setTimeout(()=>glow(object), wait)
                }
            }

            async function runAll(keys, run, wait, runAllEnd, m){

                if (runnings.length){
                    runnings.forEach((runningObject)=>{
                        runningObject.stop = true;
                    })
                }

                runnings.push(m);

                let i = 0;
                async function next(m) {
                    const key = keys[i];
                    if (typeof key !== "undefined" && !m?.stop){
                        await run(key, wait);
                        i = i + 1;
                        await new Promise((resolve)=>{setTimeout(resolve, wait)})
                        await next(m);
                    } else {
                        await Promise.all(keys.map(async (key)=>{
                            return await runAllEnd(key)
                        }))
                        m.stop = true;
                        runnings.splice(runnings.indexOf(m));
                    }
                }
                await next(m);
            }

            async function shuffleAndRun() {
                const keys = Array.from({length: boxes.children.length}, (v, i) => i);

                for (let i = keys.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [keys[i], keys[j]] = [keys[j], keys[i]];
                }

                await runAll(keys, toggleAndAgain, toggleTime, (key)=>toggleAndAgain(key, toggleTime*2), {})
            }

            if (animInt){
                clearInterval(animInt);
            }

            animInt = setInterval(async ()=>{
                await shuffleAndRun();
            }, totalTime)

            shuffleAndRun();

        }

        const render = function () {
            if (reqId) {
                cancelAnimationFrame(reqId)
            }
            reqId = requestAnimationFrame( render );

            if (controls) {
                controls.update();
            }

            bgCamera.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
            bgCamera.position.set(camera.position.x, camera.position.y, camera.position.z);

            cloudParticles.forEach(p => {
                p.rotation.z -=0.1;
            });

            bgComposer.render(0.1);

            composer.render();

        };

        function init() {
            initBgGraphics();
            initGraphics();
            initControls();
            render();
            initInput();
            initAnim();
        }

        init();

        function onResize() {

            if (camera && renderer) {
                const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;

                camera.aspect = parentContainer.offsetWidth / parentContainer.offsetHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(parentContainer.offsetWidth, parentContainer.offsetHeight);
                composer.setSize(parentContainer.offsetWidth, parentContainer.offsetHeight);

                bgCamera.aspect = parentContainer.offsetWidth / parentContainer.offsetHeight;
                bgCamera.updateProjectionMatrix();
                bgRenderer.setSize(parentContainer.offsetWidth, parentContainer.offsetHeight);
                bgComposer.setSize(parentContainer.offsetWidth, parentContainer.offsetHeight);

            }

        }

        function addResizeListeners() {
            if (container.current && typeof ResizeObserver !== "undefined") {
                const resizeObserver = new ResizeObserver((entries) => {
                    onResize(entries);
                });
                resizeObserver.observe(container.current);
                return function removeEventListener(){
                    resizeObserver.disconnect();
                }
            } else {
                window.addEventListener("resize", onResize);
                return function removeEventListener(){
                    window.removeEventListener("resize", onResize);
                }
            }
        }

        const removeResizeListeners = addResizeListeners();

        onResize();

        return function willUnmount() {
            removeResizeListeners();
            if (removeInputListeners){
                removeInputListeners();
            }
            if (removeControlListeners && controls){
                removeControlListeners();
            }
            if (reqId) {
                cancelAnimationFrame(reqId);
                if (animInt){
                    clearInterval(animInt);
                }
            }
        }

    }, []);

    return (
        <div
            className={
                clsx(
                    style.canvas,
                    {[style.fullscreen] : fullscreen},
                )}
            ref={container}
        >
            <div className={style.bg} />
            <div className={style.center}>
                <canvas className={style.compositionBg} ref={compositionBg} />
                <canvas className={style.composition} ref={composition} />
            </div>
        </div>
    )
}

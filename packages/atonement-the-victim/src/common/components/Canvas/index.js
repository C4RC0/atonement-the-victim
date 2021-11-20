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
import AmmoLib from "three/examples/js/libs/ammo.wasm.js";
import { AmmoDebugDrawer, DefaultBufferSize } from "./AmmoDebugDrawer.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {LineMaterial} from "three/examples/jsm/lines/LineMaterial";
import {LineGeometry} from "three/examples/jsm/lines/LineGeometry";
import {LineSegments2} from "three/examples/jsm/lines/LineSegments2";
import {Sky} from "three/examples/jsm/objects/Sky.js";

import { SelectiveBloomEffect, BrightnessContrastEffect, EffectPass, EffectComposer, RenderPass, KernelSize, BlendFunction } from "postprocessing";

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

        let physicsWorld;
        let transformAux1;
        let scene;
        let camera;
        let composer;
        let renderer;
        let raycaster;
        const pointer = new THREE.Vector2();
        let selectiveBloomEffect;

        let reqId = null;
        const rigidBodies = [];
        const gravityConstant = -9.8;
        let collisionConfiguration;
        let dispatcher;
        let broadphase;
        let solver;
        let softBodySolver;
        let Ammo = null;
        const clock = new THREE.Clock();
        let moveing = 0;
        let removeInputListeners;
        let lightBulb;
        let wireCylinder;
        let debugGeometry;
        let debugDrawer;
        let controls;
        let target;
        let sunLightTargetP = -1;
        let cameraP = -1
        let userCameraMoveing = false;
        let removeControlListeners;
        let enableOrbitControls = wapp.globals.DEV;

        let bgRenderer;
        let bgScene;
        let bgCamera;
        let bgTarget;
        let bgComposer;
        let sunLightTarget;
        let sunLight;

        async function initAmmo() {
            Ammo = await AmmoLib();
        }

        function initBgGraphics() {

            const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;

            bgScene = new THREE.Scene();
            bgScene.background = new THREE.Color( 0xe5693e );

            bgScene.fog = new THREE.FogExp2( 0xe5693e, 0.0225 );

            bgCamera = new THREE.PerspectiveCamera( 60, parentContainer.offsetWidth/parentContainer.offsetHeight, 0.01, 1000 );

            bgCamera.position.z = 3.8;
            bgCamera.position.y = 1.3;
            bgCamera.position.x = -1.35;

            bgCamera.lookAt(-1.6, 1.25, 2);
            bgTarget = new THREE.Vector3(-1.6, 1.25, 2);

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

            const renderScene = new RenderPass( bgScene, bgCamera );

            const brightnessContrastEffect = new EffectPass(bgCamera, new BrightnessContrastEffect({
                blendFunction: BlendFunction.NORMAL,
                kernelSize: KernelSize.MEDIUM,
                brightness: 0.05,
                contrast: 0.2
            }));

            brightnessContrastEffect.renderToScreen = true;
            bgComposer = new EffectComposer( bgRenderer );
            bgComposer.addPass( renderScene );
            bgComposer.addPass( brightnessContrastEffect );

            const groundGeo = new THREE.PlaneGeometry( 10000, 10000 );
            const groundMat = new THREE.MeshLambertMaterial( { color: 0xcb9779 } );

            const ground = new THREE.Mesh( groundGeo, groundMat );
            ground.position.y = -0.2;
            ground.rotation.x = - Math.PI / 2;
            ground.receiveShadow = true;

            const sky = new Sky();
            sky.scale.setScalar( 10000 );

            const skyUniforms = sky.material.uniforms;

            skyUniforms[ "turbidity" ].value = 4;
            skyUniforms[ "rayleigh" ].value = 5;
            skyUniforms[ "mieCoefficient" ].value = 0.005;
            skyUniforms[ "mieDirectionalG" ].value = 0.8;

            const pmremGenerator = new THREE.PMREMGenerator( bgRenderer );
            const phi = THREE.MathUtils.degToRad( 90 );
            const theta = THREE.MathUtils.degToRad( 20 );
            const sun = new THREE.Vector3();
            sun.setFromSphericalCoords( 1, phi, theta );
            sky.material.uniforms[ "sunPosition" ].value.copy( sun );
            bgScene.environment = pmremGenerator.fromScene( sky ).texture;

            sunLightTarget = new THREE.Object3D();
            sunLightTarget.position.set(10,2,-9);

            sunLight = new THREE.DirectionalLight(0xff3020, 8)
            sunLight.position.set(-5,5,4);
            sunLight.target = sunLightTarget;
            sunLight.castShadow = true;
            sunLight.shadow.camera.near = 0.01;
            sunLight.shadow.camera.far = 200;

            const hemiLight = new THREE.HemisphereLight( 0x3d4044, 0x3d4044, 1.8 );

            bgScene.add( ground );
            bgScene.add( sky );
            bgScene.add( hemiLight );
            bgScene.add( sunLightTarget );
            bgScene.add( sunLight );

        }

        function initGraphics() {

            const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera( 60, parentContainer.offsetWidth/parentContainer.offsetHeight, 0.01, 1000 );
            window.camera = camera;
            camera.layers.enable(1);
            camera.layers.enable(2);
            camera.layers.enable(3);

            camera.position.z = 0.105;
            camera.position.y = 1.86;
            camera.position.x = 0.05;

            target = new THREE.Vector3(0.05, 1.83, 1.5);
            camera.lookAt(target.x, target.y, target.z);

            raycaster = new THREE.Raycaster();
            raycaster.layers.set(1);
            raycaster.layers.enable(2);
            raycaster.layers.enable(3);

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

            const groundY = 1.3;

            const boxMaterialProps = {
                roughness: 3,
                bumpScale: 0.008,
                metalness: 0.2
            }

            const boxGeometryProps = [100,100]

            const box1 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.3, 0.15, 0.3, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0xff474d, ...boxMaterialProps } )
            )
            box1.position.set(0.375,groundY+0.15/2, 1)
            box1.receiveShadow = true;
            box1.castShadow = true;
            box1.layers.set(3);

            const box2 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.25, 0.25, 0.25, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps} )
            )
            box2.position.set(0.1,groundY+0.25/2, 1)
            box2.receiveShadow = true;
            box2.castShadow = true;
            box2.layers.set(3);

            const box3 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.20, 0.18, 0.18, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps } )
            )
            box3.position.set(-0.115,groundY+0.18/2, 1.05)
            box3.receiveShadow = true;
            box3.castShadow = true;
            box3.layers.set(3);

            const box4 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.36, 0.4, 0.18, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps } )
            )
            box4.position.set(-0.115-0.27,groundY+0.4/2, 1.05)
            box4.receiveShadow = true;
            box4.castShadow = true;
            box4.layers.set(3);

            const box5 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.36, 0.18, 0.08, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0xff8a40, ...boxMaterialProps } )
            )
            box5.position.set(-0.115-0.27,groundY+0.18/2, 0.92)
            box5.receiveShadow = true;
            box5.castShadow = true;
            box5.layers.set(3);

            const box6 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.18, 0.3, 0.6, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps } )
            )
            box6.position.set(-0.115,groundY+0.3/2, 1.44)
            box6.receiveShadow = true;
            box6.castShadow = true;
            box6.layers.set(3);

            const box7 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.36, 0.2, 0.2, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0x28ddb7, ...boxMaterialProps } )
            )
            box7.position.set(-0.28,groundY+0.28+0.18/2, 1.12)
            box7.receiveShadow = true;
            box7.castShadow = true;
            box7.layers.set(3);

            const box8 = new THREE.Mesh(
                new THREE.BoxGeometry( 0.14, 0.14, 0.26, ...boxGeometryProps ),
                new THREE.MeshStandardMaterial( { color: 0xa84142, ...boxMaterialProps } )
            )
            box8.position.set(-0.38,(groundY+0.28+0.18/2+0.2/2)+0.14/2, 1.12)
            box8.receiveShadow = true;
            box8.castShadow = true;
            box8.layers.set(3);

            const spotLight = new THREE.SpotLight(0xffffff, 1);
            spotLight.shadow.camera.near = 0.01;
            spotLight.shadow.camera.far = 10;
            spotLight.lookAt(0,0,0);
            spotLight.castShadow = true;
            spotLight.layers.set(1);
            spotLight.position.set(-1, 3, 0);
            spotLight.lookAt(0,0,0);
            spotLight.shadow.mapSize.width = 4096;
            spotLight.shadow.mapSize.height = 4096;

            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry( 0.04, 16, 16 ),
                new THREE.MeshBasicMaterial( { color: 0xefab93, transparent: true, opacity: 0.8 } )
            )
            bulb.layers.set(3);

            const light = new THREE.PointLight(0x3d4044, 1);
            light.shadow.camera.near = 0.01;
            light.shadow.camera.far = 1.5;
            light.lookAt(0,0,0);
            light.castShadow = true;
            light.layers.set(1);

            const socketGeometry = new THREE.CylinderGeometry( 0.02, 0.02, 0.05, 32 );
            const socketMaterial = new THREE.MeshBasicMaterial( {color: 0x000000} );
            const socketCylinder = new THREE.Mesh( socketGeometry, socketMaterial );
            socketCylinder.position.set(0,0.04 + 0.05/2,0);
            socketCylinder.layers.set(1);

            const socketCapGeometry = new THREE.CylinderGeometry( 0.001, 0.021, 0.02, 32 );
            const socketCapMaterial = new THREE.MeshBasicMaterial( {color: 0x000000} );
            const socketCapCylinder = new THREE.Mesh( socketCapGeometry, socketCapMaterial );
            socketCapCylinder.position.set(0,0.04 + 0.05+(0.02/2),0);
            socketCapCylinder.layers.set(1);

            lightBulb = new THREE.Group();
            lightBulb.add(socketCylinder, socketCapCylinder, bulb, light);
            lightBulb.position.set(-1.5,1.35,2.6)
            lightBulb.layers.set(1);

            const lightBulbShape = new Ammo.btSphereShape( 0.04/2 );
            lightBulbShape.setMargin( 0.01 );
            createRigidBody( lightBulb, lightBulbShape, 0.1, lightBulb.position, lightBulb.quaternion );
            lightBulb.userData.physicsBody.setFriction( 0.5 );

            const blanketGeometry = new THREE.BoxGeometry( 0.5, 0.05, 0.5 );
            const blanketMaterial = new THREE.MeshStandardMaterial( {color: 0x1d3932, side: THREE.DoubleSide,} );
            const blanket = new THREE.Mesh( blanketGeometry, blanketMaterial );
            blanket.castShadow = true;
            blanket.rotation.set(Math.PI / -2, 0, 0);
            blanket.position.y = 4.5;
            blanket.position.x = lightBulb.position.x;
            blanket.position.z = lightBulb.position.z;
            const blanketShape = new Ammo.btBoxShape( new Ammo.btVector3( 0.5 * 0.5, 0.05 * 0.5, 0.5 * 0.5 ) );
            blanketShape.setMargin( 0.01 );
            createRigidBody( blanket, blanketShape, 0, blanket.position, new THREE.Quaternion(0, 0, 0, 1) );
            blanket.layers.set(1);

            const wireStartY = lightBulb.position.y + 0.07;
            const wireHeight = 4.5-wireStartY;
            const wireNumSegments = Math.floor(wireHeight/0.1);
            const segmentLength = wireHeight / wireNumSegments;
            const wirePos = lightBulb.position.clone();
            wirePos.y = wireStartY;

            const wirePositions = [];
            for ( let i = 0; i < wireNumSegments + 1; i ++ ) {
                wirePositions.push( wirePos.x, wirePos.y + i * segmentLength, wirePos.z );
            }

            const wireGeometry = new LineGeometry();
            wireGeometry.setPositions( wirePositions );

            const wireMaterial = new LineMaterial( {
                color: 0xffffff,
                linewidth: 0.01,
                vertexColors: true,
                dashed: false,
                alphaToCoverage: true,
                worldUnits: true
            } );

            wireCylinder = new LineSegments2( wireGeometry, wireMaterial );
            wireCylinder.castShadow = true;
            wireCylinder.receiveShadow = true;

            const softBodyHelpers = new Ammo.btSoftBodyHelpers();
            const wireStart = new Ammo.btVector3( wirePos.x, wirePos.y, wirePos.z );
            const wireEnd = new Ammo.btVector3( wirePos.x, wirePos.y + wireHeight, wirePos.z );
            const wireSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), wireStart, wireEnd, wireNumSegments - 1, 0 );
            const sbConfig = wireSoftBody.get_m_cfg();
            sbConfig.set_viterations( 100 );
            sbConfig.set_piterations( 100 );
            wireSoftBody.setTotalMass( 0.1, false );
            Ammo.castObject( wireSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( 0.01 * 3 );
            physicsWorld.addSoftBody( wireSoftBody, 1, - 1 );
            wireCylinder.userData.physicsBody = wireSoftBody;
            wireSoftBody.setActivationState( 4 );

            wireSoftBody.appendAnchor( 0, lightBulb.userData.physicsBody, true, 1 );
            wireSoftBody.appendAnchor( wireNumSegments, blanket.userData.physicsBody, true, 1 );

            const hemiLight = new THREE.HemisphereLight( 0xddeeff, 0x0f0e0d, 0.5 );
            hemiLight.layers.set(3);

            scene.add( hemiLight );
            scene.add( lightBulb );
            scene.add( wireCylinder );
            scene.add( blanket );

            scene.add(box1);
            scene.add(box2);
            scene.add(box3);
            scene.add(box4);
            scene.add(box5);
            scene.add(box6);
            scene.add(box7);
            scene.add(box8);
            scene.add(spotLight);

        }

        function initControls() {

            if (enableOrbitControls) {

                controls = new OrbitControls(camera, renderer.domElement);
                controls.target = target;
                controls.update();

                /*controls.enableZoom = false;
                controls.enablePan = false;
                controls.enableDamping = false;
                controls.minPolarAngle = Math.PI/2-0.5;
                controls.maxPolarAngle = Math.PI/2+0.1;
                controls.minAzimuthAngle = camera.rotation.y-0.5;
                controls.maxAzimuthAngle = camera.rotation.y+0.5;*/

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

        function initDebugAmmo() {

            const debugVertices = new Float32Array(DefaultBufferSize);
            const debugColors = new Float32Array(DefaultBufferSize);
            debugGeometry = new THREE.BufferGeometry();
            debugGeometry.addAttribute("position", new THREE.BufferAttribute(debugVertices, 3).setDynamic(true));
            debugGeometry.addAttribute("color", new THREE.BufferAttribute(debugColors, 3).setDynamic(true));
            const debugMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
            const debugMesh = new THREE.LineSegments(debugGeometry, debugMaterial);
            debugMesh.frustumCulled = false;
            scene.add(debugMesh);
            debugDrawer = new AmmoDebugDrawer(null, debugVertices, debugColors, physicsWorld);
            debugDrawer.enable();

            setInterval(() => {
                const mode = (debugDrawer.getDebugMode() + 1) % 3;
                debugDrawer.setDebugMode(mode);
            }, 1000);

        }

        function initPhysics(){
            collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
            dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
            broadphase = new Ammo.btDbvtBroadphase();
            solver = new Ammo.btSequentialImpulseConstraintSolver();
            softBodySolver = new Ammo.btDefaultSoftBodySolver();
            physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
            physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
            physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
            transformAux1 = new Ammo.btTransform();
        }

        function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

            threeObject.position.copy( pos );
            threeObject.quaternion.copy( quat );

            const transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
            transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
            const motionState = new Ammo.btDefaultMotionState( transform );

            const localInertia = new Ammo.btVector3( 0, 0, 0 );
            physicsShape.calculateLocalInertia( mass, localInertia );

            const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
            const body = new Ammo.btRigidBody( rbInfo );

            threeObject.userData.physicsBody = body;

            if ( mass > 0 ) {
                rigidBodies.push( threeObject );
                body.setActivationState( 4 );
            }

            physicsWorld.addRigidBody( body );

        }

        function updatePhysics( deltaTime ) {

            physicsWorld.stepSimulation( deltaTime, 10 );

            if (debugDrawer) {
                physicsWorld.debugDrawWorld();
            }

            const softBody = wireCylinder.userData.physicsBody;
            const wirePositions = wireCylinder.geometry.attributes.position.array;
            const numVerts = wirePositions.length / 3;
            const nodes = softBody.get_m_nodes();
            const positions = [];

            for ( let i = 0; i < numVerts; i ++ ) {
                const node = nodes.at( i );
                const nodePos = node.get_m_x();
                positions.push(nodePos.x(), nodePos.y(), nodePos.z())
            }

            wireCylinder.geometry.setPositions(positions);

            wireCylinder.geometry.attributes.position.needsUpdate = true;

            for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {

                const objThree = rigidBodies[ i ];
                const objPhys = objThree.userData.physicsBody;
                const ms = objPhys.getMotionState();
                if ( ms ) {

                    ms.getWorldTransform( transformAux1 );
                    const p = transformAux1.getOrigin();
                    const q = transformAux1.getRotation();
                    objThree.position.set( p.x(), p.y(), p.z() );
                    objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

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
                    const intersects = raycaster.intersectObjects(scene.children, false);
                    const object = intersects[0]?.object;

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

                        if(object.userData.isActive) {
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

        function sunLightAnim() {
            sunLight.position.y = sunLight.position.y  + (0.05*sunLightTargetP);
            if (sunLight.position.y < 2){
                sunLightTargetP = 1;
                sunLight.position.y = 2;
            } else if (sunLight.position.y > 5){
                sunLightTargetP = -1;
                sunLight.position.y = 5;
            }
        }

        function cameraAnim() {
            if (!userCameraMoveing) {
                camera.position.y = camera.position.y + (0.01 * cameraP);
                if (camera.position.y < 1.2) {
                    cameraP = 1;
                    camera.position.y = 1.2;

                    let physicsBody = lightBulb.userData.physicsBody;
                    let resultantImpulse = new Ammo.btVector3( 0.01, 0, 0.00001 );
                    resultantImpulse.op_mul(20);
                    physicsBody.setLinearVelocity( resultantImpulse );

                } else if (camera.position.y > 1.8) {
                    cameraP = -1;
                    camera.position.y = 1.8;
                }
            }
        }

        const render = function () {
            if (reqId) {
                cancelAnimationFrame(reqId)
            }
            reqId = requestAnimationFrame( render );

            if (moveing){
                let physicsBody = lightBulb.userData.physicsBody;
                let resultantImpulse = new Ammo.btVector3( 0.01 * moveing, 0, 0.00001 );
                resultantImpulse.op_mul(20);
                physicsBody.setLinearVelocity( resultantImpulse );
            }

            //cameraAnim();

            if (controls) {
                controls.update();
            }

            //sunLightAnim();

            bgCamera.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);
            bgCamera.position.set(camera.position.x, camera.position.y, camera.position.z);

            bgComposer.render();

            renderer.clear();

            const parentContainer = containers[wapp.globals.WAPP].current || typeof window !== "undefined" && window;
            wireCylinder.material.resolution.set( parentContainer.offsetWidth, parentContainer.offsetHeight );

            const deltaTime = clock.getDelta();
            updatePhysics(deltaTime);

            camera.layers.set(0);
            camera.layers.enable(1);
            camera.layers.enable(3);
            composer.render();

            //renderer.render(scene, camera);

        };

        async function init() {
            await initAmmo();
            initPhysics();
            initBgGraphics();
            initGraphics();
            //initDebugAmmo();
            initControls();
            render();
            initInput();
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

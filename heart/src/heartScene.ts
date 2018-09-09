import * as THREE from 'three';
import { DebugRay } from './debugRay';
import { Heart } from './heart';
import { HeartMaterial } from './heartMaterial';
import { HeartState } from './heartState';

const objectPadding = 0.25;

const emptyVector3 = new THREE.Vector3();

interface HeartSceneProps {
    touchStart: () => void
    touchEnd: () => void
}

export class HeartScene {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private material: HeartMaterial;
    private canvas: HTMLCanvasElement;
    private heart: Heart;

    private mouse: THREE.Vector2;
    private down: boolean;

    private faceRayDebugger: DebugRay | undefined;
    private state: HeartState = HeartState.empty;;

    constructor(
        container: HTMLElement,
        private readonly _props: HeartSceneProps
    ) {
        this.mouse = new THREE.Vector2(10000, 10000);
        this.down = false;

        this.createRenderer();
        this.createScene();
        this.createGeometry();
        this.createCamera();
        this.addEvents();

        container.appendChild(this.renderer.domElement);

        this.handleResize()
    }

    public setState(state: HeartState) {
        this.state = state;
    }

    private addEvents() {
        window.addEventListener('resize', () => this.handleResize(), false);

        const onDown = (clientX: number, clientY: number) => {
            this.down = true;
            this.updateMouse(clientX, clientY);
            if (this.getMouseDownIntersection()) {
                this._props.touchStart();
            }
        };
        this.canvas.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
        this.canvas.addEventListener('touchstart', e => {
            const firstTouch = e.touches[0];
            if (firstTouch) {
                onDown(firstTouch.clientX, firstTouch.clientY);
            }
        });

        const onUp = () => {
            this.down = false;
            this._props.touchEnd();
        };
        this.canvas.addEventListener('mouseup', onUp);
        this.canvas.addEventListener('touchend', onUp);

        this.canvas.addEventListener('mousemove', event => {
            this.updateMouse(event.clientX, event.clientY);
        });
        this.canvas.addEventListener('touchmove', event => {
            this.updateMouse(event.touches[0].clientX, event.touches[0].clientY);
        });
    }

    private updateMouse(clientX: number, clientY: number) {
        this.mouse = new THREE.Vector2(
            (clientX / this.canvas.clientWidth) * 2 - 1,
            -(clientY / this.canvas.clientHeight) * 2 + 1);
    }

    private createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.canvas = this.renderer.domElement;
    }

    private createScene() {
        this.scene = new THREE.Scene();
    }

    private createCamera() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const aspect = width / height;
        const VIEW_ANGLE = 45;
        const NEAR = 0.1;
        const FAR = 10000;

        this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspect, NEAR, FAR);
        this.camera.position.copy(new THREE.Vector3(0, 0, 20));
        this.scene.add(this.camera);
    }

    private updateCamera() {
        if (!this.heart) {
            return;
        }

        const viewWidth = this.canvas.clientWidth;
        const viewHeight = this.canvas.clientHeight;
        const viewAspect = viewWidth / viewHeight;

        const geometrySize = new THREE.Vector3();
        const box = new THREE.Box3().setFromObject(this.heart.mesh);
        box.getSize(geometrySize);
        const width = geometrySize.x + objectPadding * 2
        const fov = 2 * Math.atan((width / viewAspect) / (2 * this.camera.position.z)) * (180 / Math.PI);
        this.camera.fov = fov;
        this.camera.aspect = viewAspect
        this.camera.updateProjectionMatrix();
    }

    private async createGeometry() {
        this.material = new HeartMaterial();
        this.heart = await Heart.load(this.material);
        this.scene.add(this.heart.mesh);

        // this.faceRayDebugger = new DebugRay();
        // this.scene.add(this.faceRayDebugger.mesh);

        this.updateCamera();
    }

    private handleResize() {
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.updateCamera();
    }


    public update(delta: number) {
        this.material.updateTime(delta);
        let isClickingHeart = false;

        const mouseIntersection = this.getMouseDownIntersection();
        if (mouseIntersection && this.heart) {
            isClickingHeart = true;
            this.heart.onClick(mouseIntersection.position, 1.0);
            this.material.mouseOrigin = mouseIntersection.ray.origin;
            this.material.mouseDirection = mouseIntersection.ray.direction;
        } else {
            this.material.mouseOrigin = emptyVector3;
            this.material.mouseDirection = emptyVector3;
        }

        const faceIntersection = this.getFacePoint();
        if (faceIntersection && this.heart) {
            this.heart.onClick(faceIntersection.position, this.state.tongue);

            const origin = faceIntersection.ray.direction.clone().negate().multiplyScalar(20);
            const direction = faceIntersection.ray.direction.clone();

            this.material.faceOrigin = origin;
            this.material.faceDirection = direction;
            if (this.faceRayDebugger) {
                this.faceRayDebugger.update(new THREE.Ray(origin, direction));
            }
        } else {
            this.material.faceOrigin = emptyVector3;
            this.material.faceDirection = emptyVector3;
        }

        this.material.vibrationIntensity = this.state.vibrationIntensity;
        if (this.heart) {
            this.heart.update(delta);
        }

        this.render();
    }

    private render() {
        this.renderer.render(this.scene, this.camera)
    }

    public getMouseDownIntersection(): { position: THREE.Vector3, ray: THREE.Ray } | undefined {
        if (!this.mouse || !this.down || !this.heart) {
            return;
        }

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = raycaster.intersectObjects([this.heart.mesh], true);
        if (intersects.length > 0) {
            return {
                position: intersects[0].point,
                ray: raycaster.ray
            };
        }
        return undefined;
    }

    private getFacePoint(): { position: THREE.Vector3, ray: THREE.Ray } | undefined {
        if (!this.state.faceMatrix || !this.state.isTracking) {
            return undefined;
        }

        const point = new THREE.Vector3(0, 0, 20);
        point.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2).multiply(this.state.faceMatrix));

        const raycaster = new THREE.Raycaster();
        const end = point.clone().normalize();
        raycaster.set(emptyVector3, new THREE.Vector3(-end.x * 10, end.y, end.z).normalize());

        const intersects = raycaster.intersectObjects([this.heart.mesh], true);
        if (intersects.length > 0) {
            return {
                position: intersects[0].point,
                ray: raycaster.ray
            };
        }

        return undefined;
    }
} 
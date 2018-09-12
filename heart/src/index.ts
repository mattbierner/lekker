import * as THREE from 'three';
import { HeartScene } from './heartScene';
import { HeartState } from './heartState';

class Main {
    private readonly _scene: HeartScene;
    private readonly _clock: THREE.Clock;

    constructor(container: HTMLElement) {
        this._scene = new HeartScene(container, {
            touchStart: () => postMessage('touchStart'),
            touchEnd: () => postMessage('touchEnd'),
        });

        document.addEventListener('message', (event: any) => this.handleMessage(event.data));

        this._clock = new THREE.Clock();

        // setInterval(() => {
        //     this._state.faceMatrix = new THREE.Matrix4().makeRotationY(Math.PI / 2 * Math.sin(Date.now() / 1000));
        //     this.setHeartState(this._state);
        // }, 50)

        this.render();
    }

    private setHeartState(state: HeartState) {
        this._scene.setState(state);
    }

    private handleMessage(data: any) {
        const body = JSON.parse(data);
        switch (body.name) {
            case 'update':
                const vibrationIntensity = body.intensity;
                let faceMatrix: THREE.Matrix4 | undefined;
                const tongue = body.faceState ? body.faceState.tongue : 0;
                if (body.faceState && body.faceState) {
                    faceMatrix = new THREE.Matrix4().fromArray([].concat(...body.faceState.transform));
                }
                this.setHeartState(new HeartState(
                    vibrationIntensity, faceMatrix, tongue, body.faceState.isActivelyTracking));
                break;
        }
    }

    private render() {
        const delta = Math.min(0.25, this._clock.getDelta());
        this._scene.update(delta);

        window.requestAnimationFrame(() => this.render());
    }
}

function postMessage(name: string, ...body: any[]) {
    window.postMessage(JSON.stringify({
        name,
        ...body,
    }), '*');
}

// tslint:disable-next-line:no-unused-expression
new Main(document.querySelector('#container'));

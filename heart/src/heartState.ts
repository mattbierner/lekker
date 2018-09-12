import * as THREE from 'three';

export class HeartState {
    public static empty = new HeartState(0, undefined, 0, false);

    public constructor(
        public vibrationIntensity: number,
        public faceMatrix: THREE.Matrix4 | undefined,
        public tongue: number,
        public isTracking: boolean,
    ) { }
}

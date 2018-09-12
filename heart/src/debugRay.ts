import * as THREE from 'three';

export class DebugRay {
    private readonly _geometry: THREE.Geometry;
    private readonly _line: THREE.Line;

    constructor() {
        this._geometry = new THREE.Geometry();
        this._geometry.vertices[0] = new THREE.Vector3();
        this._geometry.vertices[1] = new THREE.Vector3();

        const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
        this._line = new THREE.Line(this._geometry, material);
    }

    public get mesh(): THREE.Object3D {
        return this._line;
    }

    public update(ray: THREE.Ray) {
        this._geometry.vertices[0] = ray.origin.clone();
        this._geometry.vertices[1] = ray.origin.clone().add(ray.direction.clone().normalize().multiplyScalar(50));
        this._geometry.verticesNeedUpdate = true;
    }
}

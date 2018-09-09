import * as THREE from 'three';
import { addBarycentricCoordinates } from './geometry';
import { HeartMaterial } from './heartMaterial';
import { OBJLoader } from './OBJLoader';

const maxDelta = 2;

export class Heart {
    public static async load(material: HeartMaterial): Promise<Heart> {
        const mesh = await Heart.loadGeometry();
        return new Heart(mesh, material);
    }

    private static loadGeometry(): Promise<THREE.Mesh> {
        const objLoader = new OBJLoader();
        return new Promise<THREE.Mesh>((resolve, reject) => {
            let found = false;
            objLoader.load('./heart.obj', (obj: any) => {
                obj.traverse((child: any) => {
                    if (found || !(child instanceof THREE.Mesh)) {
                        return;
                    }
                    found = true
                    resolve(child);
                });
                if (!found) {
                    reject(new Error('Could not load heart geometry'));
                }
            });
        })
    }

    private readonly _vertexStates: { velocity: number, acceleration: number }[] = [];
    private readonly deformAttribute: THREE.BufferAttribute;

    private constructor(
        private readonly _mesh: THREE.Mesh,
        private readonly _material: HeartMaterial
    ) {
        _mesh.material = this._material.material;

        const deforms: number[] = [];
        for (let i = 0; i < this.geometry.attributes['position'].count; ++i) {
            deforms.push(0);
            this._vertexStates[i] = { acceleration: 0, velocity: 0 };
        }

        this.deformAttribute = new THREE.BufferAttribute(new Float32Array(deforms), 1);
        this.deformAttribute.dynamic = true;
        this.geometry.addAttribute('deform', this.deformAttribute);

        addBarycentricCoordinates(this.geometry);
    }

    public get mesh(): THREE.Mesh {
        return this._mesh;
    }

    public update(delta: number) {
        const k = -100; // Spring stiffness
        const b = -5; // Damping constant

        const deformValues: any = this.deformAttribute.array;
        for (let i = 0; i < this._vertexStates.length; ++i) {
            const state = this._vertexStates[i];
            const spring_x = k * deformValues[i];
            const damper_x = b * state.velocity;
            state.acceleration = spring_x + damper_x;
            state.velocity += state.acceleration * delta;
            deformValues[i] += state.velocity * delta;
        }

        this.deformAttribute.needsUpdate = true;
    }

    public onClick(
        intersection: THREE.Vector3,
        weight: number
    ) {
        const geometry = this.mesh.geometry as THREE.BufferGeometry;
        const position = geometry.attributes['position'] as THREE.BufferAttribute;
        const values = this.deformAttribute.array;
        for (let i = 0; i < values.length; ++i) {
            const xPosition = position.array[i * 3];
            const xDelta = Math.abs(xPosition - intersection.x);
            if (xDelta <= maxDelta) {
                this._vertexStates[i].velocity += (maxDelta - xDelta) / maxDelta * weight;
                this._vertexStates[i].velocity = Math.min(this._vertexStates[i].velocity, 100);
            }
        }

        this.deformAttribute.needsUpdate = true;
    }

    private get geometry() {
        return this.mesh.geometry as THREE.BufferGeometry;
    }
}
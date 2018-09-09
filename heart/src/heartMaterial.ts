import * as THREE from 'three';
import { shader } from './shader';

export class HeartMaterial {
    private readonly _material: THREE.ShaderMaterial;

    constructor() {
        this._material = new THREE.ShaderMaterial(shader);
        this._material.side = THREE.DoubleSide;
    }

    public get material(): THREE.Material {
        return this._material;
    }

    public updateTime(delta: number) {
        const timeUniform: any = this._material.uniforms['time'];
        timeUniform.value += delta;
    }

    public set vibrationIntensity(value: number) {
        this.setUniform('vibrationIntensity', value);
    }

    public set mouseOrigin(value: THREE.Vector3) {
        this.setUniform('mouseOrigin', value);
    }

    public set mouseDirection(value: THREE.Vector3) {
        this.setUniform('mouseDirection', value);
    }

    public set faceOrigin(value: THREE.Vector3) {
        this.setUniform('faceOrigin', value);
    }

    public set faceDirection(value: THREE.Vector3) {
        this.setUniform('faceDirection', value);
    }

    private setUniform(name: string, value: any) {
        this._material.uniforms[name].value = value;
    }
}
import * as THREE from 'three';

export const shader: THREE.Shader = {
    uniforms: {
        time: { value: 1.0 },
        vibrationIntensity: { value: 0.0 },
        mouseOrigin: { value: new THREE.Vector3() },
        mouseDirection: { value: new THREE.Vector3() },
        faceOrigin: { value: new THREE.Vector3() },
        faceDirection: { value: new THREE.Vector3() },
    },
    vertexShader: /* glsl */ `
        uniform float time;
        uniform float vibrationIntensity;

        uniform vec3 mouseOrigin;
        uniform vec3 mouseDirection;

        uniform vec3 faceOrigin;
        uniform vec3 faceDirection;

        attribute float deform;
        attribute vec3 barycentric;

        varying vec3 vNormal;
        varying float vDeform;
        varying float vColorPlus;
        varying vec3 vBarycentric;

        float getIntersectionAddedColor(vec3 origin, vec3 direction) {
            if (length(origin) != 0.0) {
                vec3 vectorFromMouse = cross(direction, position - origin);
                float distance = abs(vectorFromMouse.y) * 3.0 + abs(vectorFromMouse.x);
                return max(0.0, 1.0 - distance / 3.0);
            } else {
                return 0.0;
            }
        }

        void main() {
            vNormal = normal;
            vBarycentric = barycentric;

            // Mouse
            vColorPlus = getIntersectionAddedColor(mouseOrigin, mouseDirection);
            vColorPlus += getIntersectionAddedColor(faceOrigin, faceDirection);

            // Vibration intensity
            vec3 n = normalize(position);
            float displayment = (0.1 * vibrationIntensity) * (sin(position.y * 3.0 + time * 5.0));

            // Deformation
            vDeform = deform;
            vec3 pos = position + (n * displayment) + deform * vec3(0.0, 1.0, 1.0) * max(0.0, 4.0 - abs(position.x)) / 4.0;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        varying float vDeform;
        varying float vColorPlus;
        varying vec3 vBarycentric;

        void main() {
            vec3 light = vec3(0.5, 0.2, 1.0);
            light = normalize(light);

            float dProd = max(0.0, dot(vNormal, light));

            float d = min(min(vBarycentric.x, vBarycentric.y), vBarycentric.z);
            if (d < 0.02) {
                d = 0.2;
            } else {
                d = 0.0;
            }
            d *= vColorPlus;

            vec3 baseColor = vec3(0.89453125, 0.19921875, 0.19921875);
            // feed into our frag colour
            gl_FragColor = vec4(
                (baseColor + vec3(vDeform * 0.25, 0, 0)) * (dProd) + vec3(d),
                1.0); 
        }
    `
}
import { FaceState, FaceTracker } from "../faceTracker";
import { ToyController } from "../toy_control";
import * as math from "../util/math";
import { Milliseconds } from "../util/time_units";

export type DriverUpdateHandler = (data: { level: number, faceState: FaceState | undefined }) => void;

export class Driver {
    private _velocity: number = 0;

    // Force from tongue being pushed out (a shove) Between 0-1
    private _tongePushForce: number = 0;
    private _mousePushForce: number = 0;

    // Force from tongue just sitting out there (resistence). Between 0-1
    private _tongeHoldForce: number = 0;
    private _mouseHoldForce: number = 0;

    private _lastTongue: number | null = null;

    private _lastFaceState: FaceState | undefined = undefined;

    private _active: boolean = false;
    private _level: number = 0;

    private _lastUpdate: number = 0;
    private _updateInterval?: number;

    private readonly _mass = 0.4;

    constructor(
        private readonly toyController: ToyController,
        private readonly faceTracker: FaceTracker,
        private readonly delegate: DriverUpdateHandler
    ) {
        this.faceTracker.onDidUpdate(faceState => {
            this.updateFaceState(faceState);
        });
    }

    public async start() {
        if (this._active) {
            return;
        }

        this._active = true;
        await this.faceTracker.beginTracking();

        const update = () => {
            if (this._active) {
                this.toyController.setVibrationStrength(this._level * 20, new Milliseconds(500)).then(update);
            }
        }
        update();

        clearInterval(this._updateInterval);
        this._lastUpdate = Date.now();
        this._updateInterval = setInterval(() => {
            this.update();
        }, 50);
    }

    public async stop() {
        this._active = false;
        clearInterval(this._updateInterval);

        await this.faceTracker.stopTracking();

        this.toyController.setVibrationStrength(0, new Milliseconds(500));
        this._velocity = 0;
        this._level = 0;

        this.delegate({
            level: 0,
            faceState: {
                isActivelyTracking: false,
                isTrackingEnabled: !!(this._lastFaceState && this._lastFaceState.isTrackingEnabled),
                tongue: 0,
                transform: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
            },
        });
        this._lastFaceState = undefined;
    }

    /**
     * Called when a touch starts in webview
     */
    public touchStart() {
        if (this._active) {
            this._mouseHoldForce = 0.5;
            this._mousePushForce = 1;
        }
    }

    /**
     * Called when a touch is recived from the webview
     */
    public touchEnd() {
        if (this._active) {
            this._mouseHoldForce = 0;
        }
    }

    private updateFaceState(faceState: FaceState) {
        this._lastFaceState = faceState;
        if (faceState.tongue !== null && faceState.isActivelyTracking) {
            if (this._lastTongue !== null && faceState.tongue > this._lastTongue) {
                this._tongePushForce = Math.max(0, faceState.tongue - this._lastTongue);
            }

            this._lastTongue = faceState.tongue;
            this._tongeHoldForce = faceState.tongue;
        } else {
            this._lastTongue = null;
            this._tongeHoldForce = 0;
            this._tongePushForce = 0;
        }
        this.update();
    }

    private update() {
        if (!this._active) {
            return;
        }

        const now = Date.now();
        const delta = math.clamp(1 / 1000, 50 / 1000, (now - this._lastUpdate) / 1000);
        this._lastUpdate = now;

        const k = -0.5;
        const b = -0.93;

        const forceSpring = k * this._level;
        const forceDamper = b * this._velocity;

        const baseForceMultiplier = 3;
        const pushForce = (this._tongePushForce * baseForceMultiplier + this._mousePushForce * baseForceMultiplier * (4 / 5) + (this._mouseHoldForce + this._tongeHoldForce) * baseForceMultiplier * (1 / 10));

        const acceleration = (forceSpring + forceDamper + pushForce) / this._mass;
        this._velocity += acceleration * delta;

        // Make reversals easier
        if (this._velocity < 0 && (this._tongePushForce > 0.3 || this._mouseHoldForce > 0.2)) {
            this._velocity *= 0;
        }

        this._level += this._velocity * delta;
        if (this._level < 0) {
            this._velocity = 0;
        }

        this._level = math.clamp(0, 1, this._level);

        this.delegate({
            level: math.clamp(0, 1,
                (this._level * 0.8) + (math.clamp(0, 1, this._mouseHoldForce + this._tongeHoldForce) * 0.25)),
            faceState: this._lastFaceState
        });

        this._mousePushForce = 0;
    }
}


import { NativeEventEmitter, NativeModules } from 'react-native';
import { FaceState, FaceTracker } from '.';

const arManagerEmitter = new NativeEventEmitter(NativeModules.ArManager);

interface NativeFaceData {
    readonly tongue: number;
    readonly transfrorm: number[][];
}

interface NativeIsTrackingData {
    readonly isTracking: boolean;
}


/**
 * Face tracker using actual device
 */
export class NativeFaceTracker implements FaceTracker {
    private _enabled: boolean | undefined = undefined;
    private _isActive: boolean = false;
    private _isTracking: boolean = false;
    private readonly _handlers = new Set<(value: FaceState) => void>();

    public constructor() {
        arManagerEmitter.addListener(
            'updatedFace',
            (value: NativeFaceData) => this.onUpdate(value));

        arManagerEmitter.addListener(
            'updatedIsTracking',
            (data: NativeIsTrackingData) => this.updateIsTracking(data.isTracking));

    }

    public async beginTracking(): Promise<boolean> {
        if (this._isActive) {
            return true;
        }

        if (typeof this._enabled !== 'boolean') {
            this._enabled = await NativeModules.ArManager.getFaceArEnabled();
        }

        if (!this._enabled) {
            this.broadcast({
                isTrackingEnabled: false,
                isActivelyTracking: false,
                tongue: null,
                transform: null
            });
            return false;
        }

        this._isActive = true;
        this._isTracking = false;
        return NativeModules.ArManager.beginFaceTracking();
    }

    public async stopTracking(): Promise<boolean> {
        if (!this._isActive) {
            return true;
        }

        if (this._enabled) {
            await NativeModules.ArManager.stopFaceTracking();
        }

        this._isTracking = false;
        this._isActive = false;
        this.broadcast({
            isTrackingEnabled: !!this._enabled,
            isActivelyTracking: false,
            tongue: null,
            transform: null
        });

        return true;
    }

    public onDidUpdate(handler: (value: FaceState) => void): void {
        this._handlers.add(handler);
    }

    private onUpdate(value: NativeFaceData) {
        if (!this._isActive) {
            return;
        }

        this.broadcast({
            isTrackingEnabled: !!this._enabled,
            isActivelyTracking: this._isTracking,
            tongue: value.tongue,
            transform: value.transfrorm
        });
    }

    private broadcast(value: FaceState) {
        for (const handler of this._handlers) {
            handler(value);
        }
    }

    private updateIsTracking(isTracking: boolean) {
        if (!this._isActive) {
            return;
        }

        this._isTracking = isTracking;
    }
}

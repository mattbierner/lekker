import { FaceState, FaceTracker } from '.';

const mockUpdateInterval = 200;

/**
 * Noop face tracker used for development testing
 */
export class MockFaceTracker implements FaceTracker {
    private _isTracking: boolean = false;
    private _updateTimer: any | undefined;
    private readonly _handlers = new Set<(value: FaceState) => void>();

    public async beginTracking(): Promise<boolean> {
        if (this._isTracking) {
            return true;
        }

        this._isTracking = true;
        setInterval(() => this.doMockUpdate(), mockUpdateInterval);
        return true;
    }

    public async stopTracking(): Promise<boolean> {
        if (!this._isTracking) {
            throw new Error('Face tracking not active');
        }
        clearInterval(this._updateTimer);
        this._updateTimer = undefined;
        return true;
    }

    public onDidUpdate(handler: (value: FaceState) => void): void {
        this._handlers.add(handler);
    }

    private doMockUpdate() {
        const value = 0.5;
        for (const handler of this._handlers) {
            handler({
                isTrackingEnabled: true,
                isActivelyTracking: true,
                tongue: value,
                transform: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
            });
        }
    }
}

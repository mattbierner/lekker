import * as config from '../config';
import { MockFaceTracker } from './mock';
import { NativeFaceTracker } from './native';

export interface FaceState {
    /**
     * Is face tracking supported on the device?
     */
    readonly isTrackingEnabled: boolean;

    /**
     * Is the face currently being tracked?
     */
    readonly isActivelyTracking: boolean;

    /**
     * Extension of the tonge. Range between 0 (no extension) and 1 (fully extended)
     * 
     * Null when tracking is not active.
     */
    readonly tongue: number | null;

    /**
     * Tranform matrix of the face.
     * 
     * Null when tracking is not active.
     */
    readonly transform: number[][] | null;
}


export interface FaceTracker {
    /**
     * Start tracking the user's face.
     */
    beginTracking(): Promise<boolean>;

    /**
     * Stop tracking the user's face.
     */
    stopTracking(): Promise<boolean>;

    /**
     * Subscribe to face state updates. 
     */
    onDidUpdate(handler: (value: FaceState) => void): void;
}

export const getFaceTracker = () => {
    return config.mock ? new MockFaceTracker() : new NativeFaceTracker()
}
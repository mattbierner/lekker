import { ToyController } from '.';
import { delay } from '../util/timer';
import { Milliseconds } from '../util/time_units';

/**
 * Controls toy but maintains memory so as it to not issue the same command multiple times
 */
export default class MemoryToyControllerWrapper implements ToyController {
    private _last: number = 0

    constructor(
        private controller: ToyController
    ) { }

    setVibrationStrength(strength: number, timeout: Milliseconds): Promise<boolean> {
        strength = Math.floor(strength)
        if (this._last === strength) {
            return delay(new Milliseconds(50)).then(() => true)
        }
        this._last = strength
        return this.controller.setVibrationStrength(strength, timeout)
    }
}

import { ToyController } from '.';
import { Milliseconds } from '../util/time_units';

/**
 * ToyController that wraps another toy contorller and logs
 */
export class LoggingToyControllerWrapper implements ToyController {
    constructor(
        private readonly controller: ToyController
    ) { }

    setVibrationStrength(strength: number, timeout: Milliseconds) {
        console.log('Updating vibration: ' + strength)
        return this.controller.setVibrationStrength(strength, timeout)
    }
}

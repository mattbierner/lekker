import { ToyController } from '.';
import { delay } from '../util/timer';
import { Milliseconds } from '../util/time_units';

/**
 * Noop toy controller used for development testing
 */
export class MockToyController implements ToyController {
    setVibrationStrength(strength: number, timeout: Milliseconds) {
        return delay(new Milliseconds(200)).then(() => true)
    }
}

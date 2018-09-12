import { NativeModules } from 'react-native';
import { ToyController } from '.';
import { delay } from '../util/timer';
import { Milliseconds } from '../util/time_units';
const PromiseThrottle = require('promise-throttle');

/**
 * Controls toys using device to talk to iOS native code
 */
export class NativeToyController implements ToyController {
    private promiseThrottle = new PromiseThrottle({
        requestsPerSecond: 15,
        promiseImplementation: Promise,
    });

    public setVibrationStrength(
        strength: number,
        timeout: Milliseconds = new Milliseconds(500),
    ) {
        return this.callHandler('setVibration', Math.floor(strength), timeout);
    }

    private callHandler(name: string, data: any, timeout: Milliseconds): Promise<boolean> {
        return this.promiseThrottle.add(() =>
            Promise.race([
                delay(timeout).then(_ => false),
                NativeModules.ToyManager[name](data)]));
    }
}

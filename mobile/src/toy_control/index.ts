import * as config from '../config';
import { Milliseconds } from '../util/time_units';
import { LoggingToyControllerWrapper } from './logging_toy_controller';
import MemoryToyControllerWrapper from './memory_toy_controller';
import { MockToyController } from './mock_toy_controller';
import { NativeToyController } from './native_toy_controller';

/**
 * Basic interface for controlling toys
 */
export interface ToyController {
    setVibrationStrength(
        strength: number,
        timeout: Milliseconds
    ): Promise<boolean>
}


export const getToyController = () => {
    const realController = config.mock ? new MockToyController() : new NativeToyController()
    return new MemoryToyControllerWrapper(new LoggingToyControllerWrapper(realController))
}
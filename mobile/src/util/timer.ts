import { Milliseconds } from './time_units';

export const delay = (ms: Milliseconds): Promise<void> =>
    new Promise<void>(resolve =>
        setTimeout(resolve, ms.value));

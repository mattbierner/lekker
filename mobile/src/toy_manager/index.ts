import * as config from '../config';
import { MockToyManager } from './mock';
import { NativeToyManager } from './native';
import { Toy } from './toy';
import { ToyList } from './toyList';

export interface ToyManagerDelegate {
    onUpdatedToys(toys: ToyList): void
    onChangedBluetooth(isEnabled: boolean): void
}

export interface ToyManager {
    onReady(): Promise<ToyList>

    beginScan(onFoundDevice: (devices: ToyList) => void): void

    stopScan(): void

    connectToy(toy: Toy): Promise<Toy>

    disconnectToy(toy: Toy): Promise<boolean>
}


export const getToyManager = (delegate: ToyManagerDelegate): ToyManager => {
    if (config.mock) {
        return new MockToyManager(delegate)
    } else {
        return new NativeToyManager(delegate)
    }
}
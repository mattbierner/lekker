import { AsyncStorage, EmitterSubscription, NativeEventEmitter, NativeModules } from 'react-native';
import { delay } from '../util/timer';
import { Milliseconds } from '../util/time_units';
import { ToyManager, ToyManagerDelegate } from './index';
import { toToyType, Toy, ToyConnectionType, ToyResult } from './toy';
import { ToyList } from './toyList';


class AutoConnectHelper {
    private static readonly key = 'toyManager.autoConnectToyIds'
    private autoConnect = new Set<string>()

    private _onReady: Promise<void>

    constructor() {
        this._onReady = new Promise(resolve => {
            AsyncStorage.getItem(AutoConnectHelper.key).then(keys => {
                const ids = keys ? JSON.parse(keys) : []
                for (const id of ids) {
                    this.autoConnect.add(id)
                }
                resolve()
            }, resolve)
        })
    }

    public async shouldAutoConnect(toy: Toy): Promise<boolean> {
        await this._onReady
        return this.autoConnect.has(toy.identifier)
    }

    public async getIds(): Promise<string[]> {
        await this._onReady
        return Array.from(this.autoConnect)
    }

    public async onConnectToy(toy: Toy): Promise<void> {
        await this._onReady
        this.autoConnect.add(toy.identifier)
        this.onUpdateToys()
    }

    public async onDisconnectToy(toy: Toy): Promise<void> {
        await this._onReady
        this.autoConnect.delete(toy.identifier)
        this.onUpdateToys()
    }

    private onUpdateToys() {
        AsyncStorage.setItem(AutoConnectHelper.key, JSON.stringify(Array.from(this.autoConnect)))
    }
}

export class NativeToyManager implements ToyManager {
    private didDiscoverPeripheralSubscription: EmitterSubscription
    private didDisconnectPeripheralSubscription: EmitterSubscription
    private didToggleBluetoothSubscription: EmitterSubscription

    private _isScanning: boolean = false

    private _toys: ToyList = ToyList.empty
    private readonly _autoConnect = new AutoConnectHelper()

    private toysSinceLastPoll: ToyList = ToyList.empty;
    private _scanInterval?: number;

    private onFoundDevice?: (devices: ToyList) => void

    private _bluetoothEnabled: boolean = false
    private _inited: boolean = false;

    private _toyManagerReady: Promise<void>
    private _signalToyManagerReady?: () => void


    constructor(
        private readonly delegate: ToyManagerDelegate
    ) {
        const emitter = new NativeEventEmitter(NativeModules.ToyManager)

        this.didDiscoverPeripheralSubscription = emitter.addListener(
            'ToyManager.didDiscoverPeripheral',
            this.onFoundToy.bind(this))

        this.didDisconnectPeripheralSubscription = emitter.addListener(
            'ToyManager.didDisconnectPeripheral',
            this.onDisconnectToy.bind(this))

        this.didToggleBluetoothSubscription = emitter.addListener(
            'ToyManager.didToggleBluetooth',
            this.didToggleBluetooth.bind(this))

        this._toyManagerReady = new Promise(resolve => this._signalToyManagerReady = resolve)

        NativeModules.ToyManager.getBluetoothEnabled()
    }

    public dipose() {
        this.stopScan()
        this.didDiscoverPeripheralSubscription.remove()
        this.didDisconnectPeripheralSubscription.remove()
        this.didToggleBluetoothSubscription.remove()
    }

    public async onReady(): Promise<ToyList> {
        if (this._inited) {
            return this._toys
        }
        await this._toyManagerReady
        this.tryReconnect()

        this._inited = true
        return this._toys
    }

    private updateToys(toys: ToyList) {
        this._toys = toys;
        if (this.onFoundDevice) {
            this.onFoundDevice(this._toys)
        }
        this.delegate.onUpdatedToys(this._toys)
    }

    public beginScan(
        onFoundDevice: (devices: ToyList) => void
    ): void {
        if (this._isScanning) {
            return
        }

        this._isScanning = true
        this.toysSinceLastPoll = ToyList.empty
        this.onFoundDevice = onFoundDevice
        console.log('start scan')

        this._scanInterval = setInterval(() => {
            let newToys = this._toys
            // Remove any toys that are no longer connected
            for (const toy of this._toys) {
                if ((toy.connectionType !== ToyConnectionType.Connected && toy.connectionType !== ToyConnectionType.Connecting) && !this.toysSinceLastPoll.has(toy.identifier)) {
                    newToys = newToys.delete(toy.identifier)
                }
            }
            this.toysSinceLastPoll = ToyList.empty
            this.updateToys(newToys)
        }, 3000)

        NativeModules.ToyManager.startScan().then(
            () => {
                console.log('Started scan')
            },
            () => {
                console.log('Scanning error')
            })
    }

    public stopScan(): void {
        if (!this._isScanning) {
            return
        }

        if (this._scanInterval) {
            clearInterval(this._scanInterval)
        }

        NativeModules.ToyManager.stopScan()
        this.onFoundDevice = undefined
        this._isScanning = false
        this.toysSinceLastPoll = ToyList.empty
    }

    public async connectToy(toy: Toy): Promise<Toy> {
        const existingToy = this._toys.get(toy.identifier)
        if (!existingToy) {
            return toy
        }
        this._toys = this._toys.put(toy.asConnected(ToyConnectionType.Connecting))
        if (this.onFoundDevice) {
            this.onFoundDevice(this._toys)
        }
        this.delegate.onUpdatedToys(this._toys)
        try {
            await NativeModules.ToyManager.connectToy(toy.identifier)
        } catch {
            const error = toy.asConnected(ToyConnectionType.Disconnected)
            this.updateToys(this._toys.put(error))
            return error
        }
        const connected = toy.asConnected()
        this.updateToys(this._toys.put(connected))
        this._autoConnect.onConnectToy(connected)
        return connected
    }

    public async disconnectToy(toy: Toy): Promise<boolean> {
        const existingToy = this._toys.get(toy.identifier)
        if (!existingToy) {
            return false
        }

        try {
            await NativeModules.ToyManager.disconnectToy(toy.identifier)
        } catch {
            // noop
        }

        const disconnected = toy.asConnected(ToyConnectionType.Disconnected)
        this.updateToys(this._toys.put(disconnected))
        this._autoConnect.onDisconnectToy(disconnected)
        return true
    }

    private async onFoundToy(result: ToyResult) {
        const toy = this.addToy(result)
        if (await this._autoConnect.shouldAutoConnect(toy)) {
            this.connectToy(toy);
        } else {
            this.toysSinceLastPoll = this.toysSinceLastPoll.put(toy)
        }
    }

    private addToy(result: ToyResult): Toy {
        const existing = this._toys.get(result.identifier);
        if (!existing) {
            const toy = new Toy(
                toToyType(result.type),
                ToyConnectionType.Unknown,
                result.name,
                result.identifier)
            this.updateToys(this._toys.put(toy))
            return toy
        }
        return existing
    }

    private onDisconnectToy(toy: ToyResult) {
        const existingToy = this._toys.get(toy.identifier)
        if (!existingToy) {
            return
        }
        this.updateToys(this._toys.put(existingToy.asConnected(ToyConnectionType.Disconnected)))
    }

    private didToggleBluetooth(enabled: boolean) {
        if (this._signalToyManagerReady) {
            this._signalToyManagerReady()
            this._signalToyManagerReady = undefined
        }
        if (enabled === this._bluetoothEnabled) {
            return
        }
        this._bluetoothEnabled = enabled
        if (!enabled) {
            this.updateToys(ToyList.empty)
        }
        this.delegate.onChangedBluetooth(enabled)

        if (enabled) {
            this.tryReconnect()
        }
    }

    public async tryReconnect(): Promise<void> {
        this.beginScan(() => { })
        await delay(new Milliseconds(250))
        this.stopScan()
    }
}

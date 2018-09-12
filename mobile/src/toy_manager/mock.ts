import { ToyManager, ToyManagerDelegate } from './index';
import { Toy, ToyConnectionType, ToyType } from './toy';
import { ToyList } from './toyList';

const mockToy1 = new Toy(ToyType.Hush, ToyConnectionType.Unknown, 'DeLarge', 'alex');
const mockToy2 = new Toy(ToyType.Lush, ToyConnectionType.Unknown, 'Tremors 2: Aftershocks', 'tremors');

export class MockToyManager implements ToyManager {
    private toys: ToyList;
    private connectDelay: number = 1000;

    constructor(
        private readonly delegate: ToyManagerDelegate,
    ) {
        this.toys = ToyList.empty.put(mockToy1).put(mockToy2);
        this.delegate.onUpdatedToys(this.toys);
        this.delegate.onChangedBluetooth(true);
    }

    public async onReady(): Promise<ToyList> {
        return this.toys;
    }

    public beginScan(onFoundDevice: (devices: ToyList) => void): void {
        onFoundDevice(this.toys);
    }

    public stopScan(): void { /* noop */ }

    public async connectToy(toy: Toy): Promise<Toy> {
        const existingToy = this.toys.get(toy.identifier);
        if (!existingToy) {
            return toy;
        }

        this.toys = this.toys.put(toy.asConnected(ToyConnectionType.Connecting));
        this.delegate.onUpdatedToys(this.toys);

        return new Promise<Toy>(resolve => setTimeout(() => {
            const connected = toy.asConnected();
            this.toys = this.toys.put(connected);
            this.delegate.onUpdatedToys(this.toys);
            resolve(connected);
        }, this.connectDelay));
    }

    public async disconnectToy(toy: Toy): Promise<boolean> {
        this.toys = this.toys.put(toy.asConnected(ToyConnectionType.Disconnected));
        this.delegate.onUpdatedToys(this.toys);
        return true;
    }
}

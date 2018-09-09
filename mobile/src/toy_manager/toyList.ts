import { Toy, ToyConnectionType } from './toy';

export class ToyList {
    public static readonly empty = new ToyList(new Map());
    private readonly toys: Map<string, Toy>;

    private constructor(toys: Map<string, Toy>) {
        this.toys = toys;
    }

    public [Symbol.iterator] = () => {
        return this.toys.values();
    };

    public get(id: string) {
        return this.toys.get(id);
    }

    public has(id: string) {
        return this.toys.has(id);
    }

    public get isEmpty(): boolean {
        return this.toys.size === 0;
    }

    public get hasConnected(): boolean {
        for (const toy of this) {
            if (toy.connectionType === ToyConnectionType.Connected) {
                return true;
            }
        }
        return false;
    }

    public put(toy: Toy): ToyList {
        const newToys = new Map(this.toys);
        newToys.set(toy.identifier, toy);
        return new ToyList(newToys);
    }

    public delete(id: string): ToyList {
        const newToys = new Map(this.toys);
        newToys.delete(id);
        return new ToyList(newToys);
    }

    public equals(other: ToyList): boolean {
        if (this.toys.size !== other.toys.size) {
            return false;
        }
        for (const key of this.toys.keys()) {
            const ourValue = this.toys.get(key);
            const theirValue = other.toys.get(key);
            if (ourValue !== theirValue) {
                return false;
            }
        }
        return true;
    }
}
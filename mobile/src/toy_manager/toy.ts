export interface ToyResult {
    name: string
    identifier: string
    connected: boolean
    type: string
}

export enum ToyType {
    Unknown,
    Hush,
    Lush
}

export enum ToyConnectionType {
    Unknown,
    Disconnected,
    Connected,
    Connecting,
    Disconnecting
}

export class Toy {
    constructor(
        public readonly type: ToyType,
        public readonly connectionType: ToyConnectionType,
        public readonly name: string,
        public readonly identifier: string
    ) { }

    public asConnected(connectionType: ToyConnectionType = ToyConnectionType.Connected): Toy {
        return new Toy(
            this.type,
            connectionType,
            this.name,
            this.identifier)
    }

    public get displayName(): string {
        switch (this.type) {
            case ToyType.Hush:
                return 'Hush'

            case ToyType.Lush:
                return 'Lush'

            default:
                return 'Unknown Toy'
        }
    }
}

export const toToyType = (type: string): ToyType => {
    switch (type) {
        case 'lush':
            return ToyType.Lush
        case 'hush':
            return ToyType.Hush
        default:
            return ToyType.Unknown
    }
}

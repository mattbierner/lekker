
export class NumberWithUnit<T> {
    _type?: T

    constructor(
        public readonly value: number
    ) { }

    public add(other: NumberWithUnit<T>): NumberWithUnit<T> {
        return new NumberWithUnit<T>(this.value + other.value)
    }

    public subtract(other: NumberWithUnit<T>): NumberWithUnit<T> {
        return new NumberWithUnit<T>(this.value - other.value)
    }

    public multiply(mulitiplier: number): NumberWithUnit<T> {
        return new NumberWithUnit<T>(this.value * mulitiplier)
    }
}

export class Seconds extends NumberWithUnit<'seconds'> {
    public static now(): Seconds {
        return new Seconds(Date.now() / 1000)
    }
}

export class Milliseconds extends NumberWithUnit<'milliseconds'> {
    public static fromSeconds(seconds: Seconds): Milliseconds {
        return new Milliseconds(seconds.value * 1000)
    }
}


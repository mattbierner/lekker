import { AsyncStorage } from 'react-native';

export class StateManager {
    private static readonly hasAppRunKey = 'firstRun';

    public get hasAppRun(): Promise<boolean> {
        return AsyncStorage.getItem(StateManager.hasAppRunKey).then(x => !!x);
    }

    public setDidFirstRun() {
        AsyncStorage.setItem(StateManager.hasAppRunKey, 'true');
    }
}


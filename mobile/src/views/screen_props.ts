import { NavigationScreenProps } from 'react-navigation';
import { FaceTracker } from '../faceTracker';
import { StateManager } from '../state_manager';
import { ToyController } from '../toy_control';
import { ToyManager } from '../toy_manager';
import { ToyList } from '../toy_manager/toyList';

export default interface ScreenProps extends NavigationScreenProps<any> {
    readonly screenProps: {
        readonly toyController: ToyController;
        readonly faceTracker: FaceTracker;
        readonly deviceManager: ToyManager;
        readonly currentScreen: string | null;
        readonly toys: ToyList;
        readonly stateManager: StateManager;
        readonly bluetoothEnabled: boolean;
    }
}

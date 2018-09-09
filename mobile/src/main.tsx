import * as React from 'react';
import { createStackNavigator, NavigationActions, NavigationContainer } from 'react-navigation';
import { FaceTracker, getFaceTracker } from './faceTracker';
import * as routes from './routes';
import { StateManager } from './state_manager';
import { getToyController, ToyController } from './toy_control';
import { getToyManager, ToyManager } from './toy_manager';
import { ToyList } from './toy_manager/toyList';
import AboutView from './views/about_view';
import HomeView from './views/home_view';
import SettingsView from './views/settings_view';
import SupportedToys from './views/supported_toys';
import WelcomeView from './views/welcome_view';

interface MainState {
    readonly currentScreen: string | null
    readonly toys: ToyList
    readonly bluetoothEnabled: boolean
}

export default class Main extends React.Component<{}, MainState> {
    private readonly Stack: NavigationContainer;
    private readonly toyController: ToyController;
    private readonly faceTracker: FaceTracker;
    private readonly stateManager = new StateManager()
    private toyManager?: ToyManager;

    public constructor(props: {}) {
        super(props)

        this.state = {
            currentScreen: null,
            toys: ToyList.empty,
            bluetoothEnabled: false
        }

        this.toyController = getToyController();
        this.faceTracker = getFaceTracker();

        this.Stack = createStackNavigator(
            ([
                WelcomeView,
                AboutView,
                SettingsView,
                HomeView,
                SupportedToys
            ]).reduce((routes, route) => {
                routes[route.route] = { screen: route }
                return routes
            }, {} as any),
            {
                initialRouteName: routes.Welcome
            });

        this.Stack.router.getStateForAction = navigateOnce(this.Stack.router.getStateForAction);
    }

    componentWillMount() {
        this.toyManager = getToyManager({
            onUpdatedToys: (toys) => {
                if (!toys.equals(this.state.toys)) {
                    this.setState({ toys: toys })
                }
            },
            onChangedBluetooth: (isEnabled) => {
                this.setState({ bluetoothEnabled: isEnabled })
            }
        })
    }

    render() {
        return (
            <this.Stack
                onNavigationStateChange={(prevState: any, currentState: any) => {
                    const currentScreen = getCurrentRouteName(currentState)
                    const prevScreen = getCurrentRouteName(prevState)
                    if (prevScreen !== currentScreen) {
                        this.setState({ currentScreen: currentScreen })
                    }
                }}
                screenProps={{
                    toyController: this.toyController,
                    faceTracker: this.faceTracker,
                    deviceManager: this.toyManager,
                    currentScreen: this.state.currentScreen,
                    toys: this.state.toys,
                    stateManager: this.stateManager,
                    bluetoothEnabled: this.state.bluetoothEnabled,
                }} />
        )
    }
}

function getCurrentRouteName(navigationState: any): string | null {
    if (!navigationState) {
        return null;
    }
    const route = navigationState.routes[navigationState.index];
    // dive into nested navigators
    if (route.routes) {
        return getCurrentRouteName(route);
    }
    return route.routeName;
}

const navigateOnce = (getStateForAction: any) => (action: any, state: any) => {
    const { type, routeName } = action;
    return (
        state &&
        type === (NavigationActions as any).NAVIGATE &&
        routeName === state.routes[state.routes.length - 1].routeName
    ) ? null : getStateForAction(action, state);
    // you might want to replace 'null' with 'state' if you're using redux (see comments below)
};


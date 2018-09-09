import * as React from 'react';
import { NativeModules, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import * as colors from '../../colors';
import BannerAd from '../../components/banner_ad';
import { HeaderGear } from '../../components/header_gear';
import { Driver } from '../../driver';
import { FaceState } from '../../faceTracker';
import * as media from '../../media';
import * as routes from '../../routes';
import ScreenProps from './../screen_props';
import { HeartView } from './heart';
import { StatsView } from './stats';

const Button = require('apsl-react-native-button')
const Icon = require('react-native-vector-icons/MaterialIcons').default
const { withMappedNavigationProps } = require('react-navigation-props-mapper')


interface HomeViewProps extends ScreenProps { }

interface HomeViewState {
    playing: boolean
    level: number;
    faceState: FaceState | undefined;
}

export default withMappedNavigationProps(class HomeView extends React.Component<HomeViewProps, HomeViewState> {
    public static readonly route = routes.Home

    public static readonly navigationOptions = {
        title: 'Home',
        header: null
    }
    private _driver?: Driver;


    constructor(props: HomeViewProps) {
        super(props)

        this.state = {
            playing: true,
            level: 0,
            faceState: undefined
        }
    }

    componentDidMount() {
        this.onDidBecomeVisible();
    }

    componentWillUnmount() {
        this.onDidBecomeHidden();
    }

    componentWillReceiveProps(newProps: HomeViewProps) {
        if (newProps.screenProps.currentScreen !== this.props.screenProps.currentScreen) {
            if (newProps.screenProps.currentScreen === routes.Home) {
                this.onDidBecomeVisible();
            } else {
                this.onDidBecomeHidden();
            }
        }
    }

    private onDidBecomeVisible() {
        NativeModules.KeepAwake.setKeepScreenOn(true);

        if (!this._driver) {
            this._driver = new Driver(this.props.screenProps.toyController, this.props.screenProps.faceTracker, (data) => {
                this.setState({
                    level: data.level,
                    faceState: data.faceState
                });
            });
        }

        if (this.state.playing) {
            this._driver.start();
        }
    }

    private onDidBecomeHidden() {
        NativeModules.KeepAwake.setKeepScreenOn(false);
        if (this._driver) {
            this._driver.stop();
            this.setState({ level: 0 });
        }
    }

    render() {
        return (
            <SafeAreaView style={styles.wrapper}>
                <View style={[styles.content, styles.navButtons]}>
                    <View style={{ flex: 1 }} />
                    <HeaderGear
                        toys={this.props.screenProps.toys}
                        onPress={() => this.onSettingsButtonPress()} />
                </View>
                <View style={[styles.content, { flex: 1 }]}>
                    <HeartView
                        intensity={this.state.level}
                        faceState={this.state.faceState}
                        touchStart={() => {
                            if (this._driver) {
                                this._driver.touchStart()
                            }
                        }}
                        touchEnd={() => {
                            if (this._driver) {
                                this._driver.touchEnd()
                            }
                        }} />
                </View>
                <StatsView
                    faceState={this.state.faceState}
                    vibrationIntensity={this.state.level}
                    style={styles.content}
                    playing={this.state.playing} />
                <View style={styles.controls}>
                    <Button style={styles.controlButton}
                        onPress={() => this.togglePlay()}>
                        <Icon name={this.state.playing ? 'stop' : 'play-arrow'} size={media.on5SOrSmaller() ? 36 : 45} color={colors.darkGray} />
                    </Button>
                </View>
                <BannerAd />
            </SafeAreaView>
        )
    }

    private togglePlay(): void {
        if (this.state.playing) {
            this.stop()
        } else {
            this.play()
        }
    }

    private play(): void {
        this.setState({ playing: true });
        if (this._driver) {
            this._driver.start();
        }
    }

    private stop(): void {
        this.setState({ playing: false, level: 0 });
        if (this._driver) {
            this._driver.stop();
        }
    }

    private onSettingsButtonPress(): void {
        this.props.navigation.navigate(routes.Settings)
    }
});

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: colors.white,
        flex: 1
    },
    content: {
        paddingLeft: 16,
        paddingRight: 16
    },
    createdText: {
        textAlign: 'center',
        fontWeight: 'bold',
        paddingTop: 24,
    },
    tweetText: {
        textAlign: 'center',
        fontFamily: 'Cormorant Garamond',
    },
    activeText: {
        textDecorationLine: 'underline',
        textDecorationStyle: 'solid',
        textDecorationColor: 'black'
    },
    navButtons: {
        flexDirection: 'row',
        height: 36,
    },
    controls: {
        paddingBottom: media.on5SOrSmaller() ? 4 : 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 8,
    },
    controlButton: {
        width: media.on5SOrSmaller() ? 55 : 65,
        height: media.on5SOrSmaller() ? 55 : 65,
        borderRadius: 100,
        backgroundColor: colors.white
    },
    loveButtonActive: {
        backgroundColor: colors.red,
        borderWidth: 0
    },
    noFaceTrackingAlert: {
        color: colors.gray,
        textAlign: 'center',
        paddingTop: 8,
        paddingBottom: 8
    }
})

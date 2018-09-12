import * as React from 'react';
import { Animated, Button, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Pages } from 'react-native-pages';
import Video from 'react-native-video';
import { SafeAreaView } from 'react-navigation';
import * as colors from '../colors';
import { on5SOrSmaller } from '../media';
import * as routes from '../routes';
import ScreenProps from './screen_props';

interface HelpSection {
    readonly videoUrl: string;
    readonly text: string;
}

const helpSections: HelpSection[] = [
    {
        videoUrl: 'help/help1.mp4',
        text: "Lekker lets you use your tongue to control your favorite sex toys",
    }, {
        videoUrl: 'help/help2.mp4',
        text: "To get started, turn on your bluetooth toy and select it in the app",
    }, {
        videoUrl: 'help/help3.mp4',
        text: "The main screen shows a 3D heart. Stick out your tongue to lick it. The heart is connected directly to the toys",
    }, {
        videoUrl: 'help/help4.mp4',
        text: "Keep licking to increase vibration strength. If your phone doesn't have a TrueDepth camera, you can also touch the heart to increase strength",
    }, {
        videoUrl: 'help/help5.mp4',
        text: "Tap on the gear icon in the top right corner to connect or disconnect toys, and to configure the app",
    }, {
        videoUrl: 'help/help6.mp4',
        text: "Have fun!",
    },
];

export default class AboutView extends React.Component<ScreenProps> {
    public static readonly route = routes.About;

    public static readonly navigationOptions = {
        title: 'About',
        gesturesEnabled: false,
    };

    private pageElements: JSX.Element[];
    private pages: HelpPage[] = [];
    private _currentPage = 0;

    constructor(props: ScreenProps) {
        super(props);

        this.pageElements = helpSections.map((page, i) =>
            <HelpPage key={i}
                ref={x => {
                    if (!x) {
                        return;
                    }

                    this.pages[i] = x;
                    if (i === 0) {
                        x.start();
                    }
                }}
                text={page.text}
                videoUrl={page.videoUrl}
            >
                {i === helpSections.length - 1
                    ? <Button title="Get Started" color={colors.lekkerRed} onPress={() => this.props.navigation.goBack()} />
                    : undefined}
            </HelpPage>);
    }

    private _progress = new Animated.Value(0);

    public componentDidMount() {
        this._progress.addListener(value => {
            if (!this.pages.length) {
                return;
            }

            const page = Math.round(value.value);
            if (page !== this._currentPage) {
                this.pages[this._currentPage].stop();
                this._currentPage = page;
                this.pages[page].start();
            }
        });
    }

    public componentWillUnmount() {
        this._progress.removeAllListeners();
    }

    public render() {
        return (
            <SafeAreaView style={styles.wrapper}>
                <StatusBar barStyle='default' />
                <Pages
                    style={{ flex: 1 }}
                    indicatorColor={colors.darkGray}
                    progress={this._progress}>
                    {this.pageElements}
                </Pages>
            </SafeAreaView>
        );
    }
}

class HelpPage extends React.PureComponent<HelpSection & { children?: JSX.Element[] | JSX.Element }, { playing: boolean }> {
    private _video: Video | null = null;

    constructor(props: HelpSection & { children: JSX.Element[] | JSX.Element }) {
        super(props);
        this.state = {
            playing: false,
        };
    }

    public start() {
        this.setState({ playing: true });
    }

    public stop() {
        this.setState({ playing: false });
        if (this._video) {
            this._video.seek(0);
        }
    }

    public render() {
        return (
            <View style={styles.view}>
                <Video source={{ uri: this.props.videoUrl }}
                    ref={x => this._video = x}
                    resizeMode={'cover'}
                    style={styles.backgroundVideo}
                    repeat={true}
                    paused={!this.state.playing}
                    onEnd={() => void 0}
                    onError={console.error}
                    muted={true}
                    volume={0}
                />
                <View style={{ flex: 2 / 3 }} />
                <View style={{ flex: 1 / 3, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={styles.text}>{this.props.text}</Text>
                    {this.props.children}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: colors.white,
        flex: 1,
    },
    view: {
        flex: 1,
        paddingTop: 30,
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    text: {
        textAlign: 'center',
        margin: 30,
        marginTop: 0,
        left: 0,
        right: 0,
        fontSize: on5SOrSmaller() ? 16 : 18,
        color: colors.black,
        fontFamily: 'Futura-Medium',
    },
});

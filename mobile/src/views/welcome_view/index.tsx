import * as React from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import * as colors from '../../colors';
import * as media from '../../media';
import * as routes from '../../routes';
import ScreenProps from '../screen_props';
import SelectToyView from './select_toy';

type WelcomeProps = ScreenProps;

/**
 * Landing page
 */
export default class WelcomePage extends React.Component<WelcomeProps> {
    public static readonly route = routes.Welcome;
    public static navigationOptions = {
        title: 'Welcome',
        gesturesEnabled: false,
        header: null,
    };

    private _onDone: () => void = () => void 0;

    public render() {
        const body = <SelectToyView
            {...this.props}
            onContinue={() => this.onContinue()}
            onDone={(cb: () => void) => {
                this._onDone = cb;
            }} />;

        return (
            <SafeAreaView style={styles.wrapper}>
                <View style={styles.view}>
                    <StatusBar barStyle='dark-content' />
                    <View style={styles.header}>
                        <Image style={styles.image} source={require('../../../images/home.png')} />
                    </View>
                    {body}
                </View>
            </SafeAreaView>
        );
    }

    private onContinue() {
        this.goHome();
    }

    private goHome() {
        this._onDone();
        this.props.navigation.navigate('Home');
    }
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: colors.white,
    },
    view: {
        flex: 1,
        alignItems: 'center',
        padding: 8,
    },
    image: {
        width: 250,
        height: 250,
    },
    header: {
        paddingTop: 60,
        paddingBottom: media.on5SOrSmaller() ? 10 : 20,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: 20,
    },
    footerText: {
        color: 'rgba(0, 0, 0, 0.6)',
        textAlign: 'center',
    },
    buttonText: {
        color: colors.white,
        fontFamily: 'HelveticaNeue',
        fontWeight: '300',
    },
    aboutButton: {
        borderWidth: 0,
    },
});

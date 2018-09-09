import * as React from 'react';
import { Button, Linking, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as colors from '../../colors';
import ToyListView from '../../components/device_list';
import * as config from '../../config';
import * as routes from '../../routes';
import { ToyController } from '../../toy_control';
import { ToyManager } from '../../toy_manager';
import { ToyList } from '../../toy_manager/toyList';
import ScreenProps from '../screen_props';

const AsplButton = require('apsl-react-native-button')


class SettingsSection extends React.Component<{ title?: JSX.Element }, {}> {
    render() {
        return (
            <View style={styles.section}>
                {this.props.title}
                {this.props.children}
            </View>
        )
    }
}

class ToysSection extends React.PureComponent<{ toys: ToyList, toyManager: ToyManager, toyController: ToyController, onSupportedDevices: () => void, scanning: boolean, bluetoothEnabled: boolean }> {
    render() {
        const deviceTitle = (
            <View style={{ display: 'flex', flexDirection: 'row' }}>
                <Text style={styles.sectionHeader}>TOYS</Text>
            </View>
        )

        return (
            <SettingsSection title={deviceTitle}>
                <View style={[styles.sectionBody]}>
                    <ToyListView
                        bluetoothEnabled={this.props.bluetoothEnabled}
                        toyManager={this.props.toyManager}
                        toyController={this.props.toyController}
                        toys={this.props.toys}
                        style={{ flex: 1, margin: 10 }}
                        scanning={this.props.scanning} />
                </View>
                <View>
                    <AsplButton
                        style={styles.supportedToysButton}
                        textStyle={[styles.supportedButtonText]}
                        onPress={() => this.props.onSupportedDevices()}>
                        Supported Toys
                    </AsplButton>
                </View>
            </SettingsSection>
        )
    }
}

// class PlaybackSection extends React.PureComponent<{ onPlaybackSpeedChange: (index: number) => void }> {
//     render() {
//         const playBackSpeedTitle = (
//             <View style={{ display: 'flex', flexDirection: 'row' }}>
//                 <Text style={styles.sectionHeader}>PLAYBACK</Text>
//             </View>
//         )

//         return (
//             <SettingsSection title={playBackSpeedTitle}>
//                 <View style={[styles.sectionBody]}>
//                     <Text>fdsafs</Text>
//                 </View>
//             </SettingsSection>
//         )
//     }
// }

interface SettingsViewProps extends ScreenProps { }

interface SetttingsViewState {
    scanning: boolean
}


export default class SettingsView extends React.Component<SettingsViewProps, SetttingsViewState> {
    public static readonly route = routes.Settings

    public static readonly navigationOptions = {
        title: 'Settings',
        gesturesEnabled: false,
        headerStyle: {
            backgroundColor: colors.red,
            borderBottomColor: colors.black,
        },
        headerTitleStyle: {
            color: colors.white
        },
        headerTintColor: colors.white
    }

    constructor(props: SettingsViewProps) {
        super(props)
        this.state = {
            scanning: false
        }
    }

    componentWillMount() {
        this.setState({
            scanning: this.props.screenProps.bluetoothEnabled
        })
    }

    componentWillReceiveProps() {
        this.setState({ scanning: this.props.screenProps.bluetoothEnabled })
    }

    render() {
        return (
            <ScrollView style={styles.view}>
                <StatusBar barStyle='light-content' />
                <ToysSection
                    bluetoothEnabled={this.props.screenProps.bluetoothEnabled}
                    toys={this.props.screenProps.toys}
                    toyController={this.props.screenProps.toyController}
                    toyManager={this.props.screenProps.deviceManager}
                    onSupportedDevices={() => this.onSupportedDevices()}
                    scanning={this.state.scanning} />
                {/* <PlaybackSection
                    onPlaybackSpeedChange={x => this.onPlaybackSpeedChange(x)} /> */}
                <SettingsSection>
                    <View style={styles.sectionBody}>
                        <Button
                            title='About'
                            onPress={this.onAbout.bind(this)}
                            color={colors.red} />
                    </View>
                    <View style={styles.sectionBody}>
                        <Button
                            title='Report an Issue'
                            onPress={this.onReport.bind(this)}
                            color={colors.red} />
                    </View>

                    <View style={{ paddingTop: 30 }}>
                        <Text style={{ textAlign: 'center', paddingBottom: 8, color: colors.gray }}>© 2018 Matt Bierner</Text>
                        <Text style={{ textAlign: 'center', color: colors.gray }}>Animations by Emilio Yebra</Text>
                    </View>
                </SettingsSection>

            </ScrollView>
        )
    }

    private onAbout(): void {
        this.props.navigation.navigate(routes.About)
    }

    private onReport(): void {
        Linking.openURL(config.reportIssueUrl)
    }

    private onSupportedDevices(): void {
        this.props.navigation.navigate(routes.SupportedToys);
    }
}

const styles = StyleSheet.create({
    view: {
        flex: 1,
        backgroundColor: colors.lightGray,
        paddingTop: 20
    },
    section: {
        marginTop: 20,
        marginBottom: 20,
    },
    sectionBody: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#eee',
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 6,
        paddingBottom: 6,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 6,
        borderRadius: 8
    },
    sectionHeader: {
        fontSize: 18,
        color: colors.gray,
        flex: 1,
        textAlign: 'center',
        paddingBottom: 18
    },
    button: {
        color: colors.red
    },
    supportedToysButton: {
        borderWidth: 0,
    },
    supportedButtonText: {
        color: colors.black,
        fontFamily: 'HelveticaNeue',
        fontWeight: '300',
        fontSize: 16
    },
})
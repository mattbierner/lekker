import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as colors from '../../colors';
import ToyListView from '../../components/device_list';
import * as routes from '../../routes';
import ScreenProps from '../screen_props';

const Button = require('apsl-react-native-button');

interface SelectToyProps extends ScreenProps {
    onContinue: () => void;
    onDone: (cb: () => void) => void;
}

interface SelectToyState {
    scanning: boolean;
}

export default class SelectToys extends React.Component<SelectToyProps, SelectToyState> {
    constructor(props: SelectToyProps) {
        super(props);
        this.state = {
            scanning: false,
        };

        this.props.onDone(() => {
            this.setState({ scanning: false });
        });
    }

    public componentDidMount() {
        this.setState({ scanning: this.props.screenProps.bluetoothEnabled });
    }

    public componentWillUnmount() {
        this.setState({ scanning: false });
    }

    public componentWillReceiveProps(newProps: SelectToyProps) {
        this.setState({ scanning: newProps.screenProps.bluetoothEnabled });
    }

    public render() {
        return (
            <View style={styles.view}>
                <Text style={styles.selectToyHeader}>Select Your Toys</Text>
                <ToyListView
                    bluetoothEnabled={this.props.screenProps.bluetoothEnabled}
                    style={styles.toyList}
                    toys={this.props.screenProps.toys}
                    toyController={this.props.screenProps.toyController}
                    toyManager={this.props.screenProps.deviceManager}
                    renderLoading={true}
                    scanning={this.state.scanning} />
                <Button
                    style={styles.supportedToysButton}
                    textStyle={[styles.buttonText, { fontSize: 12 }]}
                    onPress={() => this.onSupported()}>
                    Supported Toys
                </Button>
                <View style={{ flex: 1 }} />
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <Button
                        style={styles.continueButton}
                        textStyle={[styles.buttonText, { fontSize: 16 }]}
                        onPress={() => this.onAbout()}>
                        About
                    </Button>
                    <Button
                        style={styles.continueButton}
                        textStyle={[styles.buttonText, { fontSize: 16 }]}
                        onPress={this.props.onContinue}>
                        {this.props.screenProps.toys.hasConnected ? 'Continue' : 'Skip'}
                    </Button>
                </View>
            </View>
        );
    }

    private onSupported() {
        this.props.navigation.navigate(routes.SupportedToys);
    }

    private onAbout() {
        this.props.navigation.navigate(routes.About);
    }
}

const styles = StyleSheet.create({
    view: {
        flex: 1,
        alignSelf: 'stretch',
    },
    buttonText: {
        color: colors.black,
        fontFamily: 'HelveticaNeue',
        fontWeight: '300',
    },
    selectToyHeader: {
        textAlign: 'center',
        color: colors.black,
        fontSize: 16,
        marginBottom: 10,
        fontWeight: '300',
    },
    supportedToysButton: {
        borderWidth: 0,
    },
    continueButton: {
        borderWidth: 0,
        flex: 1,
    },
    toyList: {
        backgroundColor: '#eee',
        alignSelf: 'stretch',
        padding: 10,
        borderRadius: 8,
    },
});

import * as React from 'react';
import { ActivityIndicator, FlatList, Image, StyleProp, StyleSheet, Switch, Text, TouchableHighlight, View, ViewStyle } from 'react-native';
import * as colors from '../colors';
import { ToyController } from '../toy_control';
import { ToyManager } from '../toy_manager';
import { Toy, ToyConnectionType, ToyType } from '../toy_manager/toy';
import { ToyList } from '../toy_manager/toyList';
import { Milliseconds } from '../util/time_units';


class ToyIcon extends React.Component<{ toy: Toy }> {
    render() {
        switch (this.props.toy.type) {
            case ToyType.Hush:
                return <Image style={styles.toyIcon} source={require('../../images/hush.png')} />

            case ToyType.Lush:
                return <Image style={styles.toyIcon} source={require('../../images/lush.png')} />

            default:
                return <View />
        }
    }
}


class ToyRow extends React.Component<{ toy: Toy, onChangeConnection: (toy: Toy, connected: boolean) => void, toyController: ToyController }> {
    render() {
        return (
            <TouchableHighlight onPress={() => this.onPress()} underlayColor='transparent' activeOpacity={this.props.toy.connectionType === ToyConnectionType.Connected ? 0.75 : 1}>
                <View style={styles.row}>
                    <ToyIcon toy={this.props.toy} />
                    <Text style={styles.toyLabel}>{this.props.toy.displayName}</Text>
                    {this.props.toy.connectionType === ToyConnectionType.Connecting || this.props.toy.connectionType === ToyConnectionType.Disconnecting
                        ? <ActivityIndicator animating={true} size='small' style={{ marginRight: 8 }} />
                        : undefined}
                    <Switch
                        value={this.props.toy.connectionType === ToyConnectionType.Connected || this.props.toy.connectionType === ToyConnectionType.Connecting}
                        disabled={this.props.toy.connectionType === ToyConnectionType.Connecting || this.props.toy.connectionType === ToyConnectionType.Disconnecting}
                        onValueChange={value => this.onSwitch(value)} />
                </View>
            </TouchableHighlight>
        )
    }

    private onSwitch(newValue: boolean) {
        this.props.onChangeConnection(this.props.toy, newValue)
    }

    private onPress() {
        if (this.props.toy.connectionType === ToyConnectionType.Connected) {
            this.props.toyController.setVibrationStrength(20, new Milliseconds(500)).then(() => {
                setTimeout(() => {
                    this.props.toyController.setVibrationStrength(0, new Milliseconds(1000))
                }, 250)
            })
        }
    }
}


interface ToyListProps {
    bluetoothEnabled: boolean
    toys: ToyList
    toyManager: ToyManager
    toyController: ToyController
    style: StyleProp<ViewStyle>
    onDidConnectToy?: (toy: Toy) => void
    renderLoading?: boolean
    scanning: boolean
}

type ToyRowElement = Toy | 'loading' | 'bluetooth-alert'

export default class ToyListView extends React.Component<ToyListProps, {}> {
    private _keyExtractor = (item: ToyRowElement) => typeof item === 'string' ? item : item.identifier

    private _scanning: boolean = false

    componentDidMount() {
        this.toggleScan(this.props.scanning)
    }

    componentWillUnmount(): void {
        this.toggleScan(false)
    }

    componentWillReceiveProps(newProps: ToyListProps) {
        this.toggleScan(newProps.scanning)
    }

    render() {
        let data: ToyRowElement[] = Array.from(this.props.toys)
        if (this.props.renderLoading || this.props.toys.isEmpty) {
            data.push('loading')
        }

        if (!this.props.bluetoothEnabled) {
            data = ['bluetooth-alert'];
        }

        return (
            <FlatList
                style={this.props.style}
                data={data}
                renderItem={({ item }) => this.renderRow(item)}
                keyExtractor={this._keyExtractor} />
        )
    }

    private renderRow(rowData: ToyRowElement) {
        if (rowData === 'bluetooth-alert') {
            return (
                <View style={[styles.row, { height: 40, justifyContent: 'center' }]}>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>Please enable bluetooth</Text>
                </View>
            )
        }

        if (rowData === 'loading') {
            return (
                <View style={[styles.row, { height: 40, justifyContent: 'center' }]}>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>Scanning...</Text>
                    <ActivityIndicator size='small' style={{ marginLeft: 8 }} />
                </View>
            )
        }

        return <ToyRow
            toy={rowData}
            toyController={this.props.toyController}
            onChangeConnection={(toy, connected) => this.changeConnection(toy, connected)} />
    }

    private changeConnection(toy: Toy, connected: boolean) {
        if (connected) {
            this.props.toyManager.connectToy(toy)
                .then(toy => {
                    if (this.props.onDidConnectToy) {
                        this.props.onDidConnectToy(toy)
                    }
                })
        } else {
            this.props.toyManager.disconnectToy(toy)
        }
    }

    private toggleScan(newScanning: boolean) {
        if (this._scanning === newScanning) {
            return
        }

        if (newScanning) {
            this.props.toyManager.beginScan((toys: ToyList) => {
                this.setState({ toys });
            })
        } else {
            this.props.toyManager.stopScan()
        }

        this._scanning = newScanning
    }
}


const styles = StyleSheet.create({
    row: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 4,
        paddingBottom: 4
    },
    toyLabel: {
        flex: 1
    },
    toyIcon: {
        width: 40,
        height: 40,
        marginRight: 8
    }
})
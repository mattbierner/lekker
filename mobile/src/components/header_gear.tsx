import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as colors from '../colors';
import { ToyConnectionType } from '../toy_manager/toy';
import { ToyList } from '../toy_manager/toyList';

const Icon = require('react-native-vector-icons/MaterialIcons').default
const Button = require('apsl-react-native-button')


export class Badge extends React.PureComponent<{ toys: ToyList }> {
    render() {
        const connected = Array.from(this.props.toys).filter(toy => toy.connectionType === ToyConnectionType.Connected)
        if (connected.length) {
            return (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{connected.length}</Text>
                    <View style={styles.badgeBorder} />
                </View>
            )
        }
        return <View />
    }
}

export class HeaderGear extends React.PureComponent<{ onPress: () => void, toys: ToyList }> {
    render() {
        return (
            <Button
                style={styles.devicesButton}
                onPress={this.props.onPress}>
                <Icon name='settings' size={30} color={colors.darkGray} />
                <Badge toys={this.props.toys} />
            </Button>
        )
    }
}

const styles = StyleSheet.create({
    devicesButton: {
        borderWidth: 0,
        width: 40,
        height: 40,
        marginBottom: 0
    },
    badge: {
        backgroundColor: colors.darkGray,
        borderRadius: 8,
        width: 14,
        height: 14,
        position: 'absolute',
        bottom: 4,
        left: 2
    },
    badgeBorder: {
        backgroundColor: 'transparent',
        borderColor: colors.white,
        borderWidth: 2,
        borderRadius: 10,
        width: 16,
        height: 16,
        position: 'absolute',
        top: -1,
        left: -1
    },
    badgeText: {
        textAlign: 'center',
        fontSize: 10,
        backgroundColor: 'transparent',
        color: colors.white,
        lineHeight: 14
    }
})

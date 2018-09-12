import * as React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import * as colors from '../colors';
import * as routes from '../routes';
import ScreenProps from './screen_props';

interface SupportedToy {
    readonly label: string;
    readonly icon: any;
}

const supportedToys: SupportedToy[] = [
    {
        label: 'Lovense Lush Vibrator',
        get icon() { return require('../../images/lush.png'); },
    },
    {
        label: 'Lovense Hush Vibrator',
        get icon() { return require('../../images/hush.png'); },
    },
];

export default class SupportedToys extends React.Component<ScreenProps> {
    private _keyExtractor = (item: SupportedToy) => item.label;

    public static readonly route = routes.SupportedToys;
    public static navigationOptions = {
        title: 'Supported Toys',
        gesturesEnabled: false,
        headerStyle: {
            backgroundColor: colors.red,
        },
        headerTitleStyle: {
            color: colors.white,
        },
        headerTintColor: colors.white,
    };

    public render() {
        return (
            <SafeAreaView style={styles.wrapper}>
                <FlatList
                    data={supportedToys}
                    keyExtractor={this._keyExtractor}
                    renderItem={({ item }) => this.renderItem(item)} />
                <View style={{ borderTopWidth: 1, borderTopColor: colors.lightGray, paddingTop: 16, padding: 8 }}>
                    <Text style={styles.notAssociatedWarning}>Lekker is not associated with or endorsed by any toy manufactures</Text>
                </View>
            </SafeAreaView>
        );
    }

    private renderItem(item: SupportedToy) {
        return (
            <View style={styles.row}>
                <Image
                    source={item.icon}
                    style={styles.toyIcon} />
                <Text style={styles.toyLabel}>{item.label}</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: colors.white,
    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 32,
        paddingRight: 32,
    },
    notAssociatedWarning: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
    toyLabel: {
        flex: 1,
        paddingLeft: 16,
    },
    toyIcon: {
        width: 60,
        height: 60,
        marginRight: 8,
    },
});

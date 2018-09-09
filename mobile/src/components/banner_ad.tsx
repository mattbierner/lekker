import * as React from 'react';
import { View } from 'react-native';
import * as config from '../config';


const { AdMobBanner } = require('react-native-admob');

interface BannerAdProps {
    onAdOpened?: () => void
}

interface BannerAdState {
    error?: Error
}

export default class BannerAd extends React.Component<BannerAdProps, BannerAdState> {
    constructor(props: any) {
        super(props);
        this.state = {}
    }

    render() {
        if (this.state.error || config.disableAds) {
            return <View />
        }

        return (
            <AdMobBanner
                style={{ height: 50 }}
                adSize="smartBannerPortrait"
                adUnitID={config.adUnitId}
                testDevices={[AdMobBanner.simulatorId]}
                onAdOpened={this.props.onAdOpened}
                onAdLeftApplication={this.props.onAdOpened}
                onAdFailedToLoad={(error: any) => {
                    this.setState({ error })
                }} />
        )
    }
}
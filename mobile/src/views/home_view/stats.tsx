import * as React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as colors from '../../colors';
import { FaceState } from '../../faceTracker';

interface StatsViewProps {
    readonly style: ViewStyle;
    readonly vibrationIntensity: number;
    readonly faceState: FaceState | undefined;

    readonly playing: boolean;
}

export class StatsView extends React.PureComponent<StatsViewProps> {
    public render() {
        const intensity = Math.max(0.025, this.props.vibrationIntensity);

        return <View style={this.props.style}>
            <View style={styles.bar}>
                <Text style={styles.label}>Intensity</Text>
                <Bar value={intensity} />
            </View>
            <TongueStatus
                faceState={this.props.faceState}
                playing={this.props.playing} />
        </View>;
    }
}

const TongueStatus = (props: { faceState: FaceState | undefined, playing: boolean }) => {
    const tongue = Math.max(0.025, props.faceState ? (props.faceState.tongue || 0) : 0);

    if (props.faceState && !props.faceState.isTrackingEnabled) {
        return <View style={styles.tongueStatus}>
            <Text style={styles.noFaceTrackingAlert}>face tracking not supported</Text>
        </View>;
    }

    if (props.faceState && !props.faceState.isActivelyTracking && props.playing) {
        return <View style={styles.tongueStatus}>
            <Text style={styles.noFaceTrackingAlert}>Bring your face into view</Text>
        </View>;
    }

    return <View style={styles.tongueStatus}>
        <View style={styles.bar}>
            <Text style={styles.label}>Tongue</Text>
            <Bar value={tongue} />
        </View>
    </View>;
};

const Bar = (props: { value: number }) =>
    <View style={{ display: 'flex', flexDirection: 'row' }}>
        <View style={{ flex: (1 - props.value) / 2 }} />
        <View style={{ backgroundColor: colors.red, flex: props.value, height: 10 }} />
        <View style={{ flex: (1 - props.value) / 2 }} />
    </View>;

const styles = StyleSheet.create({
    bar: {
        paddingTop: 4,
        paddingBottom: 6,
    },
    label: {
        textAlign: 'center',
    },
    noFaceTrackingAlert: {
        color: colors.gray,
        textAlign: 'center',
        paddingTop: 8,
        paddingBottom: 8,
    },
    tongueStatus: {
        height: 36,
    },
});

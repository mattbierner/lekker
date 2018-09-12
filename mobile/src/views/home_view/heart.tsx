import * as React from 'react';
import { WebView } from 'react-native';
import * as colors from '../../colors';
import * as config from '../../config';
import { FaceState } from '../../faceTracker';
import { delay } from '../../util/timer';
import { Milliseconds } from '../../util/time_units';

interface HeartViewProps {
    readonly intensity: number;
    readonly faceState: FaceState | undefined;

    readonly touchStart: () => void;
    readonly touchEnd: () => void;
}

interface HeartViewState {
    enabled: boolean;
}

export class HeartView extends React.PureComponent<HeartViewProps, HeartViewState> {
    private _ref: WebView | null = null;

    private _webviewInstance = Date.now();

    constructor(props: HeartViewProps) {
        super(props);
        this.state = {
            enabled: false,
        };
    }

    public componentWillMount() {
        this._webviewInstance = Date.now();
        delay(new Milliseconds(200)).then(() => { this.setState({ enabled: true }); });
    }

    public componentWillUpdate(newProps: HeartViewProps) {
        if (!this._ref) {
            return;
        }

        this._ref.postMessage(JSON.stringify({
            name: 'update',
            intensity: newProps.intensity,
            faceState: newProps.faceState,
        }));
    }

    public render() {
        return <WebView
            style={{ flex: 1, backgroundColor: colors.white }}
            scrollEnabled={false}
            source={config.useLocalHostWebview ? { uri: 'http://imac.local:8080?' + this._webviewInstance } : { uri: 'index.html', baseUrl: '.' }}
            ref={(self: any) => this._ref = self}
            onMessage={message => this.handleMessage(message.nativeEvent.data)}
            originWhitelist={['file://*']} />;
    }

    private handleMessage(data: any) {
        const body = JSON.parse(data);
        switch (body.name) {
            case 'touchStart':
                this.props.touchStart();
                break;
            case 'touchEnd':
                this.props.touchEnd();
                break;
        }
    }
}

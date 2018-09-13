#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
@import CoreBluetooth;

@interface ToyManager : RCTEventEmitter <
    RCTBridgeModule,
    CBCentralManagerDelegate,
    CBPeripheralDelegate>
{
    CBCentralManager* _cbManager;
    NSMutableDictionary* _peripheralConnectionCallbacks;
    NSMutableDictionary* _connected;
    NSMutableDictionary* _connecting;

    BOOL _scanning;
    
    NSTimer* _pinger;
    CFAbsoluteTime _lastUpdate;
    
    BOOL _observing;
}

@property (nonatomic, retain) CBCentralManager* cbManager;
@end

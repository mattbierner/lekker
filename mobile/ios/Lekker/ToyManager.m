#import "ToyManager.h"
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import "LovenseController.h"

NSString* const didDiscoverPeripheralEventName =  @"ToyManager.didDiscoverPeripheral";
NSString* const didDisconnectPeripheralEventName =  @"ToyManager.didDisconnectPeripheral";
NSString* const didToggleBluetoothEventName =  @"ToyManager.didToggleBluetooth";


@implementation ToyManager

RCT_EXPORT_MODULE();

- (instancetype) init {
    self = [super init];

    _peripheralConnectionCallbacks = [[NSMutableDictionary alloc] init];
    _connected = [[NSMutableDictionary alloc] init];
    _connecting = [[NSMutableDictionary alloc] init];

    _observing = false;
    _scanning = NO;
    
    _lastUpdate = 0;
    return self;
}

+ (BOOL) requiresMainQueueSetup
{
    return YES;
}

- (void) dealloc {
    if (_cbManager) {
        for (NSString* key in _connected) {
            LovenseVibratorController* toy = _connected[key];
            [self.cbManager cancelPeripheralConnection:toy.peripheral];
        }
    }
}

- (CBCentralManager*) cbManager {
    if (!_cbManager) {
        _cbManager = [[CBCentralManager alloc] initWithDelegate:self queue:nil options:nil];
    }
    return _cbManager;
}

- (void) ping:(NSTimer*)timer {
    CFAbsoluteTime now = CFAbsoluteTimeGetCurrent();
    if (now - _lastUpdate >= 5.0) {
        for (NSString* key in _connected) {
            LovenseVibratorController* toy = _connected[key];
            [toy setVibration:0 onComplete:^(BOOL didUpdate, NSError* err) { }];
        }
    }
    _lastUpdate = now;
}

- (NSString*) getToyType:(CBPeripheral*)peripheral {
    if ([peripheral.name containsString:@"LVS-S"] || [peripheral.name containsString:@"LVS-Lush"]) {
        return @"lush";
    }
    if ([peripheral.name containsString:@"LVS-Z"]) {
        return @"hush";
    }
    return @"unknown";
}

- (NSArray<NSString*>*) supportedEvents {
    return @[
             didDiscoverPeripheralEventName,
             didDisconnectPeripheralEventName,
             didToggleBluetoothEventName
             ];
}

- (void) startObserving {
    _observing = YES;
}

- (void) stopObserving {
    _observing = NO;
}

RCT_REMAP_METHOD(startScan,
    startScanResolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
{
    if (_scanning) {
        reject(@"cannotNestScans", @"Already scanning", nil);
        return;
    }
    
    if (self.cbManager.state != CBManagerStatePoweredOn) {
        reject(@"bluetoothOff", @"Bluetooth powered off", nil);
        return;
    }
    _scanning = YES;
    
    NSMutableArray* services = [[NSMutableArray alloc] init];
    for (LovenseDeviceConnectionInfo* info in LovenseVibratorController.connectionInfo) {
        [services addObject:info.serviceUUID];
    }
    
    [self.cbManager scanForPeripheralsWithServices:services
                                         options:@{
                                                   CBCentralManagerScanOptionAllowDuplicatesKey: @YES
                                                   }];
    resolve(@YES);
}

RCT_EXPORT_METHOD(stopScan)
{
    if (_scanning) {
        [self.cbManager stopScan];
        _scanning = NO;
    }
}

RCT_REMAP_METHOD(connectToy,
    toy:(NSString*)toy
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
{
    NSArray<CBPeripheral*>* peripherals = [self.cbManager retrievePeripheralsWithIdentifiers:@[[[NSUUID alloc] initWithUUIDString:toy]]];
    if (!peripherals || peripherals.count == 0) {
        reject(@"unknownPeripheral", @"Unknown peripheral", nil);
        return;
    }
    
    CBPeripheral* peripheral = [peripherals objectAtIndex:0];
    
    NSMutableArray* callbacks = [_peripheralConnectionCallbacks objectForKey:toy];
    if (!callbacks) {
        callbacks = [[NSMutableArray alloc] init];
        [_peripheralConnectionCallbacks setObject:callbacks forKey:toy];
    }
    [callbacks addObject:resolve];
    [_connecting setObject:peripheral forKey:toy];
    [self.cbManager connectPeripheral:peripheral options:nil];
}

RCT_REMAP_METHOD(disconnectToy,
    toy:(NSString*)toy
    disconnectToyResolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
{
    NSArray<CBPeripheral*>* peripherals = [self.cbManager retrievePeripheralsWithIdentifiers:@[[[NSUUID alloc] initWithUUIDString:toy]]];
    if (!peripherals || peripherals.count == 0) {
        reject(@"unknownPeripheral", @"Unknown peripheral", nil);
        return;
    }
    
    CBPeripheral* peripheral = [peripherals objectAtIndex:0];
    NSMutableArray* callbacks = [_peripheralConnectionCallbacks objectForKey:toy];
    if (!callbacks) {
        callbacks = [[NSMutableArray alloc] init];
        [_peripheralConnectionCallbacks setObject:callbacks forKey:toy];
    }
    [callbacks addObject:resolve];
    [_connecting removeObjectForKey:toy];

    [self.cbManager cancelPeripheralConnection:peripheral];
}

- (void) centralManagerDidUpdateState:(CBCentralManager *)central
{
    switch (central.state) {
        case CBManagerStatePoweredOn:
            if (_observing) {
                [self sendEventWithName:didToggleBluetoothEventName body:@YES];
            }
            break;
        
        case CBManagerStatePoweredOff:
        default:
            if (_observing) {
                [self sendEventWithName:didToggleBluetoothEventName body:@NO];
            }
            break;
    }
}

- (void)centralManager:(CBCentralManager *)central
 didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary *)advertisementData
                  RSSI:(NSNumber *)RSSI
{
    if (_observing) {
        [self sendEventWithName:didDiscoverPeripheralEventName
         body:@{@"name": peripheral.name,
                @"identifier": peripheral.identifier.UUIDString,
                @"type": [self getToyType:peripheral]
                }];
    }
}

- (void)centralManager:(CBCentralManager *)central
  didConnectPeripheral:(CBPeripheral *)peripheral
{
    peripheral.delegate = self;
    
    NSMutableArray* services = [[NSMutableArray alloc] init];
    for (LovenseDeviceConnectionInfo* info in LovenseVibratorController.connectionInfo) {
        [services addObject:info.serviceUUID];
    }
    
    [peripheral discoverServices:services];
}

- (void) peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error {
    if ([[LovenseVibratorController lushPeripheralNames] containsObject:peripheral.name] ||
        [[LovenseVibratorController hushPeripheralNames] containsObject:peripheral.name])
    {
        BOOL found = NO;
        for (LovenseDeviceConnectionInfo* info in LovenseVibratorController.connectionInfo) {
            for (CBService* service in peripheral.services) {
                if ([info.serviceUUID isEqual:service.UUID]) {
                    [LovenseVibratorController createWithPeripheral:peripheral connectionInfo:info onReady:^(LovenseVibratorController* device, NSError* err) {
                        [_connected setObject:device forKey:peripheral.identifier.UUIDString];
                    }];
                    found = YES;
                    break;
                }
            }
            if (found) {
                break;
            }
        }
    }
    
    NSMutableArray* callbacks = [_peripheralConnectionCallbacks objectForKey:peripheral.identifier.UUIDString];
    if (callbacks) {
        for (RCTPromiseResolveBlock callback in callbacks) {
            callback(peripheral.identifier.UUIDString);
        }
        [_peripheralConnectionCallbacks removeObjectForKey:peripheral.identifier.UUIDString];
    }
    
    [_connecting removeObjectForKey:peripheral.identifier.UUIDString];
}

- (void) centralManager:(CBCentralManager *)central
didDisconnectPeripheral:(CBPeripheral *)peripheral
                  error:(NSError *)error
{
    NSLog(@"Disconnect peripheral: %@",peripheral);

    if (error) {
        [self.cbManager connectPeripheral:peripheral options:nil];
        return;
    }

    NSMutableArray* callbacks = [_peripheralConnectionCallbacks objectForKey:peripheral.identifier.UUIDString];
    if (callbacks) {
        for (RCTPromiseResolveBlock callback in callbacks) {
            callback(peripheral.identifier.UUIDString);
        }
        [_peripheralConnectionCallbacks removeObjectForKey:peripheral.identifier.UUIDString];
    }
    
    [_connected removeObjectForKey:peripheral.identifier.UUIDString];
    [_connecting removeObjectForKey:peripheral.identifier.UUIDString];

    if (_observing) {
        [self sendEventWithName:didDisconnectPeripheralEventName
                           body:@{@"name": peripheral.name,
                                  @"identifier": peripheral.identifier.UUIDString,
                                  @"type": [self getToyType:peripheral]
                                  }];
    }
}


- (void)centralManager:(CBCentralManager *)central
didFailToConnectPeripheral:(CBPeripheral *)peripheral
                 error:(NSError *)error
{
    NSLog(@"Connection failed to peripheral: %@",peripheral);
    
    [_connecting removeObjectForKey:peripheral.identifier.UUIDString];
    
    NSMutableArray* callbacks = [_peripheralConnectionCallbacks objectForKey:peripheral.identifier.UUIDString];
    if (callbacks) {
        for (RCTPromiseResolveBlock callback in callbacks) {
            callback(peripheral.identifier.UUIDString);
        }
        [_peripheralConnectionCallbacks removeObjectForKey:peripheral.identifier.UUIDString];
    }
}

RCT_REMAP_METHOD(getBluetoothEnabled,
                 resolveDetBluetoothEnabled:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    if (_cbManager) {
        if (_observing) {
            [self sendEventWithName:didToggleBluetoothEventName body:_cbManager.state == CBManagerStatePoweredOn ? @YES : @NO];
        }
    } else {
        // Force init
        (void)self.cbManager;
    }
    resolve([NSNull null]);
}

RCT_REMAP_METHOD(setVibration,
                 strength:(nonnull NSNumber*)strength
                 resolveSetVibration:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    NSLog(@"setVibration: %@", strength);
    _lastUpdate = CFAbsoluteTimeGetCurrent();
    if (_connected.count == 0) {
        resolve(@YES);
        return;
    }
    
    __block NSUInteger waitingFor = _connected.count;
    
    for (NSString* key in _connected) {
        LovenseVibratorController* toy = _connected[key];
        [toy setVibration:strength.unsignedIntValue onComplete:^(BOOL didUpdate, NSError* err) {
            if (err) {
                NSLog(@"ERRor setVibration: %@", err);
            }
            --waitingFor;
            if (waitingFor <= 0) {
                resolve(@YES);
            }
        }];
    }
}

@end

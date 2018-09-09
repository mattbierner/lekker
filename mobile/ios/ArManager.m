#import "ArManager.h"
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import "LovenseController.h"
@import ARKit;

static NSString* const updatedFaceEvent = @"updatedFace";
static NSString* const updateIsTracking = @"updatedIsTracking";

@interface ArManager ( )
{
    ARSession* _session;
    NSTimer* _timer;
    BOOL _isTracking;
}
@end


@implementation ArManager

RCT_EXPORT_MODULE();

- (instancetype) init {
    self = [super init];
    _isTracking = NO;
    return self;
}

+ (BOOL) requiresMainQueueSetup
{
    return YES;
}

- (NSArray<NSString*>*) supportedEvents {
    return @[
             updatedFaceEvent,
             updateIsTracking
             ];
}

-(void)startObserving {

}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
    if (_timer) {
        [_timer invalidate];
        _timer = nil;
    }
}

RCT_REMAP_METHOD(getFaceArEnabled,
                 resolveGetFaceArEneabled:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    resolve([NSNumber numberWithBool:[ARFaceTrackingConfiguration isSupported]]);
}

#define MOCK_FACE_TRACKING 0

RCT_REMAP_METHOD(beginFaceTracking,
                 resolveBeginFaceTracking:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
#if MOCK_FACE_TRACKING
    dispatch_async(dispatch_get_main_queue(), ^{
        if (_timer) {
            [_timer invalidate];
        }
        _timer = [NSTimer scheduledTimerWithTimeInterval: 0.1 repeats:true block:^(NSTimer * _Nonnull timer) {
            simd_float4x4 mat = matrix_identity_float4x4;
            SCNMatrix4 mat2 = SCNMatrix4MakeRotation(sin([NSDate date].timeIntervalSince1970 / 4.0), 0, 1, 0);
            mat = SCNMatrix4ToMat4(mat2);
            NSMutableArray* transfrorm = [[NSMutableArray alloc] init];
            for (int i = 0; i< 4; ++i) {
                [transfrorm addObject:@[
                                        [NSNumber numberWithFloat:mat.columns[i][0]],
                                        [NSNumber numberWithFloat:mat.columns[i][1]],
                                        [NSNumber numberWithFloat:mat.columns[i][2]],
                                        [NSNumber numberWithFloat:mat.columns[i][3]]
                                        ]];
            }
            
            if (self.bridge && [self.bridge isValid]) {
            [self sendEventWithName:updatedFaceEvent body:@{
                                                            @"tongue": [NSNumber numberWithFloat:(sin([NSDate date].timeIntervalSince1970 * 5.0) + 1.0) / 2.0],
                                                            @"transfrorm": transfrorm
                                                            }];
            }
        }];
    });
    resolve([NSNull null]);
    return;
#endif
    
    if (![ARFaceTrackingConfiguration isSupported]) {
        reject(@"trackingNotSupported", @"Face tracking is not supported on your device", nil);
        return;
    }
    
    dispatch_async(dispatch_get_main_queue(), ^{
        _isTracking = NO;
        
        _session = [[ARSession alloc] init];
        _session.delegate = self;
        
        ARFaceTrackingConfiguration* config = [ARFaceTrackingConfiguration new];
        config.worldAlignment = ARWorldAlignmentCamera;
        [_session runWithConfiguration:config options:ARSessionRunOptionResetTracking];
        
        resolve([NSNull null]);
    });
}


RCT_REMAP_METHOD(stopFaceTracking,
                 resolveStopFaceTracking:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
    if (_session) {
        _session.delegate = nil;
    }
    _session = nil;
    _isTracking = NO;
    resolve([NSNull null]);
}

- (void) session:(ARSession *)session didAddAnchors:(nonnull NSArray<ARAnchor *> *)anchors {
    [self updateForAnchors:anchors];
}

- (void) session:(ARSession *)session didRemoveAnchors:(nonnull NSArray<ARAnchor *> *)anchors {
    [self updateForAnchors:anchors];
}

- (void) session:(ARSession *)session didUpdateAnchors:(NSArray<ARAnchor *> *)anchors {
    [self updateForAnchors:anchors];
}

- (void) updateForAnchors: (NSArray<ARAnchor *> *)anchors {
    if (!self.bridge || ![self.bridge isValid]) {
        return;
    }
    
    bool found = NO;
    for (ARFaceAnchor* anchor in anchors) {
        if (![anchor isKindOfClass:[ARFaceAnchor class]]) {
            continue;
        }
        
        NSMutableArray* transfrorm = [[NSMutableArray alloc] init];
        for (int i = 0; i < 4; ++i) {
            [transfrorm addObject:@[
                                    [NSNumber numberWithFloat:anchor.transform.columns[i][0]],
                                    [NSNumber numberWithFloat:anchor.transform.columns[i][1]],
                                    [NSNumber numberWithFloat:anchor.transform.columns[i][2]],
                                    [NSNumber numberWithFloat:anchor.transform.columns[i][3]]
                                    ]];
        }
        
        found = true;
        
        NSNumber* value = [anchor.blendShapes valueForKey:ARBlendShapeLocationTongueOut];
        [self sendEventWithName:updatedFaceEvent body:@{ @"tongue": value, @"transfrorm": transfrorm }];
        
        if (_isTracking != anchor.isTracked) {
            _isTracking = anchor.isTracked;
            [self sendEventWithName:updateIsTracking body:@{ @"isTracking": [NSNumber numberWithBool:anchor.isTracked] }];
        }
    }
    
    if (!found) {
        [self sendEventWithName:updatedFaceEvent body:@{
                                                        @"tongue":@0.0,
                                                        @"transfrorm": [NSNull null]
                                                        }];
    }
}

@end

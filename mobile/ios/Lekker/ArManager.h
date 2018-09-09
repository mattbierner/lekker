#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
@import ARKit;

@interface ArManager : RCTEventEmitter <
    RCTBridgeModule,
    ARSessionDelegate>
{
}
@end

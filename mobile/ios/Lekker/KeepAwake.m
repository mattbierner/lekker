#import "KeepAwake.h"
#import <React/RCTLog.h>


@implementation KeepAwake

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setKeepScreenOn:(BOOL)screenShouldBeKeptOn)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        [[UIApplication sharedApplication] setIdleTimerDisabled:screenShouldBeKeptOn];
    });
}

@end

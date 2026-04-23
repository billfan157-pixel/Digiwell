#import <Capacitor/Capacitor.h>

CAP_PLUGIN(WidgetPlugin, "WidgetPlugin",
    CAP_PLUGIN_METHOD(syncData, CAPPluginReturnPromise);
)
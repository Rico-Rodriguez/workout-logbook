import Capacitor
import UIKit

@objc(NativeKitPlugin)
public class NativeKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeKitPlugin"
    public let jsName = "NativeKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setKeepAwake", returnType: CAPPluginReturnPromise)
    ]

    @objc func setKeepAwake(_ call: CAPPluginCall) {
        let on = call.getBool("on", false)
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = on
            call.resolve()
        }
    }
}

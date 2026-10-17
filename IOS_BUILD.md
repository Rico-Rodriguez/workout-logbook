# iOS build

Wraps the unchanged web app (index.html, app.js, manifest.webmanifest) in a
Capacitor 7 iOS shell. Pushing to `cursor/ios-unsigned-ipa-bdc2` (or running the
workflow manually) runs `.github/workflows/ios-ipa.yml` on a macOS runner, which
builds an **unsigned** IPA and publishes it to the `ios-v1` pre-release:

https://github.com/Rico-Rodriguez/workout-logbook/releases/download/ios-v1/WorkoutLogbook.ipa

Open it in SideStore / AltStore / SideInstaller, which re-sign it with your Apple ID.

- Bundle ID: com.rico.workoutlogbook. Display name: Workout Logbook
- Tailwind (Play CDN 3.4.17) and Tone.js 14.8.49 are vendored in ios-web/vendor so the app runs offline
- ios-web/native-shim.js makes "Export backup" open the iOS share sheet (WKWebView ignores <a download>), plays haptics, keeps the screen awake during timers, and schedules a local notification when rest ends
- To pick up changes from main: merge main into this branch and push

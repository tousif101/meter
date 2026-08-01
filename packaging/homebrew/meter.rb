cask "meter" do
  version "0.1.0"
  on_arm do
    sha256 "9417983a39315cb47b937b88890278e5c6423d1ef7d8c77a459dce2f7f4ce38a"
    url "https://github.com/tousif101/meter/releases/download/v#{version}/Meter_#{version}_aarch64.dmg"
  end
  on_intel do
    sha256 "232e5a4146bb836b2465a3543afe0f1378f1de0c37d19173302dcfb2ee56c2b8"
    url "https://github.com/tousif101/meter/releases/download/v#{version}/Meter_#{version}_x64.dmg"
  end
  name "Meter"
  desc "Local-first menu bar usage monitor for Claude Code and Codex"
  homepage "https://github.com/tousif101/meter"


  app "Meter.app"

  zap trash: [
    "~/Library/Application Support/com.tousifchowdhury.meter",
    "~/Library/Caches/com.tousifchowdhury.meter",
    "~/Library/Preferences/com.tousifchowdhury.meter.plist",
    "~/Library/Saved Application State/com.tousifchowdhury.meter.savedState",
  ]

  caveats <<~EOS
    Meter is not yet notarized by Apple, so macOS will block the first launch.
    Fastest fix:
      xattr -d com.apple.quarantine /Applications/Meter.app
    Or: open Meter once, then System Settings -> Privacy & Security -> "Open Anyway".
  EOS
end

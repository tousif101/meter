cask "meter" do
  version "0.1.0"
  on_arm do
    sha256 "8b0a4d5bd7d838923348878a751bce0f5283e25dfff875830de389aa329eb3b7"
    url "https://github.com/tousif101/meter/releases/download/v#{version}/Meter_#{version}_aarch64.dmg"
  end
  on_intel do
    sha256 "b2d42899161c6700fb55dfa55c6c0866d31cb6e19ca06ea77b2a7261c0be560a"
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

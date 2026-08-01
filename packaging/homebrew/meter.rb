# Homebrew cask for Meter.
# Lives in the tap repo: github.com/tousif101/homebrew-tap → Casks/meter.rb
# After each release: update `version` and the two sha256 values
# (shasum -a 256 <dmg> for each arch), then push the tap repo.
cask "meter" do
  version "0.1.0"

  on_arm do
    sha256 "REPLACE_WITH_AARCH64_DMG_SHA256"
    url "https://github.com/tousif101/meter/releases/download/v#{version}/Meter_#{version}_aarch64.dmg"
  end
  on_intel do
    sha256 "REPLACE_WITH_X64_DMG_SHA256"
    url "https://github.com/tousif101/meter/releases/download/v#{version}/Meter_#{version}_x64.dmg"
  end

  name "Meter"
  desc "Local-first menu bar usage monitor for Claude Code and Codex"
  homepage "https://github.com/tousif101/meter"

  depends_on macos: ">= :catalina"

  app "Meter.app"

  zap trash: [
    "~/Library/Application Support/com.tousifchowdhury.meter",
    "~/Library/Caches/com.tousifchowdhury.meter",
    "~/Library/Preferences/com.tousifchowdhury.meter.plist",
    "~/Library/Saved Application State/com.tousifchowdhury.meter.savedState",
  ]

  # Remove this caveat once builds are signed + notarized with a Developer ID.
  caveats <<~EOS
    Meter is not yet notarized by Apple. On first launch, macOS may block it.
    Either right-click Meter.app → Open, or run:
      xattr -d com.apple.quarantine /Applications/Meter.app
  EOS
end

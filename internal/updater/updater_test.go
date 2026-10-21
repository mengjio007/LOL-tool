package updater

import (
	"context"
	"testing"
)

func TestCompareVersions(t *testing.T) {
	tests := []struct {
		v1       string
		v2       string
		expected int
	}{
		{"v1.0.0", "v1.0.0", 0},
		{"v1.0.0", "v1.0.1", -1},
		{"v1.0.1", "v1.0.0", 1},
		{"v1.0", "v1.0.0", 0},
		{"1.0.0", "v1.0.0", 0},
		{"v1.0.0", "v1.1.0", -1},
		{"v1.0.0", "v2.0.0", -1},
		{"v2.0.0", "v1.9.9", 1},
		{"v1.0.0-beta", "v1.0.0", 0},
		{"v1.0.0", "v1.0.0-rc1", 0},
	}

	for _, tt := range tests {
		res := compareVersions(tt.v1, tt.v2)
		if res != tt.expected {
			t.Errorf("compareVersions(%q, %q) = %d; expected %d", tt.v1, tt.v2, res, tt.expected)
		}
	}
}

func TestCheckUpdateAgainstRealRepo(t *testing.T) {
	// Query current real GitHub release
	info, err := CheckUpdate(context.Background())
	if err != nil {
		t.Logf("Network check failed (might be offline): %v", err)
		return
	}

	t.Logf("Got info: current=%s, latest=%s, hasUpdate=%v, url=%s, download=%s, size=%d",
		info.CurrentVersion, info.LatestVersion, info.HasUpdate, info.ReleaseUrl, info.DownloadUrl, info.AssetSize)

	if info.LatestVersion != "v1.0.0" {
		t.Logf("Note: Latest tag on repo is %s", info.LatestVersion)
	}
}

package updater

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// CurrentVersion is the hardcoded version of this release
const CurrentVersion = "v1.0.1"

// GitHub repo configuration
const (
	GithubOwner = "mengjio007"
	GithubRepo  = "LOL-tool"
)

// UpdateInfo holds details about the latest available release
type UpdateInfo struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	HasUpdate      bool   `json:"hasUpdate"`
	ReleaseName    string `json:"releaseName"`
	ReleaseNotes   string `json:"releaseNotes"`
	ReleaseUrl     string `json:"releaseUrl"`
	DownloadUrl    string `json:"downloadUrl"`
	AssetSize      int64  `json:"assetSize"`
	PublishedAt    string `json:"publishedAt"`
}

type githubAsset struct {
	Name               string `json:"name"`
	Size               int64  `json:"size"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type githubRelease struct {
	TagName     string        `json:"tag_name"`
	Name        string        `json:"name"`
	Body        string        `json:"body"`
	HTMLURL     string        `json:"html_url"`
	PublishedAt string        `json:"published_at"`
	Assets      []githubAsset `json:"assets"`
}

// parseVersion converts "v1.2.3" or "1.2" into []int{1, 2, 3}
func parseVersion(v string) []int {
	v = strings.TrimSpace(v)
	v = strings.TrimPrefix(v, "v")
	v = strings.TrimPrefix(v, "V")
	if idx := strings.IndexAny(v, "-+"); idx != -1 {
		v = v[:idx]
	}
	parts := strings.Split(v, ".")
	nums := make([]int, len(parts))
	for i, p := range parts {
		num, _ := strconv.Atoi(strings.TrimSpace(p))
		nums[i] = num
	}
	for len(nums) < 3 {
		nums = append(nums, 0)
	}
	return nums
}

// compareVersions returns -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
func compareVersions(v1, v2 string) int {
	n1 := parseVersion(v1)
	n2 := parseVersion(v2)
	maxLen := len(n1)
	if len(n2) > maxLen {
		maxLen = len(n2)
	}
	for len(n1) < maxLen {
		n1 = append(n1, 0)
	}
	for len(n2) < maxLen {
		n2 = append(n2, 0)
	}
	for i := 0; i < maxLen; i++ {
		if n1[i] < n2[i] {
			return -1
		}
		if n1[i] > n2[i] {
			return 1
		}
	}
	return 0
}

// CheckUpdate checks GitHub Releases API for the latest published release
func CheckUpdate(ctx context.Context) (*UpdateInfo, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", GithubOwner, GithubRepo)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("User-Agent", "LOL-Tool-Updater/1.0")
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("网络请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API 返回状态码 %d", resp.StatusCode)
	}

	var rel githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return nil, fmt.Errorf("解析 GitHub 返回数据失败: %w", err)
	}

	info := &UpdateInfo{
		CurrentVersion: CurrentVersion,
		LatestVersion:  rel.TagName,
		ReleaseName:    rel.Name,
		ReleaseNotes:   rel.Body,
		ReleaseUrl:     rel.HTMLURL,
		PublishedAt:    rel.PublishedAt,
	}

	// Find the .exe download asset
	for _, asset := range rel.Assets {
		if strings.HasSuffix(strings.ToLower(asset.Name), ".exe") {
			info.DownloadUrl = asset.BrowserDownloadURL
			info.AssetSize = asset.Size
			break
		}
	}

	// Fallback to HTML release URL if no direct asset
	if info.DownloadUrl == "" {
		info.DownloadUrl = rel.HTMLURL
	}

	// Check if latest is newer than current
	if compareVersions(CurrentVersion, rel.TagName) < 0 {
		info.HasUpdate = true
	}

	return info, nil
}

// ProgressCallback informs caller about download progress
type ProgressCallback func(percent int, downloadedBytes int64, totalBytes int64)

// DownloadAndApplyUpdate downloads the new executable and replaces current one, then restarts
func DownloadAndApplyUpdate(ctx context.Context, downloadUrl string, onProgress ProgressCallback) error {
	if downloadUrl == "" {
		return fmt.Errorf("下载链接为空")
	}

	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("获取可执行文件路径失败: %w", err)
	}
	exePath, err = filepath.EvalSymlinks(exePath)
	if err != nil {
		return fmt.Errorf("解析软链接路径失败: %w", err)
	}

	// Create temp file for download
	tempPath := exePath + ".downloading"
	_ = os.Remove(tempPath) // ensure clean start

	out, err := os.OpenFile(tempPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return fmt.Errorf("创建下载临时文件失败: %w", err)
	}
	defer func() {
		out.Close()
		// If error occurred and file still exists, clean it up
		if err != nil {
			_ = os.Remove(tempPath)
		}
	}()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, downloadUrl, nil)
	if err != nil {
		return fmt.Errorf("创建下载请求失败: %w", err)
	}
	req.Header.Set("User-Agent", "LOL-Tool-Updater/1.0")

	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("下载连接失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("下载服务器返回错误状态码 %d", resp.StatusCode)
	}

	totalBytes := resp.ContentLength
	var downloaded int64
	buf := make([]byte, 32*1024)

	lastReport := time.Now()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		n, rErr := resp.Body.Read(buf)
		if n > 0 {
			_, wErr := out.Write(buf[:n])
			if wErr != nil {
				return fmt.Errorf("写入文件失败: %w", wErr)
			}
			downloaded += int64(n)

			if totalBytes > 0 && (time.Since(lastReport) > 100*time.Millisecond || downloaded == totalBytes) {
				percent := int((float64(downloaded) / float64(totalBytes)) * 100)
				if onProgress != nil {
					onProgress(percent, downloaded, totalBytes)
				}
				lastReport = time.Now()
			}
		}

		if rErr != nil {
			if rErr == io.EOF {
				break
			}
			return fmt.Errorf("读取网络流失败: %w", rErr)
		}
	}

	out.Close()

	// Replace executable
	oldPath := exePath + ".old"
	_ = os.Remove(oldPath)

	if err = os.Rename(exePath, oldPath); err != nil {
		return fmt.Errorf("重命名当前版本失败: %w", err)
	}

	if err = os.Rename(tempPath, exePath); err != nil {
		// Attempt rollback
		_ = os.Rename(oldPath, exePath)
		return fmt.Errorf("安装新版本失败: %w", err)
	}

	// Launch new executable
	cmd := exec.Command(exePath)
	cmd.Dir = filepath.Dir(exePath)
	if err = cmd.Start(); err != nil {
		return fmt.Errorf("重启新版本失败: %w", err)
	}

	// Exit current process after short delay
	go func() {
		time.Sleep(500 * time.Millisecond)
		os.Exit(0)
	}()

	return nil
}

// CleanupOldFiles deletes leftovers from previous update (.old, .downloading)
func CleanupOldFiles() {
	exePath, err := os.Executable()
	if err != nil {
		return
	}
	exePath, err = filepath.EvalSymlinks(exePath)
	if err != nil {
		return
	}

	_ = os.Remove(exePath + ".old")
	_ = os.Remove(exePath + ".downloading")
}

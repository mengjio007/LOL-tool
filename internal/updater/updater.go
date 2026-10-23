package updater

import (
	"context"
	"encoding/json"
	"errors"
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
var CurrentVersion = "v2.0.0"

// Repository configuration
const (
	GithubOwner       = "mengjio007"
	GithubRepo        = "LOL-tool"
	GitcodeOwner      = "mengjio007"
	GitcodeRepo       = "lol-tool"
	GitcodeReleaseUrl = "https://gitcode.com/mengjio007/lol-tool/releases"
)

// UpdateInfo holds details about the latest available release
type UpdateInfo struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	HasUpdate      bool   `json:"hasUpdate"`
	ReleaseName    string `json:"releaseName"`
	ReleaseNotes   string `json:"releaseNotes"`
	ReleaseUrl     string `json:"releaseUrl"`
	GitCodeUrl     string `json:"gitCodeUrl"`
	DownloadUrl    string `json:"downloadUrl"`
	AssetSize      int64  `json:"assetSize"`
	PublishedAt    string `json:"publishedAt"`
	SourceChannel  string `json:"sourceChannel"` // "GitHub", "GitCode", "国内加速镜像"
}

type releaseAsset struct {
	Name               string `json:"name"`
	Size               int64  `json:"size"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type releasePayload struct {
	TagName     string         `json:"tag_name"`
	Name        string         `json:"name"`
	Body        string         `json:"body"`
	HTMLURL     string         `json:"html_url"`
	PublishedAt string         `json:"published_at"`
	CreatedAt   string         `json:"created_at"`
	Assets      []releaseAsset `json:"assets"`
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

// fetchJSON fetches and decodes JSON from a URL into a target struct
func fetchJSON(ctx context.Context, client *http.Client, targetUrl string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, targetUrl, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "LOL-Tool-Updater/1.0.3")
	req.Header.Set("Accept", "application/json, application/vnd.github.v3+json, */*")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("status code %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// parseReleaseFromBytes attempts to parse a single release or a release array
func parseReleaseFromBytes(data []byte) (*releasePayload, error) {
	// Try single release first
	var single releasePayload
	if err := json.Unmarshal(data, &single); err == nil && single.TagName != "" {
		return &single, nil
	}

	// Try release array
	var list []releasePayload
	if err := json.Unmarshal(data, &list); err == nil && len(list) > 0 && list[0].TagName != "" {
		return &list[0], nil
	}

	return nil, errors.New("无法解析 release 数据格式")
}

// CheckUpdate checks multiple sources for the latest published release:
// 1. GitCode API (Domestic primary: fast in China, no GitHub rate limits)
// 2. GitHub Official API (Direct)
// 3. GitHub Proxy Mirror API (Domestic gh-proxy mirror)
// 4. GitHub 302 Web Redirect (Bypasses GitHub API rate limits)
func CheckUpdate(ctx context.Context) (*UpdateInfo, error) {
	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	var bestRelease *releasePayload
	var channelName string

	// Channel 1: GitCode API (Domestic - ideal for Chinese users)
	gitcodeEndpoints := []string{
		fmt.Sprintf("https://gitcode.com/api/v5/repos/%s/%s/releases/latest", GitcodeOwner, GitcodeRepo),
		fmt.Sprintf("https://gitcode.com/api/v5/repos/%s/%s/releases", GitcodeOwner, GitcodeRepo),
	}
	for _, ep := range gitcodeEndpoints {
		data, err := fetchJSON(ctx, client, ep)
		if err == nil {
			rel, parseErr := parseReleaseFromBytes(data)
			if parseErr == nil && rel != nil && rel.TagName != "" {
				bestRelease = rel
				channelName = "GitCode"
				break
			}
		}
	}

	// Channel 2: GitHub Official API (Direct)
	if bestRelease == nil {
		githubApiUrl := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", GithubOwner, GithubRepo)
		data, err := fetchJSON(ctx, client, githubApiUrl)
		if err == nil {
			rel, parseErr := parseReleaseFromBytes(data)
			if parseErr == nil && rel != nil && rel.TagName != "" {
				bestRelease = rel
				channelName = "GitHub"
			}
		}
	}

	// Channel 3: GitHub Proxy Mirror API (Bypasses firewall / DNS blocks)
	if bestRelease == nil {
		mirrorApiUrl := fmt.Sprintf("https://gh-proxy.com/https://api.github.com/repos/%s/%s/releases/latest", GithubOwner, GithubRepo)
		data, err := fetchJSON(ctx, client, mirrorApiUrl)
		if err == nil {
			rel, parseErr := parseReleaseFromBytes(data)
			if parseErr == nil && rel != nil && rel.TagName != "" {
				bestRelease = rel
				channelName = "国内加速镜像"
			}
		}
	}

	// Channel 4: GitHub Web Redirect (Bypasses GitHub 60req/h API rate limits)
	if bestRelease == nil {
		redirectClient := &http.Client{
			Timeout: 5 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		}
		webUrl := fmt.Sprintf("https://github.com/%s/%s/releases/latest", GithubOwner, GithubRepo)
		req, err := http.NewRequestWithContext(ctx, http.MethodHead, webUrl, nil)
		if err == nil {
			req.Header.Set("User-Agent", "LOL-Tool-Updater/1.0.3")
			resp, rErr := redirectClient.Do(req)
			if rErr == nil {
				defer resp.Body.Close()
				loc := resp.Header.Get("Location")
				if strings.Contains(loc, "/releases/tag/") {
					tag := loc[strings.LastIndex(loc, "/")+1:]
					if tag != "" {
						bestRelease = &releasePayload{
							TagName: tag,
							Name:    "LOL-tool " + tag,
							HTMLURL: loc,
						}
						channelName = "GitHub Web"
					}
				}
			}
		}
	}

	if bestRelease == nil {
		return nil, errors.New("无法从 GitHub 或 GitCode 获取最新发布版本")
	}

	info := &UpdateInfo{
		CurrentVersion: CurrentVersion,
		LatestVersion:  bestRelease.TagName,
		ReleaseName:    bestRelease.Name,
		ReleaseNotes:   bestRelease.Body,
		ReleaseUrl:     bestRelease.HTMLURL,
		GitCodeUrl:     GitcodeReleaseUrl,
		SourceChannel:  channelName,
	}

	if info.ReleaseUrl == "" {
		info.ReleaseUrl = fmt.Sprintf("https://github.com/%s/%s/releases/tag/%s", GithubOwner, GithubRepo, bestRelease.TagName)
	}

	pubTime := bestRelease.PublishedAt
	if pubTime == "" {
		pubTime = bestRelease.CreatedAt
	}
	info.PublishedAt = pubTime

	// Find the .exe download asset
	for _, asset := range bestRelease.Assets {
		if strings.HasSuffix(strings.ToLower(asset.Name), ".exe") {
			info.DownloadUrl = asset.BrowserDownloadURL
			info.AssetSize = asset.Size
			break
		}
	}

	// Fallback download URL if no direct asset listed in API
	if info.DownloadUrl == "" {
		info.DownloadUrl = fmt.Sprintf("https://github.com/%s/%s/releases/download/%s/lol-helper-%s.exe",
			GithubOwner, GithubRepo, bestRelease.TagName, bestRelease.TagName)
	}

	// Check if latest is newer than current
	if compareVersions(CurrentVersion, bestRelease.TagName) < 0 {
		info.HasUpdate = true
	}

	return info, nil
}

// ProgressCallback informs caller about download progress
type ProgressCallback func(percent int, downloadedBytes int64, totalBytes int64)

// downloadFromCandidate streams the file from a URL to out
func downloadFromCandidate(ctx context.Context, candidateUrl string, out *os.File, onProgress ProgressCallback) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, candidateUrl, nil)
	if err != nil {
		return fmt.Errorf("创建请求失败: %w", err)
	}
	req.Header.Set("User-Agent", "LOL-Tool-Updater/1.0.3")

	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("连接失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("返回错误状态码 %d", resp.StatusCode)
	}

	// Reset output file
	if _, err := out.Seek(0, io.SeekStart); err != nil {
		return err
	}
	if err := out.Truncate(0); err != nil {
		return err
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
			if _, wErr := out.Write(buf[:n]); wErr != nil {
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

	return nil
}

// verifyExecutable verifies that the file has a valid Windows PE header ('MZ') and sufficient size
func verifyExecutable(path string) error {
	info, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("无法读取下载文件信息: %w", err)
	}

	// Executable should be at least 1MB
	if info.Size() < 1024*1024 {
		return fmt.Errorf("下载文件体积异常 (%d 字节)，可能非有效安装包", info.Size())
	}

	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("打开下载文件失败: %w", err)
	}
	defer f.Close()

	header := make([]byte, 2)
	if _, err := io.ReadFull(f, header); err != nil {
		return fmt.Errorf("读取文件头失败: %w", err)
	}

	// Windows PE files always begin with 'M' 'Z' (0x4D, 0x5A)
	if header[0] != 'M' || header[1] != 'Z' {
		return fmt.Errorf("文件格式校验失败 (缺少 Windows PE 头)，可能被代理拦截或为错误网页")
	}

	return nil
}

// DownloadAndApplyUpdate downloads the new executable with multi-mirror fallback and replaces the current one
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
	_ = os.Remove(tempPath)

	out, err := os.OpenFile(tempPath, os.O_CREATE|os.O_RDWR|os.O_TRUNC, 0755)
	if err != nil {
		return fmt.Errorf("创建下载临时文件失败: %w", err)
	}
	defer func() {
		out.Close()
		if err != nil {
			_ = os.Remove(tempPath)
		}
	}()

	// Construct list of download candidates
	var candidates []string

	if strings.Contains(downloadUrl, "github.com") {
		// 1. Fast domestic proxy mirror (often the fastest in mainland China)
		candidates = append(candidates, "https://gh-proxy.com/"+downloadUrl)
		// 2. Direct GitHub download
		candidates = append(candidates, downloadUrl)
		// 3. Secondary domestic mirror
		candidates = append(candidates, "https://ghproxy.net/"+downloadUrl)
	} else {
		// Non-GitHub URL (e.g. GitCode release direct asset)
		candidates = append(candidates, downloadUrl)
		// Secondary fallback if we can construct GitHub mirror equivalent
		filename := filepath.Base(downloadUrl)
		if filename != "" && strings.HasSuffix(strings.ToLower(filename), ".exe") {
			tag := strings.TrimSuffix(strings.TrimPrefix(filename, "lol-helper-"), ".exe")
			if tag == "" {
				tag = CurrentVersion
			}
			candidates = append(candidates, fmt.Sprintf("https://gh-proxy.com/https://github.com/%s/%s/releases/download/%s/%s",
				GithubOwner, GithubRepo, tag, filename))
		}
	}

	var downloadErr error
	var success bool

	for _, cand := range candidates {
		downloadErr = downloadFromCandidate(ctx, cand, out, onProgress)
		if downloadErr == nil {
			// Validate that downloaded file is a genuine PE binary
			if vErr := verifyExecutable(tempPath); vErr == nil {
				success = true
				break
			} else {
				downloadErr = vErr
			}
		}
	}

	if !success {
		return fmt.Errorf("所有下载节点尝试均失败: %w", downloadErr)
	}

	out.Close()

	// Replace executable
	oldPath := exePath + ".old"
	_ = os.Remove(oldPath)

	if err = os.Rename(exePath, oldPath); err != nil {
		return fmt.Errorf("重命名当前版本失败: %w", err)
	}

	if err = os.Rename(tempPath, exePath); err != nil {
		_ = os.Rename(oldPath, exePath) // rollback
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

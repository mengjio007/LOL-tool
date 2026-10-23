package livegame

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"sync"
)

var (
	mediaServerPort int
	mediaServerOnce sync.Once
)

// StartMediaServer 启动一个绑定到 127.0.0.1 的本地媒体推流服务，专门为 HTML5 Video 标签提供流式分发
func StartMediaServer() int {
	mediaServerOnce.Do(func() {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			return
		}
		mediaServerPort = listener.Addr().(*net.TCPAddr).Port

		mux := http.NewServeMux()
		mux.HandleFunc("/stream", func(w http.ResponseWriter, r *http.Request) {
			filePath := r.URL.Query().Get("path")
			if filePath == "" {
				http.Error(w, "missing path parameter", http.StatusBadRequest)
				return
			}

			// 检查文件是否存在
			info, err := os.Stat(filePath)
			if err != nil || info.IsDir() {
				http.Error(w, "file not found", http.StatusNotFound)
				return
			}

			// 允许跨域以便 WebView2 页面随时加载
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Range, Content-Type")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			http.ServeFile(w, r, filePath)
		})

		go func() {
			_ = http.Serve(listener, mux)
		}()
	})

	return mediaServerPort
}

// GetMediaStreamURL 返回指定本地视频文件的本地流式播放地址
func GetMediaStreamURL(filePath string) string {
	port := StartMediaServer()
	if port == 0 {
		return ""
	}
	return fmt.Sprintf("http://127.0.0.1:%d/stream?path=%s", port, filePath)
}

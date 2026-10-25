package main

import (
	"embed"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// 允许 WebView2 加载外部网页 (如抖音推荐流 iframe)，禁用同源安全限制与 CSP 拦截
	_ = os.Setenv("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-web-security --disable-features=IsolateOrigins,site-per-process --allow-running-insecure-content")

	app := NewApp()

	err := wails.Run(&options.App{
		Title:     "LOL 智能助手 v2.0.1",
		Width:     620,
		Height:    720,
		MinWidth:  380,
		MinHeight: 52,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 1, G: 10, B: 19, A: 255},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
		Frameless: true,
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

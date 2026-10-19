package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"lol/internal/lcu"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Ltime)
	fmt.Println("==================================================")
	fmt.Println("  LOL 自动排队 & 自动接受工具 (命令行独立版)")
	fmt.Println("==================================================")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Println("\n[提示] 收到退出信号，程序已安全退出。")
		os.Exit(0)
	}()

	for {
		port, token, err := lcu.GetCredentials()
		if err != nil {
			log.Println("[等待] 尚未检测到英雄联盟客户端运行，2 秒后重试...")
			time.Sleep(2 * time.Second)
			continue
		}

		client := lcu.NewClient(port, token)
		log.Printf("[LCU] 成功连接至本地客户端 (端口: %d)\n", port)
		_ = client
		time.Sleep(3 * time.Second)
	}
}

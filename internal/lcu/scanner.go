package lcu

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"syscall"
	"unsafe"
)

const (
	lolProcessName = "LeagueClientUx.exe"
	maxPath        = 260
)

var (
	modKernel32                  = syscall.NewLazyDLL("kernel32.dll")
	modNtdll                     = syscall.NewLazyDLL("ntdll.dll")
	procCreateToolhelp32Snapshot = modKernel32.NewProc("CreateToolhelp32Snapshot")
	procProcess32First           = modKernel32.NewProc("Process32FirstW")
	procProcess32Next            = modKernel32.NewProc("Process32NextW")
	procOpenProcess              = modKernel32.NewProc("OpenProcess")
	procCloseHandle              = modKernel32.NewProc("CloseHandle")
	procReadProcessMemory        = modKernel32.NewProc("ReadProcessMemory")
	procNtQueryInfoProcess       = modNtdll.NewProc("NtQueryInformationProcess")

	portRegex  = regexp.MustCompile(`--app-port=(\d+)`)
	tokenRegex = regexp.MustCompile(`--remoting-auth-token=([\w-]+)`)
)

type PROCESSENTRY32W struct {
	Size              uint32
	CntUsage          uint32
	ProcessID         uint32
	DefaultHeapID     uintptr
	ModuleID          uint32
	CntThreads        uint32
	ParentProcessID   uint32
	PriorityClassBase int32
	Flags             uint32
	ExeFile           [maxPath]uint16
}

type unicodeString struct {
	Length        uint16
	MaximumLength uint16
	Buffer        uintptr
}

type processBasicInformation struct {
	ExitStatus                   uint32
	Reserved0                    uint32
	PebBaseAddress               uintptr
	AffinityMask                 uintptr
	BasePriority                 int32
	Reserved1                    uint32
	UniqueProcessId              uintptr
	InheritedFromUniqueProcessId uintptr
}

// GetProcessCommandLine retrieves the full command line of the target executable by inspecting its PEB
func GetProcessCommandLine(targetName string) (result string, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("读取进程内存发生异常: %v", r)
		}
	}()

	snapshot, _, _ := procCreateToolhelp32Snapshot.Call(0x00000002, 0)
	if int(snapshot) == -1 {
		return "", errors.New("创建进程快照失败")
	}
	defer procCloseHandle.Call(snapshot)

	var entry PROCESSENTRY32W
	entry.Size = uint32(unsafe.Sizeof(entry))

	ret, _, _ := procProcess32First.Call(snapshot, uintptr(unsafe.Pointer(&entry)))
	if ret == 0 {
		return "", errors.New("遍历进程失败")
	}

	var pid uint32
	for {
		name := syscall.UTF16ToString(entry.ExeFile[:])
		if name == targetName {
			pid = entry.ProcessID
			break
		}
		ret, _, _ = procProcess32Next.Call(snapshot, uintptr(unsafe.Pointer(&entry)))
		if ret == 0 {
			break
		}
	}

	if pid == 0 {
		return "", fmt.Errorf("未找到客户端进程: %s", targetName)
	}

	// 打开进程读取命令行 (PROCESS_QUERY_INFORMATION | PROCESS_VM_READ = 0x0410)
	hProcess, _, _ := procOpenProcess.Call(0x0410, 0, uintptr(pid))
	if hProcess == 0 {
		return "", fmt.Errorf("打开进程 PID %d 失败，可能需要管理员权限", pid)
	}
	defer procCloseHandle.Call(hProcess)

	var pbi processBasicInformation
	var returnLength uint32
	status, _, _ := procNtQueryInfoProcess.Call(
		hProcess,
		0, // ProcessBasicInformation
		uintptr(unsafe.Pointer(&pbi)),
		uintptr(unsafe.Sizeof(pbi)),
		uintptr(unsafe.Pointer(&returnLength)),
	)
	if status != 0 {
		return "", fmt.Errorf("NtQueryInformationProcess 失败，状态码: 0x%X", status)
	}

	var processParamsAddr uintptr
	var bytesRead uintptr
	ret, _, _ = procReadProcessMemory.Call(
		hProcess,
		pbi.PebBaseAddress+0x20,
		uintptr(unsafe.Pointer(&processParamsAddr)),
		unsafe.Sizeof(processParamsAddr),
		uintptr(unsafe.Pointer(&bytesRead)),
	)
	if ret == 0 || processParamsAddr == 0 {
		return "", errors.New("读取 ProcessParameters 失败")
	}

	var cmdLine unicodeString
	ret, _, _ = procReadProcessMemory.Call(
		hProcess,
		processParamsAddr+0x70,
		uintptr(unsafe.Pointer(&cmdLine)),
		unsafe.Sizeof(cmdLine),
		uintptr(unsafe.Pointer(&bytesRead)),
	)
	if ret == 0 || cmdLine.Length < 2 || cmdLine.Buffer == 0 || cmdLine.Length > 65535 {
		return "", errors.New("读取 CommandLine 结构体失败或格式无效")
	}

	bufLen := cmdLine.Length / 2
	if bufLen == 0 {
		return "", errors.New("CommandLine 长度为0")
	}

	cmdBuf := make([]uint16, bufLen)
	ret, _, _ = procReadProcessMemory.Call(
		hProcess,
		cmdLine.Buffer,
		uintptr(unsafe.Pointer(&cmdBuf[0])),
		uintptr(cmdLine.Length),
		uintptr(unsafe.Pointer(&bytesRead)),
	)
	if ret == 0 {
		return "", errors.New("读取 CommandLine 字符串内容失败")
	}

	return syscall.UTF16ToString(cmdBuf), nil
}

// GetCredentials extracts the port and token from LeagueClientUx.exe
func GetCredentials() (port int, token string, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("提取客户端凭证异常: %v", r)
		}
	}()

	cmdline, err := GetProcessCommandLine(lolProcessName)
	if err != nil {
		return 0, "", err
	}

	portMatches := portRegex.FindStringSubmatch(cmdline)
	tokenMatches := tokenRegex.FindStringSubmatch(cmdline)

	if len(portMatches) < 2 || len(tokenMatches) < 2 {
		return 0, "", errors.New("解析端口或 Token 失败")
	}

	port, err = strconv.Atoi(portMatches[1])
	if err != nil {
		return 0, "", errors.New("端口转换为整数失败")
	}

	return port, tokenMatches[1], nil
}

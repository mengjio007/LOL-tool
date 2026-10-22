package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"os"
)

type iconDirEntry struct {
	Width       byte
	Height      byte
	ColorCount  byte
	Reserved    byte
	Planes      uint16
	BitCount    uint16
	BytesInRes  uint32
	ImageOffset uint32
}

func main() {
	sizes := []int{256, 128, 64, 48, 32, 16}
	var pngBuffers [][]byte

	for _, s := range sizes {
		data, err := os.ReadFile(fmt.Sprintf("build/icon_%d.png", s))
		if err != nil {
			panic(err)
		}
		pngBuffers = append(pngBuffers, data)
	}

	buf := new(bytes.Buffer)

	// Header: 6 bytes
	binary.Write(buf, binary.LittleEndian, uint16(0))          // Reserved
	binary.Write(buf, binary.LittleEndian, uint16(1))          // Type: 1 = ICO
	binary.Write(buf, binary.LittleEndian, uint16(len(sizes))) // Image count

	offset := uint32(6 + len(sizes)*16)

	// Directory entries
	for i, s := range sizes {
		w := byte(s)
		if s == 256 {
			w = 0
		}
		h := w
		entry := iconDirEntry{
			Width:       w,
			Height:      h,
			ColorCount:  0,
			Reserved:    0,
			Planes:      1,
			BitCount:    32,
			BytesInRes:  uint32(len(pngBuffers[i])),
			ImageOffset: offset,
		}
		binary.Write(buf, binary.LittleEndian, entry)
		offset += uint32(len(pngBuffers[i]))
	}

	// Image bytes
	for _, pngData := range pngBuffers {
		buf.Write(pngData)
	}

	if err := os.WriteFile("build/windows/icon.ico", buf.Bytes(), 0644); err != nil {
		panic(err)
	}
	fmt.Printf("Successfully wrote build/windows/icon.ico (%d bytes)\n", buf.Len())
}

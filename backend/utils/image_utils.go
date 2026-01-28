package utils

import (
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"os"

	"github.com/chai2010/webp"
	"golang.org/x/image/bmp"
	"golang.org/x/image/tiff"
	"golang.org/x/image/webp"
)

// ConvertToWebP converts an image file to WebP format
func ConvertToWebP(inputPath, outputPath string) error {
	// Open the input file
	inputFile, err := os.Open(inputPath)
	if err != nil {
		return err
	}
	defer inputFile.Close()

	// Decode the image
	img, _, err := image.Decode(inputFile)
	if err != nil {
		return err
	}

	// Create the output file
	outputFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer outputFile.Close()

	// Encode as WebP
	// Using a quality of 90 for good balance between size and quality
	options := &webp.Options{Lossless: false, Quality: 90}
	return webp.Encode(outputFile, img, options)
}

// DecodeFromReader decodes an image from an io.Reader
func DecodeFromReader(reader io.Reader) (image.Image, error) {
	img, _, err := image.Decode(reader)
	return img, err
}

// DecodeJPEG decodes a JPEG image from reader
func DecodeJPEG(reader io.Reader) (image.Image, error) {
	return jpeg.Decode(reader)
}

// DecodePNG decodes a PNG image from reader
func DecodePNG(reader io.Reader) (image.Image, error) {
	return png.Decode(reader)
}

// DecodeBMP decodes a BMP image from reader
func DecodeBMP(reader io.Reader) (image.Image, error) {
	return bmp.Decode(reader)
}

// DecodeTIFF decodes a TIFF image from reader
func DecodeTIFF(reader io.Reader) (image.Image, error) {
	return tiff.Decode(reader)
}
package main

import (
	"fmt"
	"image"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/chai2010/webp"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/image/bmp"
	"golang.org/x/image/jpeg"
	"golang.org/x/image/png"
	"golang.org/x/image/tiff"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Photo struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	Title     string `json:"title"`
	Filename  string `json:"filename"`
	FilePath  string `json:"filePath"`
	FileSize  int64  `json:"fileSize"`
	CreatedAt string `json:"createdAt"`
}

var db *gorm.DB

func initDB() {
	var err error
	dbPath := "./photos.db"
	db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = db.AutoMigrate(&Photo{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	// Enable CORS
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	r.Use(cors.New(config))

	// Static file serving
	r.Static("/uploads", "./uploads")
	
	// Serve frontend static files if they exist
	frontendDir := "./frontend-dist"
	if _, err := os.Stat(frontendDir); os.IsNotExist(err) {
		// If frontend-dist doesn't exist, serve a simple message
		r.GET("/", func(c *gin.Context) {
			c.String(http.StatusOK, "Backend server running. Frontend not built.")
		})
	} else {
		// Serve frontend files
		r.Static("/", frontendDir)
		
		// For SPA routing, serve index.html for all non-API routes
		r.NoRoute(func(c *gin.Context) {
			if !strings.HasPrefix(c.Request.URL.Path, "/api/") && 
			   !strings.HasPrefix(c.Request.URL.Path, "/uploads/") {
				c.File(frontendDir + "/index.html")
			}
		})
	}

	// Routes
	r.POST("/api/login", loginHandler)
	r.GET("/api/photos", getPhotosHandler)
	r.POST("/api/upload", uploadHandler)
	r.PUT("/api/photo/:id", updatePhotoHandler)
	r.DELETE("/api/photo/:id", deletePhotoHandler)

	return r
}

// convertToWebP converts an image file to WebP format
func convertToWebP(inputPath, outputPath string) error {
	// Open the input file
	inputFile, err := os.Open(inputPath)
	if err != nil {
		return err
	}
	defer inputFile.Close()

	// Determine the image format by reading the file header
	img, _, err := image.Decode(inputFile)
	if err != nil {
		// Try to detect format based on extension if decoding fails
		ext := filepath.Ext(inputPath)
		_, err = inputFile.Seek(0, 0)
		if err != nil {
			return err
		}

		switch ext {
		case ".jpg", ".jpeg":
			img, err = jpeg.Decode(inputFile)
		case ".png":
			img, err = png.Decode(inputFile)
		case ".bmp":
			img, err = bmp.Decode(inputFile)
		case ".tiff", ".tif":
			img, err = tiff.Decode(inputFile)
		case ".webp":
			img, err = webp.Decode(inputFile)
		default:
			return fmt.Errorf("unsupported image format: %s", ext)
		}
		if err != nil {
			return err
		}
	}

	// Create the output file
	outputFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer outputFile.Close()

	// Encode as WebP
	options := &webp.Options{Lossless: false, Quality: 90}
	return webp.Encode(outputFile, img, options)
}

func main() {
	initDB()

	// Create uploads directory if it doesn't exist
	err := os.MkdirAll("./uploads", os.ModePerm)
	if err != nil {
		log.Fatal("Failed to create uploads directory:", err)
	}

	r := setupRouter()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}
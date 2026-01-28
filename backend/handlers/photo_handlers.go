package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Login handler
func loginHandler(c *gin.Context) {
	var credentials struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request payload",
		})
		return
	}

	// Simple authentication - in production, use proper auth with bcrypt
	if credentials.Username == "admin" && credentials.Password == "password" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Login successful",
		})
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid credentials",
		})
	}
}

// Get all photos
func getPhotosHandler(c *gin.Context) {
	var photos []Photo
	result := db.Find(&photos)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch photos",
		})
		return
	}

	c.JSON(http.StatusOK, photos)
}

// Upload photo
func uploadHandler(c *gin.Context) {
	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file uploaded",
		})
		return
	}

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	if !allowedTypes[file.Header.Get("Content-Type")] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid file type",
		})
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
	filePath := filepath.Join("./uploads", filename)

	// Save original file temporarily
	if err := c.SaveUploadedFile(file, filePath+".tmp"); err != nil {
		log.Printf("Error saving file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save file",
		})
		return
	}

	// Convert to webp
	webpPath := filePath[:len(filePath)-len(filepath.Ext(filePath))] + ".webp"
	err = convertToWebP(filePath+".tmp", webpPath)
	if err != nil {
		log.Printf("Error converting to webp: %v", err)
		os.Remove(filePath + ".tmp")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to convert image to webp",
		})
		return
	}

	// Remove temp file
	os.Remove(filePath + ".tmp")

	// Get file info
	info, err := os.Stat(webpPath)
	if err != nil {
		log.Printf("Error getting file info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get file info",
		})
		return
	}

	// Create photo record
	photo := Photo{
		Title:     c.PostForm("title"),
		Filename:  filepath.Base(webpPath),
		FilePath:  webpPath,
		FileSize:  info.Size(),
		CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
	}

	result := db.Create(&photo)
	if result.Error != nil {
		log.Printf("Error creating photo record: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save photo metadata",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"photo":   photo,
	})
}

// Update photo
func updatePhotoHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid photo ID",
		})
		return
	}

	var photo Photo
	result := db.First(&photo, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Photo not found",
		})
		return
	}

	var updateData struct {
		Title string `json:"title"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request payload",
		})
		return
	}

	photo.Title = updateData.Title
	result = db.Save(&photo)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update photo",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"photo":   photo,
	})
}

// Delete photo
func deletePhotoHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid photo ID",
		})
		return
	}

	var photo Photo
	result := db.First(&photo, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Photo not found",
		})
		return
	}

	// Delete file from disk
	if _, err := os.Stat(photo.FilePath); err == nil {
		if err := os.Remove(photo.FilePath); err != nil {
			log.Printf("Error deleting file: %v", err)
		}
	}

	// Delete record from database
	result = db.Delete(&photo)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete photo",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Photo deleted successfully",
	})
}
package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AssessmentData struct {
	Metadata            Metadata            `json:"metadata"`
	Scores              Scores              `json:"scores"`
	Interpretation      Interpretation      `json:"interpretation"`
	QuestionsAndAnswers []QuestionAndAnswer `json:"questionsAndAnswers"`
}

type Metadata struct {
	TestName          string    `json:"testName"`
	TestDate          time.Time `json:"testDate"`
	TotalQuestions    int       `json:"totalQuestions"`
	AnsweredQuestions int       `json:"answeredQuestions"`
}

type Scores struct {
	Total         int `json:"total"`
	MaxTotal      int `json:"maxTotal"`
	Language      int `json:"language"`
	MaxLanguage   int `json:"maxLanguage"`
	Social        int `json:"social"`
	MaxSocial     int `json:"maxSocial"`
	Sensory       int `json:"sensory"`
	MaxSensory    int `json:"maxSensory"`
	Restricted    int `json:"restricted"`
	MaxRestricted int `json:"maxRestricted"`
}

type QuestionAndAnswer struct {
	ID         int     `json:"id"`
	Text       string  `json:"text"`
	Category   string  `json:"category"`
	Reverse    bool    `json:"reverse"`
	Answer     int     `json:"answer"`
	AnswerText string  `json:"answerText"`
	Comment    *string `json:"comment"`
	Score      int     `json:"score"`
}

type Interpretation struct {
	Level       string `json:"level"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
}

type ClaudeRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	Messages  []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ClaudeResponse struct {
	Content []ContentBlock `json:"content"`
}

type ContentBlock struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type DynamicDocsRequest struct {
	Template     string            `json:"template"`
	Engine       string            `json:"engine"`
	OutputFormat string            `json:"output_format"`
	Options      map[string]string `json:"options,omitempty"`
}

type PDFResponse struct {
	Success     bool      `json:"success"`
	PDFURL      string    `json:"pdf_url"`
	GeneratedAt time.Time `json:"generated_at"`
	ReportID    string    `json:"report_id"`
}

var (
	claudeAPIKey      = os.Getenv("CLAUDE_API_KEY")
	dynamicDocsAPIKey = os.Getenv("DYNAMIC_DOCS_API_KEY")
	gcsBucket         = os.Getenv("GCS_BUCKET")
	projectID         = os.Getenv("GOOGLE_CLOUD_PROJECT")
)

func main() {
	// Validate required environment variables
	if claudeAPIKey == "" {
		log.Fatal("CLAUDE_API_KEY environment variable is required")
	}
	if dynamicDocsAPIKey == "" {
		log.Fatal("DYNAMIC_DOCS_API_KEY environment variable is required")
	}
	if gcsBucket == "" {
		log.Fatal("GCS_BUCKET environment variable is required")
	}

	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Health check and CORS middleware
	r.Use(corsMiddleware())
	r.Use(loggingMiddleware())

	// Routes
	r.GET("/health", healthCheck)
	r.POST("/generate-pdf", generatePDFHandler)
	r.GET("/status/:reportId", getReportStatus)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 RAADS-R PDF Service starting on port %s", port)
	log.Printf("📊 Using Claude API for LaTeX generation")
	log.Printf("📄 Using Dynamic Documents API for PDF compilation")
	log.Printf("☁️  Using GCS bucket: %s", gcsBucket)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func loggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

func healthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"status":    "healthy",
		"service":   "raads-r-pdf-service",
		"timestamp": time.Now().UTC(),
		"version":   "1.0.0",
	})
}

func getReportStatus(c *gin.Context) {
	reportID := c.Param("reportId")
	// This could be extended to check report status from a database
	c.JSON(200, gin.H{
		"report_id": reportID,
		"status":    "completed",
	})
}

func generatePDFHandler(c *gin.Context) {
	var data AssessmentData

	if err := c.ShouldBindJSON(&data); err != nil {
		log.Printf("❌ Invalid JSON data: %v", err)
		c.JSON(400, gin.H{"error": "Invalid JSON data: " + err.Error()})
		return
	}

	// Validate the assessment data
	if err := validateAssessmentData(data); err != nil {
		log.Printf("❌ Invalid assessment data: %v", err)
		c.JSON(400, gin.H{"error": "Invalid assessment data: " + err.Error()})
		return
	}

	reportID := uuid.New().String()
	log.Printf("📋 Processing PDF generation request %s", reportID)
	log.Printf("   - Total Score: %d/%d", data.Scores.Total, data.Scores.MaxTotal)
	log.Printf("   - Test: %s", data.Metadata.TestName)
	log.Printf("   - Questions: %d answered out of %d", data.Metadata.AnsweredQuestions, data.Metadata.TotalQuestions)

	// Step 1: Generate Markdown report with Claude
	log.Printf("🤖 Generating Markdown report with Claude...")
	markdownContent, err := generateMarkdownReportWithClaude(data)
	if err != nil {
		log.Printf("❌ Error generating Markdown: %v", err)
		c.JSON(500, gin.H{"error": "Failed to generate Markdown: " + err.Error()})
		return
	}

	log.Printf("✅ Generated Markdown content (%d characters)", len(markdownContent))

	// Dump the Markdown content to a file for debugging
	if err := os.WriteFile("report.md", []byte(markdownContent), 0644); err != nil {
		log.Printf("❌ Error writing Markdown to file: %v", err)
	} else {
		log.Printf("📝 Dumped Markdown to report.md for debugging")
	}

	// Step 2: Inject Markdown into LaTeX template
	log.Printf("📝 Injecting Markdown into LaTeX template...")
	latexContent := injectMarkdownIntoLaTeXTemplate(markdownContent, data)

	log.Printf("✅ Generated LaTeX content (%d characters)", len(latexContent))

	// Helper function for min
	minFunc := func(a, b int) int {
		if a < b {
			return a
		}
		return b
	}

	log.Printf("📄 LaTeX content preview:\n%s\n", latexContent[:minFunc(500, len(latexContent))]) // Preview first 500 chars

	// Dump the LaTeX content to a file for debugging
	if err := os.WriteFile("report.tex", []byte(latexContent), 0644); err != nil {
		log.Printf("❌ Error writing LaTeX to file: %v", err)
	} else {
		log.Printf("📝 Dumped LaTeX to report.tex for debugging")
	}

	// Step 2: Generate PDF with Dynamic Documents API
	log.Printf("📄 Compiling PDF with Dynamic Documents API...")
	pdfURL, err := generatePDFWithDynamicDocs(latexContent, reportID)
	if err != nil {
		log.Printf("❌ Error generating PDF: %v", err)
		c.JSON(500, gin.H{"error": "Failed to generate PDF: " + err.Error()})
		return
	}

	log.Printf("🎉 Successfully generated PDF: %s", pdfURL)

	response := PDFResponse{
		Success:     true,
		PDFURL:      pdfURL,
		GeneratedAt: time.Now().UTC(),
		ReportID:    reportID,
	}

	c.JSON(200, response)
}

func validateAssessmentData(data AssessmentData) error {
	if len(data.QuestionsAndAnswers) == 0 {
		return fmt.Errorf("no questions and answers provided")
	}

	if data.Scores.Total < 0 || data.Scores.Total > data.Scores.MaxTotal {
		return fmt.Errorf("invalid total score: %d", data.Scores.Total)
	}

	if data.Metadata.TestName == "" {
		return fmt.Errorf("test name is required")
	}

	if data.Metadata.TotalQuestions != len(data.QuestionsAndAnswers) {
		return fmt.Errorf("total questions mismatch: expected %d, got %d",
			data.Metadata.TotalQuestions, len(data.QuestionsAndAnswers))
	}

	return nil
}

func generatePDFWithDynamicDocs(latexContent, reportID string) (string, error) {
	// Encode LaTeX content as base64
	base64Content := base64.StdEncoding.EncodeToString([]byte(latexContent))

	log.Printf("📝 Encoded LaTeX to base64 (%d characters)", len(base64Content))

	dynamicDocsReq := DynamicDocsRequest{
		Template:     base64Content,
		Engine:       "pdflatex",
		OutputFormat: "pdf",
		Options: map[string]string{
			"template_encoding": "base64",
		},
	}

	jsonData, err := json.Marshal(dynamicDocsReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Dynamic Docs request: %w", err)
	}

	apiURL := "https://advicement.io/api/documents/compile"
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create Dynamic Docs request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+dynamicDocsAPIKey)

	log.Printf("🔄 Sending request to Dynamic Documents API...")

	client := &http.Client{Timeout: 180 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call Dynamic Docs API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != 200 {
		log.Printf("❌ Dynamic Docs API error response: %s", string(body))
		return "", fmt.Errorf("Dynamic Docs API error %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("✅ Successfully received PDF from Dynamic Documents API (%d bytes)", len(body))

	// Check if response is JSON (contains download URL) or binary (PDF data)
	contentType := resp.Header.Get("Content-Type")
	if contentType == "application/json" {
		var jsonResp map[string]interface{}
		if err := json.Unmarshal(body, &jsonResp); err == nil {
			if downloadURL, ok := jsonResp["download_url"].(string); ok {
				log.Printf("📎 Using PDF download URL from Dynamic Docs API")
				return downloadURL, nil
			}
			if errorMsg, ok := jsonResp["error"].(string); ok {
				return "", fmt.Errorf("Dynamic Docs API error: %s", errorMsg)
			}
		}
	}

	// If response is binary PDF data, upload to GCS
	log.Printf("☁️  Uploading PDF to Google Cloud Storage...")
	pdfURL, err := uploadToGCS(body, reportID)
	if err != nil {
		return "", fmt.Errorf("failed to upload PDF to GCS: %w", err)
	}

	return pdfURL, nil
}

func uploadToGCS(pdfData []byte, reportID string) (string, error) {
	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to create GCS client: %w", err)
	}
	defer client.Close()

	bucket := client.Bucket(gcsBucket)
	filename := fmt.Sprintf("reports/raads_report_%s_%s.pdf",
		time.Now().Format("2006-01-02"),
		reportID)

	obj := bucket.Object(filename)

	w := obj.NewWriter(ctx)
	w.ContentType = "application/pdf"
	w.CacheControl = "public, max-age=3600"
	w.Metadata = map[string]string{
		"report-id":  reportID,
		"service":    "raads-r-pdf",
		"created-at": time.Now().UTC().Format(time.RFC3339),
	}

	// Make the object publicly readable
	w.ACL = []storage.ACLRule{{Entity: storage.AllUsers, Role: storage.RoleReader}}

	if _, err := w.Write(pdfData); err != nil {
		w.Close()
		return "", fmt.Errorf("failed to write PDF to GCS: %w", err)
	}

	if err := w.Close(); err != nil {
		return "", fmt.Errorf("failed to close GCS writer: %w", err)
	}

	log.Printf("✅ Uploaded PDF to GCS: %s", filename)

	// Return public URL
	return fmt.Sprintf("https://storage.googleapis.com/%s/%s", gcsBucket, filename), nil
}

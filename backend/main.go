package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yuin/goldmark"
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

	// Step 2: Generate HTML report instead of LaTeX
	log.Printf("🌐 Generating HTML report...")
	htmlContent := generateHTMLReport(markdownContent, data, reportID)

	log.Printf("✅ Generated HTML content (%d characters)", len(htmlContent))

	// Dump the HTML content to a file for debugging
	if err := os.WriteFile("report.html", []byte(htmlContent), 0644); err != nil {
		log.Printf("❌ Error writing HTML to file: %v", err)
	} else {
		log.Printf("📝 Dumped HTML to report.html for debugging")
	}

	// Step 3: Return HTML for client-side PDF generation
	log.Printf("📄 Returning HTML for client-side printing...")

	response := PDFResponse{
		Success:     true,
		PDFURL:      "", // No PDF URL needed - client will generate
		GeneratedAt: time.Now().UTC(),
		ReportID:    reportID,
	}

	// Return HTML content for client-side PDF generation
	c.JSON(200, gin.H{
		"success":      response.Success,
		"report_id":    response.ReportID,
		"generated_at": response.GeneratedAt,
		"html_content": htmlContent,
		"print_ready":  true,
	})
}

// generateHTMLReport creates a print-ready HTML document with CSS styling and charts
func generateHTMLReport(markdownContent string, data AssessmentData, reportID string) string {
	// Calculate total score from the data structure
	totalScore := data.Scores.Total

	// Create HTML template with placeholders
	htmlTemplate := `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAADS-R Assessment Report</title>
    <style>
        /* Print-optimized CSS */
        @media print {
            body { 
                font-size: 11pt; 
                line-height: 1.4; 
                color: #000;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                margin: 0;
                padding: 0;
            }
            .page-break { page-break-before: always; }
            .no-print { display: none; }
            
            /* Show title page only in print */
            .title-page { display: flex !important; }
            
            /* Headers and footers */
            @page {
                margin: 5cm 2cm 4cm 2cm;
                @top-left {
                    content: "RAADS-R Assessment Report";
                    font-size: 12pt;
                    font-weight: bold;
                    color: #2c3e50;
                    border-bottom: 2px solid #3498db;
                }
                @top-center {
                    content: attr(data-participant-header);
                    font-size: 12pt;
                    font-weight: bold;
                    color: #2c3e50;
                    border-bottom: 2px solid #3498db;
                }
                @top-right {
                    content: "Page " counter(page);
                    font-size: 12pt;
                    font-weight: bold;
                    color: #2c3e50;
                    border-bottom: 2px solid #3498db;
                }
                @bottom-center {
                    content: "Generated by raphink.github.io/raads-r";
                    font-size: 9pt;
                    color: #666;
                    border-top: 1px solid #ddd;
                }
            }
            
            /* No header/footer on front page */
            @page title-page {
                margin: 2cm;
                @top-left { content: none; }
                @top-center { content: none; }
                @top-right { content: none; }
                @bottom-center { content: none; }
            }
            
            /* Ensure colors print */
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            /* Front page styling */
            .title-page {
                page-break-after: always;
                page: title-page;
                height: 90vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                background: white !important;
                color: #2c3e50 !important;
                padding: 40px;
                border: 3px solid #2c3e50 !important;
            }
            
            .title-page h1 {
                font-size: 42pt !important;
                margin-bottom: 15px !important;
                border: none !important;
                color: #2c3e50 !important;
                font-weight: bold !important;
            }
            
            .title-page .subtitle {
                font-size: 20pt !important;
                margin-bottom: 30px !important;
                color: #34495e !important;
                font-style: italic !important;
            }
            
            .title-page .assessment-info {
                background: #f8f9fa !important;
                padding: 25px !important;
                border-radius: 10px !important;
                margin: 30px 0 !important;
                border: 2px solid #2c3e50 !important;
            }
            
            .title-page .participant-details {
                margin: 20px 0 !important;
                font-size: 16pt !important;
                color: #2c3e50 !important;
            }
            
            .title-page .footer-info {
                margin-top: 30px !important;
                font-size: 11pt !important;
                color: #7f8c8d !important;
            }
            
            /* Ensure score text is visible in print */
            .score-bar {
                color: #000 !important;
                background-color: #3498db !important;
                border: 1px solid #000 !important;
                font-weight: bold !important;
            }
            
            .threshold-marker::after,
            .average-marker::after {
                color: #000 !important;
                font-weight: bold !important;
            }
            
            /* Ensure chart containers have borders in print */
            .chart-container-inner {
                border: 2px solid #000 !important;
                background: #e8e8e8 !important;
            }
            
            /* Preserve colors in print */
            .chart-wrapper {
                background: #f9f9f9 !important;
                border: 1px solid #000 !important;
            }
            
            .score-summary {
                background: #f8f9fa !important;
                border: 1px solid #000 !important;
            }
            
            .participant-info {
                background: #f8f9fa !important;
                border: 1px solid #000 !important;
                page-break-inside: avoid;
            }
            
            .participant-field input {
                border: none !important;
                border-bottom: 1px solid #000 !important;
                border-radius: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                padding: 2px 0 !important;
                font-weight: bold !important;
            }
            
            /* Appendix print styling */
            .question-item {
                background: #f8f9fa !important;
                border: 1px solid #000 !important;
                box-shadow: none !important;
                page-break-inside: avoid;
                margin-bottom: 10px;
            }
            
            .answer-section {
                background: white !important;
                border-left: 2px solid #3498db !important;
            }
            
            .comment-text {
                background: #ecf0f1 !important;
                border: 1px solid #bdc3c7 !important;
            }
            
            /* Color preservation for category badges */
            .question-category.social { background: #e74c3c !important; color: white !important; }
            .question-category.language { background: #f39c12 !important; color: white !important; }
            .question-category.sensory { background: #27ae60 !important; color: white !important; }
            .question-category.restricted { background: #9b59b6 !important; color: white !important; }
            
            .question-number {
                background: #3498db !important;
                color: white !important;
            }
            
            .score-badge {
                background: #27ae60 !important;
                color: white !important;
            }
        }
        
        /* Hide title page in normal view */
        .title-page {
            display: none;
        }
        
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background: white;
        }
        
        h1, h2, h3 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        
        h1 {
            text-align: center;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        .score-summary {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .score-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .score-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #ddd;
        }
        
        .score-value {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        
        .score-label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .chart-container {
            margin: 30px 0;
            text-align: center;
        }
        
        .chart-wrapper {
            display: flex;
            justify-content: space-around;
            align-items: flex-end;
            height: 250px;
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #ddd;
            background: #f9f9f9;
        }
        
        .chart-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 120px;
            position: relative;
        }
        
        .chart-label {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            color: #666;
        }
        
        .chart-container-inner {
            position: relative;
            width: 60px;
            height: 180px;
            border: 1px solid #bbb;
            background: #e8e8e8; /* Grey background like TikZ */
        }
        
        .score-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: #3498db;
            border-radius: 2px 2px 0 0;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
            padding-bottom: 3px;
        }
        
        .threshold-marker {
            position: absolute;
            left: -5px;
            right: -5px;
            height: 2px;
            background-color: #e74c3c;
            border: 1px solid #c0392b;
        }
        
        .threshold-marker::after {
            content: attr(data-label);
            position: absolute;
            right: -25px;
            top: -8px;
            font-size: 9px;
            color: #e74c3c;
            font-weight: bold;
            white-space: nowrap;
        }
        
        .average-marker {
            position: absolute;
            left: -5px;
            right: -5px;
            height: 2px;
            background-color: #27ae60;
            border: 1px solid #229954;
        }
        
        .average-marker::after {
            content: attr(data-label);
            position: absolute;
            right: -25px;
            top: -8px;
            font-size: 9px;
            color: #27ae60;
            font-weight: bold;
            white-space: nowrap;
        }
        
        .max-score-label {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 9px;
            color: #666;
            font-weight: bold;
        }
        
        .chart-legend {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
        }
        
        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
        }
        
        .markdown-content {
            line-height: 1.6;
            margin: 30px 0;
        }
        
        .markdown-content p {
            margin: 1em 0;
        }
        
        .markdown-content ul {
            margin: 1em 0;
            padding-left: 2em;
        }
        
        .markdown-content li {
            margin: 0.5em 0;
        }
        
        .print-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0;
        }
        
        .print-btn:hover {
            background: #2980b9;
        }
        
        /* Participant information styling */
        .participant-info {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .participant-field {
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .participant-field label {
            font-weight: bold;
            color: #2c3e50;
            min-width: 140px;
            display: inline-block;
        }
        
        .participant-field input {
            flex: 1;
            padding: 8px 12px;
            border: 2px solid #dee2e6;
            border-radius: 4px;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.3s ease;
            background: white;
        }
        
        .participant-field input:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        
        .participant-field input:hover {
            border-color: #bdc3c7;
        }
        
        /* Print styles for input fields */
        @media print {
            .participant-field input {
                border: none !important;
                border-bottom: 1px solid #000 !important;
                border-radius: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                padding: 2px 0 !important;
                font-weight: bold !important;
            }
            
            .participant-info {
                background: transparent !important;
                border: 1px solid #000 !important;
                page-break-inside: avoid;
            }
        }
        
        /* Appendix styling */
        .appendix-container {
            margin-top: 40px;
        }
        
        .question-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            margin-bottom: 15px;
            padding: 20px;
            transition: box-shadow 0.2s ease;
        }
        
        .question-item:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .question-number {
            background: #3498db;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            min-width: 40px;
            text-align: center;
        }
        
        .question-category {
            background: #95a5a6;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .question-category.social { background: #e74c3c; }
        .question-category.language { background: #f39c12; }
        .question-category.sensory { background: #27ae60; }
        .question-category.restricted { background: #9b59b6; }
        
        .question-text {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 12px;
            color: #2c3e50;
        }
        
        .answer-section {
            background: white;
            border-radius: 4px;
            padding: 12px;
            border-left: 4px solid #3498db;
        }
        
        .answer-text {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .comment-text {
            font-style: italic;
            color: #7f8c8d;
            background: #ecf0f1;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 8px;
            border-left: 3px solid #bdc3c7;
        }
        
        .score-badge {
            display: inline-block;
            background: #27ae60;
            color: white;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 8px;
        }
        
        @media print {
            .question-item {
                background: transparent !important;
                border: 1px solid #000 !important;
                box-shadow: none !important;
                page-break-inside: avoid;
                margin-bottom: 10px;
            }
            
            .answer-section {
                background: transparent !important;
                border-left: 2px solid #000 !important;
            }
            
            .comment-text {
                background: transparent !important;
                border: 1px solid #000 !important;
            }
        }
    </style>
    <script>
        // Update participant information dynamically
        function updateParticipantInfo() {
            const name = document.getElementById('participant-name').value || '[Name to be filled]';
            const age = document.getElementById('participant-age').value || '[Age]';
            
			// Update CSS custom property for print header
            document.documentElement.style.setProperty('--participant-header', '"' + name + ' - ' + age + ' years"');
            
            // Update front page using CSS classes
            const participantName = document.querySelector('.participant-name');
            const participantAge = document.querySelector('.participant-age');
            
            if (participantName) participantName.textContent = name;
            if (participantAge) participantAge.textContent = age + ' years';
        }
        
        // Add event listeners when page loads
        document.addEventListener('DOMContentLoaded', function() {
            const nameInput = document.getElementById('participant-name');
            const ageInput = document.getElementById('participant-age');
            
            nameInput.addEventListener('input', updateParticipantInfo);
            ageInput.addEventListener('input', updateParticipantInfo);
            
            // Initial update
            updateParticipantInfo();
        });
    </script>
</head>
<body data-participant-header="[Name to be filled] - [Age] years">
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">🖨️ Print Report</button>
    </div>
    
    <!-- Title Page -->
        <!-- Front Page (Only visible when printing) -->
    <div class="title-page">
        <h1>ASSESSMENT REPORT</h1>
        <div class="subtitle">Ritvo Autism Asperger Diagnostic Scale - Revised</div>
        
        <div class="participant-details">
            <div style="margin-bottom: 15px;"><strong>Participant:</strong> <span class="participant-name">[Name to be filled]</span></div>
            <div style="margin-bottom: 15px;"><strong>Age:</strong> <span class="participant-age">[Age] years</span></div>
        </div>
        
        <div class="assessment-info">
            <div style="font-size: 16pt; margin-bottom: 20px; font-weight: bold;">Assessment Summary</div>
            <div style="font-size: 14pt; margin-bottom: 10px;">Total Score: <span style="font-weight: bold; font-size: 18pt;">{{TOTAL_SCORE}}/240</span></div>
            <div style="font-size: 14pt;">Assessment Date: <span style="font-weight: bold;">{{ASSESSMENT_DATE}}</span></div>
        </div>
        <div class="footer-info">
            This report was generated using the RAADS-R assessment tool<br>
            <em>This is not a clinical diagnosis and should not replace professional evaluation</em>
        </div>
    </div>

    <div class="no-print" style="background: #e8f4f8; border: 1px solid #3498db; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2c3e50;">📝 Instructions</h3>
        <p style="margin: 10px 0; color: #2c3e50;">
            <strong>Before printing:</strong> Please fill in your personal information below. 
            This information will appear in the printed report.
        </p>
        <ul style="margin: 10px 0; color: #2c3e50;">
            <li>Enter your name (or preferred identifier)</li>
            <li>Specify your age at the time of assessment</li>
            <li>Once filled, click the Print button above to generate your PDF</li>
        </ul>
    </div>

    <div class="participant-info no-print">
        <h3 style="margin-top: 0; color: #2c3e50;">Participant Information</h3>
        <div class="participant-field">
            <label for="participant-name">Name:</label>
            <input type="text" id="participant-name" placeholder="Enter participant name" />
        </div>
        <div class="participant-field">
            <label for="participant-age">Age:</label>
            <input type="number" id="participant-age" placeholder="Enter age" min="18" max="100" />
        </div>
    </div>

    <h1 style="margin-top: 40px;">Assessment Results</h1>

    
    <h2>Score Distribution by Domain</h2>
    <div class="chart-container">
        <div class="chart-wrapper">
            <div class="chart-item">
                <div class="chart-label">Social</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{SOCIAL_MAX}}</div>
                    <div class="score-bar" style="height: {{SOCIAL_BAR_HEIGHT}}%;">{{JS_SOCIAL_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{SOCIAL_THRESHOLD_HEIGHT}}%;" data-label="31"></div>
                    <div class="average-marker" style="bottom: {{SOCIAL_AVERAGE_HEIGHT}}%;" data-label="11"></div>
                </div>
            </div>
            <div class="chart-item">
                <div class="chart-label">Language</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{LANGUAGE_MAX}}</div>
                    <div class="score-bar" style="height: {{LANGUAGE_BAR_HEIGHT}}%;">{{JS_LANGUAGE_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{LANGUAGE_THRESHOLD_HEIGHT}}%;" data-label="4"></div>
                    <div class="average-marker" style="bottom: {{LANGUAGE_AVERAGE_HEIGHT}}%;" data-label="2"></div>
                </div>
            </div>
            <div class="chart-item">
                <div class="chart-label">Sensory/Motor</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{SENSORY_MAX}}</div>
                    <div class="score-bar" style="height: {{SENSORY_BAR_HEIGHT}}%;">{{JS_SENSORY_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{SENSORY_THRESHOLD_HEIGHT}}%;" data-label="16"></div>
                    <div class="average-marker" style="bottom: {{SENSORY_AVERAGE_HEIGHT}}%;" data-label="6"></div>
                </div>
            </div>
            <div class="chart-item">
                <div class="chart-label">Restricted</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{RESTRICTED_MAX}}</div>
                    <div class="score-bar" style="height: {{RESTRICTED_BAR_HEIGHT}}%;">{{JS_RESTRICTED_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{RESTRICTED_THRESHOLD_HEIGHT}}%;" data-label="24"></div>
                    <div class="average-marker" style="bottom: {{RESTRICTED_AVERAGE_HEIGHT}}%;" data-label="8"></div>
                </div>
            </div>
            <div class="chart-item">
                <div class="chart-label">Total</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{TOTAL_MAX}}</div>
                    <div class="score-bar" style="height: {{TOTAL_BAR_HEIGHT}}%;">{{JS_TOTAL_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{TOTAL_THRESHOLD_HEIGHT}}%;" data-label="65"></div>
                    <div class="average-marker" style="bottom: {{TOTAL_AVERAGE_HEIGHT}}%;" data-label="25"></div>
                </div>
            </div>
        </div>
        <div class="chart-legend">
            <div class="legend-item">
                <div class="legend-color" style="background-color: #3498db;"></div>
                <span>Your Score</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #e74c3c;"></div>
                <span>Autistic Threshold</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #27ae60;"></div>
                <span>Neurotypical Average</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #e8e8e8;"></div>
                <span>Maximum Possible</span>
            </div>
        </div>
    </div>
    
    {{MARKDOWN_CONTENT}}

	<div class="page-break"></div>
	<div class="appendix-container">
		<h2>Appendix: Questions and Answers</h2>
		<p style="color: #666; margin-bottom: 20px;">Complete assessment responses with participant comments where provided.</p>
		{{LIST_OF_QUESTIONS}}
	</div>

	<div class="footer">
		<p>Generated on {{GENERATED_AT}} by raphink.github.io/raads-r</p>
		<p>Report ID: {{REPORT_ID}}</p>
	</div>
</body>
</html>`

	// Convert markdown to HTML using goldmark
	htmlContent := convertMarkdownToHTML(markdownContent)

	// Calculate bar heights for chart based on actual max scores per domain
	// Use the MaxXXX values from the data structure for proper scaling

	// Calculate percentages for bar heights (based on actual max scores)
	socialHeight := (data.Scores.Social * 100) / data.Scores.MaxSocial
	socialThresholdHeight := (31 * 100) / data.Scores.MaxSocial
	socialAverageHeight := (11 * 100) / data.Scores.MaxSocial

	languageHeight := (data.Scores.Language * 100) / data.Scores.MaxLanguage
	languageThresholdHeight := (4 * 100) / data.Scores.MaxLanguage
	languageAverageHeight := (2 * 100) / data.Scores.MaxLanguage

	sensoryHeight := (data.Scores.Sensory * 100) / data.Scores.MaxSensory
	sensoryThresholdHeight := (16 * 100) / data.Scores.MaxSensory
	sensoryAverageHeight := (6 * 100) / data.Scores.MaxSensory

	restrictedHeight := (data.Scores.Restricted * 100) / data.Scores.MaxRestricted
	restrictedThresholdHeight := (24 * 100) / data.Scores.MaxRestricted
	restrictedAverageHeight := (8 * 100) / data.Scores.MaxRestricted

	totalHeight := (totalScore * 100) / data.Scores.MaxTotal
	totalThresholdHeight := (65 * 100) / data.Scores.MaxTotal
	totalAverageHeight := (25 * 100) / data.Scores.MaxTotal

	// Replace placeholders with actual values
	result := strings.ReplaceAll(htmlTemplate, "{{TOTAL_SCORE}}", fmt.Sprintf("%d", totalScore))
	result = strings.ReplaceAll(result, "{{LANGUAGE_SCORE}}", fmt.Sprintf("%d", data.Scores.Language))
	result = strings.ReplaceAll(result, "{{SOCIAL_SCORE}}", fmt.Sprintf("%d", data.Scores.Social))
	result = strings.ReplaceAll(result, "{{SENSORY_SCORE}}", fmt.Sprintf("%d", data.Scores.Sensory))
	result = strings.ReplaceAll(result, "{{RESTRICTED_SCORE}}", fmt.Sprintf("%d", data.Scores.Restricted))
	result = strings.ReplaceAll(result, "{{MARKDOWN_CONTENT}}", htmlContent)

	// Participant information placeholders (will be updated by JavaScript)
	result = strings.ReplaceAll(result, "{{PARTICIPANT_NAME}}", "[Name to be filled]")
	result = strings.ReplaceAll(result, "{{PARTICIPANT_AGE}}", "[Age]")

	// Assessment date for title page
	assessmentDate := data.Metadata.TestDate.Format("January 2, 2006")
	result = strings.ReplaceAll(result, "{{ASSESSMENT_DATE}}", assessmentDate)

	// Replace max score placeholders
	result = strings.ReplaceAll(result, "{{SOCIAL_MAX}}", fmt.Sprintf("%d", data.Scores.MaxSocial))
	result = strings.ReplaceAll(result, "{{LANGUAGE_MAX}}", fmt.Sprintf("%d", data.Scores.MaxLanguage))
	result = strings.ReplaceAll(result, "{{SENSORY_MAX}}", fmt.Sprintf("%d", data.Scores.MaxSensory))
	result = strings.ReplaceAll(result, "{{RESTRICTED_MAX}}", fmt.Sprintf("%d", data.Scores.MaxRestricted))
	result = strings.ReplaceAll(result, "{{TOTAL_MAX}}", fmt.Sprintf("%d", data.Scores.MaxTotal))

	// Replace score placeholders
	result = strings.ReplaceAll(result, "{{JS_SOCIAL_SCORE}}", fmt.Sprintf("%d", data.Scores.Social))
	result = strings.ReplaceAll(result, "{{JS_LANGUAGE_SCORE}}", fmt.Sprintf("%d", data.Scores.Language))
	result = strings.ReplaceAll(result, "{{JS_SENSORY_SCORE}}", fmt.Sprintf("%d", data.Scores.Sensory))
	result = strings.ReplaceAll(result, "{{JS_RESTRICTED_SCORE}}", fmt.Sprintf("%d", data.Scores.Restricted))
	result = strings.ReplaceAll(result, "{{JS_TOTAL_SCORE}}", fmt.Sprintf("%d", totalScore))

	// Replace bar height placeholders
	result = strings.ReplaceAll(result, "{{SOCIAL_BAR_HEIGHT}}", fmt.Sprintf("%d", socialHeight))
	result = strings.ReplaceAll(result, "{{SOCIAL_THRESHOLD_HEIGHT}}", fmt.Sprintf("%d", socialThresholdHeight))
	result = strings.ReplaceAll(result, "{{SOCIAL_AVERAGE_HEIGHT}}", fmt.Sprintf("%d", socialAverageHeight))

	result = strings.ReplaceAll(result, "{{LANGUAGE_BAR_HEIGHT}}", fmt.Sprintf("%d", languageHeight))
	result = strings.ReplaceAll(result, "{{LANGUAGE_THRESHOLD_HEIGHT}}", fmt.Sprintf("%d", languageThresholdHeight))
	result = strings.ReplaceAll(result, "{{LANGUAGE_AVERAGE_HEIGHT}}", fmt.Sprintf("%d", languageAverageHeight))

	result = strings.ReplaceAll(result, "{{SENSORY_BAR_HEIGHT}}", fmt.Sprintf("%d", sensoryHeight))
	result = strings.ReplaceAll(result, "{{SENSORY_THRESHOLD_HEIGHT}}", fmt.Sprintf("%d", sensoryThresholdHeight))
	result = strings.ReplaceAll(result, "{{SENSORY_AVERAGE_HEIGHT}}", fmt.Sprintf("%d", sensoryAverageHeight))

	result = strings.ReplaceAll(result, "{{RESTRICTED_BAR_HEIGHT}}", fmt.Sprintf("%d", restrictedHeight))
	result = strings.ReplaceAll(result, "{{RESTRICTED_THRESHOLD_HEIGHT}}", fmt.Sprintf("%d", restrictedThresholdHeight))
	result = strings.ReplaceAll(result, "{{RESTRICTED_AVERAGE_HEIGHT}}", fmt.Sprintf("%d", restrictedAverageHeight))

	result = strings.ReplaceAll(result, "{{TOTAL_BAR_HEIGHT}}", fmt.Sprintf("%d", totalHeight))
	result = strings.ReplaceAll(result, "{{TOTAL_THRESHOLD_HEIGHT}}", fmt.Sprintf("%d", totalThresholdHeight))
	result = strings.ReplaceAll(result, "{{TOTAL_AVERAGE_HEIGHT}}", fmt.Sprintf("%d", totalAverageHeight))

	// replace list of questions
	var questionsList strings.Builder
	for _, qa := range data.QuestionsAndAnswers {
		// Determine category class for color coding
		categoryClass := strings.ToLower(qa.Category)

		questionsList.WriteString(fmt.Sprintf(`<div class="question-item">
			<div class="question-header">
				<span class="question-number">Q%d</span>
				<span class="question-category %s">%s</span>
			</div>
			<div class="question-text">%s</div>
			<div class="answer-section">
				<div class="answer-text">Answer: %s<span class="score-badge">%d pts</span></div>`,
			qa.ID, categoryClass, qa.Category, qa.Text, qa.AnswerText, qa.Score))

		if qa.Comment != nil && *qa.Comment != "" {
			questionsList.WriteString(fmt.Sprintf(`
				<div class="comment-text">💭 Comment: %s</div>`, *qa.Comment))
		}

		questionsList.WriteString("</div></div>")
	}
	result = strings.ReplaceAll(result, "{{LIST_OF_QUESTIONS}}", questionsList.String())

	// replace generated at and report ID
	generatedAt := time.Now().UTC().Format("January 2, 2006 at 3:04 PM")
	result = strings.ReplaceAll(result, "{{GENERATED_AT}}", generatedAt)
	result = strings.ReplaceAll(result, "{{REPORT_ID}}", reportID)

	return result
}

// convertMarkdownToHTML converts markdown to HTML using goldmark
func convertMarkdownToHTML(markdown string) string {
	var buf bytes.Buffer
	md := goldmark.New()
	if err := md.Convert([]byte(markdown), &buf); err != nil {
		log.Printf("❌ Error converting markdown to HTML: %v", err)
		// Fallback to simple text conversion
		return fmt.Sprintf("<p>%s</p>", strings.ReplaceAll(markdown, "\n", "<br>"))
	}
	return buf.String()
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

func generateMarkdownReportWithClaude(data AssessmentData) (string, error) {
	// Count responses with comments
	commentsCount := 0
	for _, qa := range data.QuestionsAndAnswers {
		if qa.Comment != nil && *qa.Comment != "" {
			commentsCount++
		}
	}

	// Calculate completion rate
	completionRate := float64(data.Metadata.AnsweredQuestions) / float64(data.Metadata.TotalQuestions) * 100

	// Serialize the complete assessment data for Claude to analyze
	assessmentJSON, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to serialize assessment data: %w", err)
	}

	prompt := fmt.Sprintf(`Generate a comprehensive RAADS-R clinical report in structured Markdown format. Use the complete assessment data to provide detailed analysis of individual responses and comments.

COMPLETE ASSESSMENT DATA (JSON):
%s

SUMMARY:
- Test Date: %s
- Total Score: %d/%d (Clinical threshold: 65, Neurotypical average: 26)
- Social Score: %d/%d (Clinical threshold: 30, Neurotypical average: 12.5)
- Sensory Score: %d/%d (Clinical threshold: 15, Neurotypical average: 6.5)
- Restricted Score: %d/%d (Clinical threshold: 14, Neurotypical average: 4.5)
- Language Score: %d/%d (Clinical threshold: 3, Neurotypical average: 2.5)
- Interpretation: %s - %s
- Questions answered: %d/%d (%.1f%%)
- Comments provided: %d

ANALYSIS INSTRUCTIONS:
1. Review each individual question and answer in the JSON data
2. Pay special attention to comments provided - these give insight into personal experiences
3. Analyze patterns across domains (Social, Sensory/Motor, Restricted Interests, Language)
4. Look for specific behaviors and traits mentioned in comments
5. Provide clinical insights based on individual responses, not just aggregate scores
6. Reference specific question numbers and responses where relevant
7. Provide evidence-based clinical interpretation

REQUIRED MARKDOWN STRUCTURE:

## Executive Summary

Provide a clear summary of the assessment results, including the overall interpretation and key findings.

### Score Overview

Summarize the domain scores and their clinical significance. Do NOT add a table there.

## Detailed Analysis by Domain

### Social Domain Analysis

### Sensory/Motor Domain Analysis  

### Restricted Interests Domain Analysis

### Language Domain Analysis

## Clinical Interpretation and Recommendations

## Notable Response Patterns

Highlight specific questions where responses were particularly informative, especially those with comments that provide personal insights.

## Conclusion

Provide a clear, evidence-based conclusion with actionable recommendations.

IMPORTANT:
- Write in professional clinical language
- Use EXACT markdown structure, NO top extra title or section, NO tables
- Base all analysis on the actual assessment data provided
- Reference specific question numbers and responses where relevant
- Include direct quotes from comments when they provide insight
- Provide evidence-based interpretations
- Keep analysis objective and clinical
- Do not make diagnostic statements beyond the scope of the RAADS-R`,
		string(assessmentJSON),
		data.Metadata.TestDate.Format("January 2, 2006"),
		data.Scores.Total, data.Scores.MaxTotal,
		data.Scores.Social, data.Scores.MaxSocial,
		data.Scores.Sensory, data.Scores.MaxSensory,
		data.Scores.Restricted, data.Scores.MaxRestricted,
		data.Scores.Language, data.Scores.MaxLanguage,
		data.Interpretation.Level,
		data.Interpretation.Description,
		data.Metadata.AnsweredQuestions, data.Metadata.TotalQuestions, completionRate,
		commentsCount,
		data.Scores.Social, data.Scores.MaxSocial,
		data.Scores.Sensory, data.Scores.MaxSensory,
		data.Scores.Restricted, data.Scores.MaxRestricted,
		data.Scores.Language, data.Scores.MaxLanguage)

	claudeReq := ClaudeRequest{
		Model:     "claude-sonnet-4-20250514",
		MaxTokens: 8000,
		Messages: []Message{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	jsonData, err := json.Marshal(claudeReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Claude request: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create Claude request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", claudeAPIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call Claude API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("claude API error %d: %s", resp.StatusCode, string(body))
	}

	var claudeResp ClaudeResponse
	if err := json.NewDecoder(resp.Body).Decode(&claudeResp); err != nil {
		return "", fmt.Errorf("failed to decode Claude response: %w", err)
	}

	if len(claudeResp.Content) == 0 {
		return "", fmt.Errorf("empty response from Claude API")
	}

	return claudeResp.Content[0].Text, nil
}

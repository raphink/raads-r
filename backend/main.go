package main

import (
	"bufio"
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
	Language            string              `json:"language"`
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
	Stream    bool      `json:"stream,omitempty"`
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

// Streaming response structures
type ClaudeStreamEvent struct {
	Type    string               `json:"type"`
	Delta   *ClaudeStreamDelta   `json:"delta,omitempty"`
	Message *ClaudeStreamMessage `json:"message,omitempty"`
}

type ClaudeStreamDelta struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type ClaudeStreamMessage struct {
	Type  string       `json:"type"`
	Usage *ClaudeUsage `json:"usage,omitempty"`
}

type ClaudeUsage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

var (
	claudeAPIKey = os.Getenv("CLAUDE_API_KEY")

	// Supported languages mapping language code to display name
	supportedLanguages = map[string]string{
		"en": "English",
		"fr": "French",
		"es": "Spanish",
		"it": "Italian",
		"de": "German",
	}
)

func main() {
	// Validate required environment variables
	if claudeAPIKey == "" {
		log.Fatal("CLAUDE_API_KEY environment variable is required")
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
	r.POST("/analyze", analyzeHandler)              // Endpoint for analysis only
	r.POST("/analyze-stream", analyzeStreamHandler) // Streaming analysis endpoint

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 RAADS-R PDF Service starting on port %s", port)
	log.Printf("📊 Using Claude API for report generation")
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if we're in development mode
		isDevelopment := os.Getenv("GIN_MODE") != "release"

		// Production-only origins (always allowed)
		productionOrigins := []string{
			"https://raphink.github.io",
		}

		// Development-only origins (only allowed in dev mode)
		developmentOrigins := []string{
			"http://localhost:3000",
			"http://localhost:8000",
			"http://localhost:8080",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:8000",
			"http://127.0.0.1:8080",
			"file://", // For local file access during development
		}

		// Check if origin is allowed
		allowed := false

		// Always check production origins
		for _, allowedOrigin := range productionOrigins {
			if origin == allowedOrigin || strings.HasPrefix(origin, allowedOrigin) {
				allowed = true
				break
			}
		}

		// Only check development origins in development mode
		if !allowed && isDevelopment {
			for _, allowedOrigin := range developmentOrigins {
				if origin == allowedOrigin || strings.HasPrefix(origin, allowedOrigin) {
					allowed = true
					break
				}
			}

			// Additional fallback for development - allow any localhost origin
			if !allowed && (strings.Contains(origin, "localhost") || strings.Contains(origin, "127.0.0.1")) {
				allowed = true
			}
		}

		// Set CORS headers
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		} else {
			// In production, only allow raphink.github.io, reject everything else
			c.Header("Access-Control-Allow-Origin", "https://raphink.github.io")
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "false")
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

// analyzeHandler provides only the Claude analysis as HTML
func analyzeHandler(c *gin.Context) {
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
	log.Printf("🧠 Processing analysis request %s", reportID)
	log.Printf("   - Total Score: %d/%d", data.Scores.Total, data.Scores.MaxTotal)
	log.Printf("   - Test: %s", data.Metadata.TestName)

	// Generate Markdown analysis with Claude
	log.Printf("🤖 Generating analysis with Claude...")
	markdownContent, err := generateMarkdownReportWithClaude(data)
	if err != nil {
		log.Printf("❌ Error generating analysis: %v", err)
		c.JSON(500, gin.H{"error": "Failed to generate analysis: " + err.Error()})
		return
	}

	log.Printf("✅ Generated analysis content (%d characters)", len(markdownContent))

	// Convert Markdown to HTML for the analysis section only
	var buf bytes.Buffer
	if err := goldmark.New().Convert([]byte(markdownContent), &buf); err != nil {
		log.Printf("❌ Error converting Markdown to HTML: %v", err)
		c.JSON(500, gin.H{"error": "Failed to convert analysis to HTML: " + err.Error()})
		return
	}

	analysisHTML := buf.String()
	log.Printf("📄 Returning analysis HTML...")

	// Return just the analysis HTML (much lighter than full report)
	c.JSON(200, gin.H{
		"success":      true,
		"report_id":    reportID,
		"analysis":     analysisHTML,
		"generated_at": time.Now().UTC(),
	})
}

// analyzeStreamHandler provides streaming Claude analysis as Server-Sent Events
func analyzeStreamHandler(c *gin.Context) {
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
	log.Printf("🧠 Processing streaming analysis request %s", reportID)
	log.Printf("   - Total Score: %d/%d", data.Scores.Total, data.Scores.MaxTotal)

	// Set headers for Server-Sent Events
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Headers", "Cache-Control")

	// Send initial metadata
	c.SSEvent("metadata", gin.H{
		"report_id":  reportID,
		"started_at": time.Now().UTC(),
	})

	// Generate streaming analysis with Claude
	log.Printf("🤖 Starting streaming analysis with Claude...")
	err := streamMarkdownReportWithClaude(data, c)
	if err != nil {
		log.Printf("❌ Error during streaming analysis: %v", err)
		c.SSEvent("error", gin.H{"error": "Failed to generate analysis: " + err.Error()})
		return
	}

	// Send completion event
	c.SSEvent("complete", gin.H{
		"completed_at": time.Now().UTC(),
	})
}

func validateAssessmentData(data AssessmentData) error {
	if _, isValid := supportedLanguages[data.Language]; !isValid {
		return fmt.Errorf("invalid language: %s", data.Language)
	}

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

	// Truncate overly long comments (max 500 characters each)
	for i, qa := range data.QuestionsAndAnswers {
		if qa.Comment != nil && len(*qa.Comment) > 500 {
			truncated := (*qa.Comment)[:489] + "[truncated]"
			data.QuestionsAndAnswers[i].Comment = &truncated
			log.Printf("⚠️  Truncated comment for question %d (was %d chars, now %d chars)", qa.ID, len(*qa.Comment), len(truncated))
		}
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

	// Determine language for Claude response
	language := supportedLanguages[data.Language]
	if language == "" {
		language = "English" // fallback
	}

	prompt := fmt.Sprintf(`Generate a comprehensive RAADS-R clinical report in structured Markdown format. RESPOND ENTIRELY IN %s LANGUAGE (including section headers) using appropriate clinical terminology.

COMPLETE ASSESSMENT DATA (JSON):
%s

SUMMARY:
- Test Date: %s
- Total Score: %d/%d (Clinical threshold: 65, Neurotypical average: 26)
- Social Score: %d/%d (Clinical threshold: 31, Neurotypical average: 12.5)
- Sensory Score: %d/%d (Clinical threshold: 16, Neurotypical average: 6.5)
- Restricted Score: %d/%d (Clinical threshold: 15, Neurotypical average: 4.5)
- Language Score: %d/%d (Clinical threshold: 4, Neurotypical average: 2.5)
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

Detailed section, including strengths and weaknesses, coping strategies, and potential interventions, as well as recommendations.

## Notable Response Patterns

Highlight specific questions where responses were particularly informative, especially those with comments that provide personal insights.

## Conclusion

Provide a clear, evidence-based conclusion with actionable recommendations.

IMPORTANT:
- Write in professional clinical language IN %s
- Use EXACT markdown structure, NO top extra title or section, NO tables
- Base all analysis on the actual assessment data provided
- Reference specific question numbers and responses where relevant
- Include direct quotes from comments when they provide insight
- Provide evidence-based interpretations
- Keep analysis objective and clinical
- ALWAYS use the format QX to reference questions (e.g., Q1, Q2)
- Do not make diagnostic statements beyond the scope of the RAADS-R`,
		language,
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
		language)

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

// streamMarkdownReportWithClaude generates a streaming analysis report using Claude API
func streamMarkdownReportWithClaude(data AssessmentData, c *gin.Context) error {
	// Build the prompt for Claude
	language := data.Language
	if language == "" {
		language = "en"
	}

	// Count questions with comments
	commentsCount := 0
	for _, qa := range data.QuestionsAndAnswers {
		if qa.Comment != nil && strings.TrimSpace(*qa.Comment) != "" {
			commentsCount++
		}
	}

	completionRate := float64(data.Metadata.AnsweredQuestions) / float64(data.Metadata.TotalQuestions) * 100

	// Convert assessment data to JSON for detailed analysis
	assessmentJSON, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal assessment data: %w", err)
	}

	// Map language code to full language name
	languageNames := map[string]string{
		"en": "English",
		"fr": "French",
		"es": "Spanish",
		"it": "Italian",
		"de": "German",
	}

	languageName, exists := languageNames[language]
	if !exists {
		languageName = "English" // fallback
	}

	prompt := fmt.Sprintf(`Generate a comprehensive RAADS-R clinical report in structured Markdown format. RESPOND ENTIRELY IN %s LANGUAGE (including section headers) using appropriate clinical terminology.

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
- Write in professional clinical language IN %s
- Use EXACT markdown structure, NO top extra title or section, NO tables
- Base all analysis on the actual assessment data provided
- Reference specific question numbers and responses where relevant
- Include direct quotes from comments when they provide insight
- Provide evidence-based interpretations
- Keep analysis objective and clinical
- Do not make diagnostic statements beyond the scope of the RAADS-R`,
		languageName,
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
		languageName)

	claudeReq := ClaudeRequest{
		Model:     "claude-3-5-sonnet-20241022",
		MaxTokens: 8000,
		Stream:    true,
		Messages: []Message{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	jsonData, err := json.Marshal(claudeReq)
	if err != nil {
		return fmt.Errorf("failed to marshal Claude request: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create Claude request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", claudeAPIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call Claude API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("claude API error %d: %s", resp.StatusCode, string(body))
	}

	// Process the streaming response
	scanner := bufio.NewScanner(resp.Body)
	var markdownBuffer strings.Builder
	lastSentLength := 0
	lastSendTime := time.Now()

	for scanner.Scan() {
		line := scanner.Text()

		// Claude streams in Server-Sent Events format
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")

			// Skip control messages
			if data == "[DONE]" {
				break
			}

			// Parse the JSON event
			var event ClaudeStreamEvent
			if err := json.Unmarshal([]byte(data), &event); err != nil {
				log.Printf("⚠️ Failed to parse streaming event: %v", err)
				continue
			}

			// Handle content delta events
			if event.Type == "content_block_delta" && event.Delta != nil && event.Delta.Type == "text_delta" {
				// Accumulate markdown content
				markdownBuffer.WriteString(event.Delta.Text)

				// Send updates every 100ms or when content grows significantly to avoid overwhelming the client
				currentLength := markdownBuffer.Len()
				timeSinceLastSend := time.Since(lastSendTime)

				if currentLength > lastSentLength+50 || timeSinceLastSend > 100*time.Millisecond {
					// Convert current markdown to HTML and send as chunk
					var buf bytes.Buffer
					if err := goldmark.New().Convert([]byte(markdownBuffer.String()), &buf); err == nil {
						log.Printf("📤 Sending chunk - Length: %d chars, Delta: +%d chars", currentLength, currentLength-lastSentLength)
						c.SSEvent("chunk", gin.H{
							"html":     buf.String(),
							"markdown": markdownBuffer.String(),
						})
						c.Writer.Flush()

						lastSentLength = currentLength
						lastSendTime = time.Now()
					}
				}
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading streaming response: %w", err)
	}

	// Send final chunk with any remaining content
	finalLength := markdownBuffer.Len()
	if finalLength > lastSentLength {
		var buf bytes.Buffer
		if err := goldmark.New().Convert([]byte(markdownBuffer.String()), &buf); err == nil {
			log.Printf("📤 Sending FINAL chunk - Total Length: %d chars, Final Delta: +%d chars", finalLength, finalLength-lastSentLength)
			c.SSEvent("chunk", gin.H{
				"html":     buf.String(),
				"markdown": markdownBuffer.String(),
			})
			c.Writer.Flush()
		}
	}

	return nil
}

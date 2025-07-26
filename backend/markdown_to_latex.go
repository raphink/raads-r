package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

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

# Executive Summary

Provide a clear summary of the assessment results, including the overall interpretation and key findings.

## Score Overview

Summarize the domain scores and their clinical significance. Do not make a table, there's already one before.

# Detailed Analysis by Domain

## Social Domain Analysis

Provide detailed analysis of the social domain score (%d/%d points). Include:
- Comparison to clinical thresholds and neurotypical averages
- Specific questions and responses that contributed to this score
- Comments that provide insight into social experiences
- Clinical interpretation of the pattern of responses

## Sensory/Motor Domain Analysis  

Provide detailed analysis of the sensory/motor domain score (%d/%d points). Include:
- Analysis of sensory processing patterns
- Motor coordination and proprioception findings
- Specific examples from responses and comments
- Clinical significance of the patterns observed

## Restricted Interests Domain Analysis

Provide detailed analysis of the restricted interests domain score (%d/%d points). Include:
- Analysis of special interests and obsessions
- Routine and ritual behaviors
- Resistance to change patterns
- Specific examples from participant responses

## Language Domain Analysis

Provide detailed analysis of the language domain score (%d/%d points). Include:
- Communication patterns and pragmatic language use
- Literal interpretation tendencies
- Social communication challenges
- Specific linguistic behaviors noted

# Clinical Interpretation and Recommendations

Provide comprehensive clinical interpretation based on the complete assessment profile. Include:
- Overall diagnostic considerations
- Strengths and challenges identified
- Recommended next steps or referrals
- Therapeutic considerations

# Notable Response Patterns

Highlight specific questions where responses were particularly informative, especially those with comments that provide personal insights.

# Conclusion

Provide a clear, evidence-based conclusion with actionable recommendations.

IMPORTANT:
- Write in professional clinical language
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
		return "", fmt.Errorf("Claude API error %d: %s", resp.StatusCode, string(body))
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

func injectMarkdownIntoLaTeXTemplate(markdownContent string, data AssessmentData) string {
	// Create a detailed questions list for the appendix
	questionsList := ""
	for _, qa := range data.QuestionsAndAnswers {
		comment := ""
		if qa.Comment != nil && *qa.Comment != "" {
			comment = fmt.Sprintf(" (%s)", *qa.Comment)
		}
		questionsList += fmt.Sprintf("\\item Q%d. %s: %s%s\n", qa.ID, qa.Text, qa.AnswerText, comment)
	}

	// Convert Markdown to LaTeX content (simple conversion for our structured format)
	latexContent := convertMarkdownToLaTeXSimple(markdownContent)

	template := fmt.Sprintf(`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[english]{babel}
\usepackage{lmodern}
\usepackage{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{pgfplots}
\usepackage{booktabs}
\usepackage{array}
\usepackage{longtable}
\usepackage{fancyhdr}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{multirow}

\newcommand{\participantName}{Assessment Participant}
\newcommand{\participantAge}{Adult}
\newcommand{\evaluationDate}{%s}

\newcommand{\totalScore}{%d}
\newcommand{\maxTotalScore}{240}
\newcommand{\threshTotalScore}{65}
\newcommand{\typicalTotalScore}{26}
\newcommand{\socialScore}{%d}
\newcommand{\maxSocialScore}{117}
\newcommand{\threshSocialScore}{30}
\newcommand{\typicalSocialScore}{12.5}
\newcommand{\sensoryScore}{%d}
\newcommand{\maxSensoryScore}{60}
\newcommand{\threshSensoryScore}{15}
\newcommand{\typicalSensoryScore}{6.5}
\newcommand{\restrictedScore}{%d}
\newcommand{\maxRestrictedScore}{42}
\newcommand{\threshRestrictedScore}{14}
\newcommand{\typicalRestrictedScore}{4.5}
\newcommand{\languageScore}{%d}
\newcommand{\maxLanguageScore}{21}
\newcommand{\threshLanguageScore}{3}
\newcommand{\typicalLanguageScore}{2.5}

\newcommand{\interpretationLevel}{%s}
\newcommand{\interpretationDescription}{%s}

\newcommand{\reportTitle}{ASSESSMENT REPORT}
\newcommand{\testName}{RAADS-R Test}
\newcommand{\testFullName}{Ritvo Autism Asperger Diagnostic Scale - Revised}
\newcommand{\participantLabel}{Participant:}
\newcommand{\ageLabel}{Age:}
\newcommand{\evaluationDateLabel}{Evaluation Date:}

\geometry{margin=2.5cm}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\textcolor{primary}{RAADS-R Assessment}}
\fancyhead[R]{\textcolor{primary}{\participantName\ - \participantAge}}
\fancyfoot[C]{\thepage}

\definecolor{primary}{RGB}{41, 128, 185}
\definecolor{secondary}{RGB}{52, 73, 94}
\definecolor{accent}{RGB}{231, 76, 60}
\definecolor{success}{RGB}{39, 174, 96}
\definecolor{warning}{RGB}{243, 156, 18}
\definecolor{lightgray}{RGB}{236, 240, 241}

\titleformat{\section}{\Large\bfseries\color{primary}}{}{0em}{}[\titlerule]
\titleformat{\subsection}{\large\bfseries\color{secondary}}{}{0em}{}

\pgfplotsset{compat=1.18}

\begin{document}

\begin{titlepage}
\centering
\vspace*{2cm}
{\Huge\bfseries\color{primary} \reportTitle}\\[0.5cm]
{\LARGE\color{secondary} \testName}\\[1cm]
{\Large \testFullName}\\[2cm]

\begin{tikzpicture}
\draw[primary, line width=3pt] (-4,0) -- (4,0);
\end{tikzpicture}\\[2cm]

{\Large\bfseries \participantLabel} {\Large \participantName}\\[0.5cm]
{\Large\bfseries \ageLabel} {\Large \participantAge}\\[0.5cm]
{\Large\bfseries \evaluationDateLabel} {\Large \evaluationDate}\\[0.5cm]

\vfill
{\color{secondary}\rule{\linewidth}{2pt}}
\end{titlepage}

\newpage

\begin{center}
\colorbox{accent!20}{\begin{minipage}{0.9\textwidth}
\centering
\vspace{0.5cm}
{\Large\bfseries\color{accent} MAIN RESULT}\\[0.5cm]
{\huge\bfseries Total Score: \totalScore/\maxTotalScore}\\[0.3cm]
{\Large\bfseries\color{accent} \MakeUppercase{\interpretationLevel}}
\vspace{0.5cm}
\end{minipage}}
\end{center}

\vspace{1cm}

The RAADS-R (Ritvo Autism Asperger Diagnostic Scale-Revised) is a standardized self-assessment instrument for diagnosing autism spectrum disorders in adults. With a score of \totalScore, the results indicate \textbf{\interpretationDescription}.

\subsection*{Score Distribution by Domain}

\begin{center}
\begin{tikzpicture}
\begin{axis}[
    ybar,
    width=16cm,
    height=10cm,
    ylabel={Score},
    xlabel={Domain},
    ymin=0,
    ymax=250,
    xtick=data,
    xticklabels={Social, Sensory/Motor, Restricted, Language, \textbf{Total}},
    bar width=0.7cm,
    legend style={at={(0.02,0.98)}, anchor=north west, font=\small},
    enlarge x limits=0.15,
    grid=major,
    grid style={gray!20},
    every axis plot/.append style={thick},
    nodes near coords align={vertical},
]
\addplot[fill=lightgray!40, draw=lightgray, bar shift=0pt] coordinates {
    (1,\maxSocialScore)
    (2,\maxSensoryScore)
    (3,\maxRestrictedScore)
    (4,\maxLanguageScore)
    (5,\maxTotalScore)
};
\addplot[fill=primary!80, draw=primary!90, line width=1pt, bar shift=0pt] coordinates {
    (1,\socialScore)
    (2,\sensoryScore)
    (3,\restrictedScore)
    (4,\languageScore)
    (5,\totalScore)
};
\addplot[only marks, mark=triangle*, mark size=4pt, color=accent, line legend] coordinates {
    (1,\threshSocialScore)
    (2,\threshSensoryScore)
    (3,\threshRestrictedScore)
    (4,\threshLanguageScore)
    (5,\threshTotalScore)
};
\addplot[only marks, mark=square*, mark size=3pt, color=success!80, line legend] coordinates {
    (1,\typicalSocialScore)
    (2,\typicalSensoryScore)
    (3,\typicalRestrictedScore)
    (4,\typicalLanguageScore)
    (5,\typicalTotalScore)
};
\legend{Maximum Score, Your Score, Clinical Threshold, Neurotypical Average}
\end{axis}
\end{tikzpicture}
\end{center}

\begin{center}
\begin{tabular}{lcccc}
\toprule
\textbf{Domain} & \textbf{Your Score} & \textbf{Clinical Threshold} & \textbf{Neurotypical Avg} & \textbf{Maximum} \\
\midrule
Social Relatedness & \socialScore & \threshSocialScore & \typicalSocialScore & \maxSocialScore \\
Sensory/Motor & \sensoryScore & \threshSensoryScore & \typicalSensoryScore & \maxSensoryScore \\
Restricted Interests & \restrictedScore & \threshRestrictedScore & \typicalRestrictedScore & \maxRestrictedScore \\
Language & \languageScore & \threshLanguageScore & \typicalLanguageScore & \maxLanguageScore \\
\midrule
\textbf{Total Score} & \textbf{\totalScore} & \textbf{\threshTotalScore} & \textbf{\typicalTotalScore} & \textbf{\maxTotalScore} \\
\bottomrule
\end{tabular}
\end{center}

\newpage

%s

\newpage
\appendix

\section{Complete Assessment Responses}

This appendix contains all RAADS-R questions with the participant's responses and any comments provided during the assessment.

\begin{itemize}[leftmargin=2cm]
%s
\end{itemize}

\vfill
\begin{center}
{\color{secondary}\rule{\linewidth}{1pt}}\\[0.3cm]
{\footnotesize Report compiled using Claude AI}
\end{center}

\end{document}`,
		data.Metadata.TestDate.Format("January 2, 2006"),
		data.Scores.Total,
		data.Scores.Social,
		data.Scores.Sensory,
		data.Scores.Restricted,
		data.Scores.Language,
		data.Interpretation.Level,
		data.Interpretation.Description,
		latexContent,
		questionsList)

	return template
}

// Fallback simple conversion for cases where CommonMark fails
func convertMarkdownToLaTeXSimple(markdown string) string {
	// Simple Markdown to LaTeX conversion for our structured format
	lines := strings.Split(markdown, "\n")
	var result strings.Builder

	for _, line := range lines {
		line = strings.TrimSpace(line)

		// Skip empty lines
		if line == "" {
			result.WriteString("\n")
			continue
		}

		// Handle headers
		if strings.HasPrefix(line, "# ") {
			title := strings.TrimPrefix(line, "# ")
			result.WriteString(fmt.Sprintf("\\section{%s}\n", escapeLatex(title)))
		} else if strings.HasPrefix(line, "## ") {
			title := strings.TrimPrefix(line, "## ")
			result.WriteString(fmt.Sprintf("\\subsection{%s}\n", escapeLatex(title)))
		} else if strings.HasPrefix(line, "### ") {
			title := strings.TrimPrefix(line, "### ")
			result.WriteString(fmt.Sprintf("\\subsubsection{%s}\n", escapeLatex(title)))
		} else {
			// Regular paragraph
			result.WriteString(escapeLatex(line))
			result.WriteString("\n\n")
		}
	}

	return result.String()
}

func escapeLatex(text string) string {
	// Escape special LaTeX characters
	replacements := map[string]string{
		"&":  "\\&",
		"%":  "\\%",
		"$":  "\\$",
		"#":  "\\#",
		"_":  "\\_",
		"{":  "\\{",
		"}":  "\\}",
		"~":  "\\textasciitilde{}",
		"^":  "\\textasciicircum{}",
		"\\": "\\textbackslash{}",
	}

	for old, new := range replacements {
		text = strings.ReplaceAll(text, old, new)
	}

	// Handle bold text **text** -> \textbf{text}
	boldRegex := regexp.MustCompile(`\*\*(.*?)\*\*`)
	text = boldRegex.ReplaceAllString(text, `\textbf{$1}`)

	// Handle italic text *text* -> \textit{text}
	italicRegex := regexp.MustCompile(`\*(.*?)\*`)
	text = italicRegex.ReplaceAllString(text, `\textit{$1}`)

	return text
}

// Report template and generation functions for client-side report creation
// This file uses data-translate attributes for cleaner translation handling

class ReportTemplate {
    // Generate the complete HTML template (simplified version using external CSS/JS)
    static getHTMLTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-translate="title">RAADS-R Assessment Report</title>
    <link rel="stylesheet" href="report.css">
</head>
<body>
    <!-- Report content with data-translate attributes -->
    <div class="no-print">
        <button id="print-btn" class="print-btn" onclick="window.print()" disabled>
            ⏳ Generating Analysis...
        </button>
        <button class="close-btn" onclick="window.close()">
            <span data-translate="close_report">Close Report</span>
        </button>
    </div>
    
    <!-- Title Page -->
    <div class="title-page">
        <h1 data-translate="assessment_report">ASSESSMENT REPORT</h1>
        <div class="subtitle" data-translate="scale_subtitle">Ritvo Autism Asperger Diagnostic Scale - Revised</div>
        
        <div class="participant-details">
            <div style="margin-bottom: 15px;">
                <strong data-translate="participant">Participant:</strong> 
                <span class="participant-name">[Name to be filled]</span>
            </div>
            <div style="margin-bottom: 15px;">
                <strong data-translate="age">Age:</strong> 
                <span class="participant-age">[Age] years</span>
            </div>
        </div>
        
        <div class="assessment-info">
            <div style="font-size: 16pt; margin-bottom: 20px; font-weight: bold;" data-translate="assessment_summary">Assessment Summary</div>
            <div style="font-size: 14pt; margin-bottom: 10px;">
                <span data-translate="total_score">Total Score:</span> 
                <span style="font-weight: bold; font-size: 18pt;" id="total-score-display">--/240</span>
            </div>
            <div style="font-size: 14pt;">
                <span data-translate="assessment_date">Assessment Date:</span> 
                <span style="font-weight: bold;" id="assessment-date-display">--</span>
            </div>
        </div>
        <div class="footer-info" data-translate="footer_disclaimer">
            This report was generated using the RAADS-R assessment tool<br><em>This is not a clinical diagnosis and should not replace professional evaluation</em>
        </div>
    </div>

    <h1 style="margin-top: 40px;" data-translate="assessment_results">Assessment Results</h1>
    
    <!-- Total Score Card -->
    <div class="interpretation-card total-score-card" id="total-score-card">
        <h2 data-translate="total_score">Total Score</h2>
        <div class="total-score-number" id="total-score-number">--/240</div>
        <div class="interpretation-level" id="interpretation-level">--</div>
        <div class="interpretation-description" id="interpretation-description">--</div>
    </div>

    <h2 data-translate="score_distribution">Score Distribution by Domain</h2>
    <div class="chart-container">
        <div class="chart-wrapper" id="chart-container">
            <!-- Chart will be populated by JavaScript -->
        </div>
        <div class="chart-legend">
            <div class="legend-item">
                <div class="legend-color" style="background-color: #7bc4f5;"></div>
                <span data-translate="your_score">Your Score</span>
            </div>
            <div class="legend-item">
                <div class="legend-color threshold-marker"></div>
                <span data-translate="autistic_threshold">Autistic Threshold</span>
            </div>
            <div class="legend-item">
                <div class="legend-color average-marker"></div>
                <span data-translate="neurotypical_average">Neurotypical Average</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #e8e8e8;"></div>
                <span data-translate="maximum_possible">Maximum Possible</span>
            </div>
        </div>
    </div>
    
    <!-- Analysis section with loading state -->
    <div id="analysis-container" class="analysis-loading" data-translate="reportGenerating">
        🔄 Generating Analysis (this may take up to 1 minute)...
    </div>

    <div class="page-break"></div>
    <div class="appendix-container">
        <h2 data-translate="appendix_title">Appendix: Questions and Answers</h2>
        <p style="color: #666; margin-bottom: 20px;" data-translate="appendix_description">Complete assessment responses with participant comments where provided.</p>
        <div id="questions-container">
            <!-- Questions will be populated by JavaScript -->
        </div>
    </div>

    <div class="footer">
        <p>
            <span data-translate="generated_on">Generated on</span> 
            <span id="generated-date">--</span> 
            <span data-translate="by">by</span> 
            raphink.github.io/raads-r
        </p>
        <p>
            <span data-translate="report_id">Report ID:</span> 
            <span id="report-id-display">--</span>
        </p>
    </div>

    <script src="report.js"></script>
</body>
</html>`;
    }

    // Generate complete report (for immediate display)
    static generateReport(assessmentData, reportId, language = 'en') {
        try {
            // Save report data to localStorage
            const reportData = {
                assessmentData: assessmentData,
                reportId: reportId,
                language: language,
                createdAt: new Date().toISOString(),
                isStreaming: true, // Mark as streaming until analysis is complete
                analysisHTML: null // Will be populated when analysis completes
            };
            
            localStorage.setItem(`raads-report-${reportId}`, JSON.stringify(reportData));
            
            // Open report page with ID parameter
            const reportUrl = `report.html?id=${reportId}&lang=${language}`;
            const reportWindow = window.open(reportUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
            
            return reportWindow;
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }
    
    // Generate report from cached data (assessment + analysis)
    static generateReportFromCache(assessmentData, analysisHTML, reportId, language = 'en') {
        try {
            // Save complete report data to localStorage
            const reportData = {
                assessmentData: assessmentData,
                reportId: reportId,
                language: language,
                createdAt: new Date().toISOString(),
                isStreaming: false, // Analysis is complete
                analysisHTML: analysisHTML
            };
            
            localStorage.setItem(`raads-report-${reportId}`, JSON.stringify(reportData));
            
            // Open report page with ID parameter
            const reportUrl = `report.html?id=${reportId}&lang=${language}`;
            const reportWindow = window.open(reportUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
            
            return reportWindow;
        } catch (error) {
            console.error('Error generating report with cached analysis:', error);
            throw error;
        }
    }
    
    // Update existing report with analysis chunk (called during streaming)
    static updateReportAnalysis(reportId, analysisHTML) {
        try {
            const reportData = localStorage.getItem(`raads-report-${reportId}`);
            if (reportData) {
                const report = JSON.parse(reportData);
                report.analysisHTML = analysisHTML;
                // Keep isStreaming as true - don't change it during streaming
                report.updatedAt = new Date().toISOString();
                
                localStorage.setItem(`raads-report-${reportId}`, JSON.stringify(report));
                
                // Notify any open report windows about the update
                // (They will poll localStorage and update themselves)
            }
        } catch (error) {
            console.error('Error updating report analysis:', error);
        }
    }
    
    // Mark streaming as complete for a report
    static completeReportStreaming(reportId) {
        try {
            const reportData = localStorage.getItem(`raads-report-${reportId}`);
            if (reportData) {
                const report = JSON.parse(reportData);
                report.isStreaming = false; // Mark streaming as complete
                report.completedAt = new Date().toISOString();
                
                localStorage.setItem(`raads-report-${reportId}`, JSON.stringify(report));
            }
        } catch (error) {
            console.error('Error completing report streaming:', error);
        }
    }
}

// Export for use in main application
window.ReportTemplate = ReportTemplate;

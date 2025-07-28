// Report JavaScript functionality for RAADS-R assessment reports

// ReportTemplate class definition for the report window
class ReportTemplate {
    // Generate chart HTML
    static generateChart(assessmentData) {
        const scores = assessmentData.scores;
        
        // Maximum scores for each domain
        const maxScores = {
            social: 117,    // 39 questions × 3 points
            language: 21,   // 7 questions × 3 points  
            sensory: 60,    // 20 questions × 3 points
            restricted: 42, // 14 questions × 3 points
            total: 240      // Total maximum
        };

        // Thresholds and averages
        const thresholds = { social: 31, language: 4, sensory: 16, restricted: 15, total: 65 };
        const averages = { social: 11, language: 2, sensory: 6, restricted: 8, total: 25 };

        const domains = [
            { key: 'social', label: 'social' },
            { key: 'language', label: 'language' },
            { key: 'sensory', label: 'sensory_motor' },
            { key: 'restricted', label: 'restricted' },
            { key: 'total', label: 'total' }
        ];

        let chartHTML = '';
        domains.forEach(domain => {
            const score = domain.key === 'total' ? scores.total : scores[domain.key];
            const maxScore = maxScores[domain.key];
            const threshold = thresholds[domain.key];
            const average = averages[domain.key];

            // Calculate container height proportional to max score (total=240 gets full 380px)
            const baseHeight = 380;
            const containerHeight = Math.round((maxScore / maxScores.total) * baseHeight);
            
            // Calculate bar height as percentage of this domain's container
            const barHeight = Math.round((score / maxScore) * containerHeight);
            const thresholdHeight = Math.round((threshold / maxScore) * containerHeight);
            const averageHeight = Math.round((average / maxScore) * containerHeight);
            
            // Calculate bottom positions for markers (from bottom of container)
            const thresholdBottom = thresholdHeight;
            const averageBottom = averageHeight;

            chartHTML += `
                <div class="chart-item">
                    <div class="chart-label" data-translate="${domain.label}">${domain.label}</div>
                    <div class="chart-container-inner" style="height: ${containerHeight}px;">
                        <div class="max-score-label">${maxScore}</div>
                        <div class="score-bar" style="height: ${barHeight}px;" title="Score: ${score}/${maxScore} (${(score/maxScore*100).toFixed(1)}%)" data-height="${barHeight}"></div>
                        <div class="threshold-marker" style="bottom: ${thresholdBottom}px;" data-label="${threshold}"></div>
                        <div class="average-marker" style="bottom: ${averageBottom}px;" data-label="${average}"></div>
                        <div class="score-display">${score}</div>
                    </div>
                </div>
            `;
        });

        return chartHTML;
    }

    // Get CSS class for question category
    static getCategoryClass(category) {
        switch (category.toLowerCase()) {
            case 'is': return 'social';
            case 'l': return 'language'; 
            case 'sm': return 'sensory';
            case 'ir': return 'restricted';
            default: return '';
        }
    }

    // Generate questions HTML for appendix
    static async generateQuestionsHTML(questionsAndAnswers, language = 'en') {
        try {
            // Load language data to get answer text mappings
            const response = await fetch(`${language}.json`);
            const data = await response.json();
            const translations = data.report || {};
            
            // Fallback answer texts
            const fallbackAnswers = {
                0: "Never true",
                1: "Sometimes true", 
                2: "Often true",
                3: "Always true"
            };

            const answers = translations.answers || fallbackAnswers;
            let html = '';

            for (const qa of questionsAndAnswers) {
                const categoryClass = this.getCategoryClass(qa.category);
                const answerText = answers[qa.answer] || `Answer ${qa.answer}`;
                
                html += `
                    <div class="question-item" id="question-${qa.id}">
                        <div class="question-header">
                            <div class="question-number">Q${qa.id}</div>
                            <div class="question-category ${categoryClass}">${qa.category}</div>
                        </div>
                        <div class="question-text">${qa.text}</div>
                        <div class="answer-section">
                            <div class="answer-text">${answerText} <span class="score-badge">${qa.score} pts</span></div>
                            ${qa.comment ? `<div class="comment-text">"${qa.comment}"</div>` : ''}
                        </div>
                    </div>
                `;
            }

            return html;
        } catch (error) {
            console.warn('Failed to load translations for questions:', error);
            if (language !== 'en') {
                return this.generateQuestionsHTML(questionsAndAnswers, 'en');
            }
            return '';
        }
    }

    // Get interpretation based on score with static fallbacks for robustness
    static getInterpretation(score, lang = null) {
        // If no language data available, use English fallbacks
        const interpretations = lang?.ui?.results?.interpretations || {
            none: { level: "No ASD", description: "No signs of autism detected" },
            light: { level: "Mild traits", description: "Some autistic traits, but probably no ASD" },
            moderate: { level: "Moderate traits", description: "Several autistic traits present" },
            possible: { level: "Possible ASD", description: "Minimum score at which autism is considered" },
            strong: { level: "Strong indication of ASD", description: "Strong indication of autism spectrum disorder" },
            solid: { level: "Solid evidence of ASD", description: "Solid evidence of ASD (average score of autistic individuals)" },
            veryStrong: { level: "Very strong evidence of ASD", description: "Very strong evidence of autism spectrum disorder" }
        };
        
        if (score < 25) return { 
            level: interpretations.none.level, 
            color: "text-success", 
            class: "interp-none", 
            description: interpretations.none.description 
        };
        if (score < 50) return { 
            level: interpretations.light.level, 
            color: "text-warning", 
            class: "interp-light", 
            description: interpretations.light.description 
        };
        if (score < 65) return { 
            level: interpretations.moderate.level, 
            color: "text-warning", 
            class: "interp-moderate", 
            description: interpretations.moderate.description 
        };
        if (score < 90) return { 
            level: interpretations.possible.level, 
            color: "text-danger", 
            class: "interp-possible", 
            description: interpretations.possible.description 
        };
        if (score < 130) return { 
            level: interpretations.strong.level, 
            color: "text-danger", 
            class: "interp-strong", 
            description: interpretations.strong.description 
        };
        if (score < 160) return { 
            level: interpretations.solid.level, 
            color: "text-dark", 
            class: "interp-solid", 
            description: interpretations.solid.description 
        };
        return { 
            level: interpretations.veryStrong.level, 
            color: "text-dark", 
            class: "interp-very-strong", 
            description: interpretations.veryStrong.description 
        };
    }

    // Populate the enhanced total score card
    static populateTotalScoreCard(assessmentData) {
        const totalScore = assessmentData.scores.total;
        const interpretation = this.getInterpretation(totalScore, window.lang);
        
        // Update the total score card elements
        const scoreNumberElement = document.getElementById('total-score-number');
        const levelElement = document.getElementById('interpretation-level');
        const descriptionElement = document.getElementById('interpretation-description');
        const cardElement = document.getElementById('total-score-card');
        
        if (scoreNumberElement) {
            scoreNumberElement.textContent = totalScore + '/240';
        }
        
        if (levelElement) {
            levelElement.textContent = interpretation.level;
            levelElement.className = 'interpretation-level ' + interpretation.color;
        }
        
        if (descriptionElement) {
            descriptionElement.textContent = interpretation.description;
        }
        
        if (cardElement) {
            // Add the interpretation class for border color
            cardElement.className = 'interpretation-card total-score-card ' + interpretation.class;
        }
    }

    // Initialize report with assessment data
    static initializeReport(assessmentData, reportId) {
        console.log('Initializing report with assessment data:', assessmentData);
        console.log('Participant info in assessment data:', assessmentData.participantInfo);
        
        // Store assessment data globally for access by other functions
        window.assessmentData = assessmentData;
        
        // Update basic information
        document.getElementById('total-score-display').textContent = `${assessmentData.scores.total}/240`;
        document.getElementById('assessment-date-display').textContent = new Date(assessmentData.metadata.testDate).toLocaleDateString();
        document.getElementById('generated-date').textContent = new Date().toLocaleDateString();
        document.getElementById('report-id-display').textContent = reportId;

        // Populate the enhanced total score card
        this.populateTotalScoreCard(assessmentData);

        // Generate and insert chart
        const chartHTML = this.generateChart(assessmentData);
        document.getElementById('chart-container').innerHTML = chartHTML;

        // Debug: Check actual bar heights after rendering
        setTimeout(() => {
            const scoreBars = document.querySelectorAll('.score-bar');
            scoreBars.forEach((bar, index) => {
                const computedStyle = window.getComputedStyle(bar);
                const dataHeight = bar.getAttribute('data-height');
                console.log(`Bar ${index}: data-height=${dataHeight}%, computed height=${computedStyle.height}, parent height=${window.getComputedStyle(bar.parentElement).height}`);
            });
        }, 100);

        // Generate and insert questions
        this.generateQuestionsHTML(assessmentData.questionsAndAnswers, assessmentData.language).then(questionsHTML => {
            document.getElementById('questions-container').innerHTML = questionsHTML;
        });
        
        // Initialize participant info now that we have the data
        if (typeof initializeParticipantInfo === 'function') {
            console.log('Calling initializeParticipantInfo...');
            initializeParticipantInfo();
        } else {
            console.warn('initializeParticipantInfo function not found');
        }
        
        // Create the return arrow (it will be shown when question links are clicked)
        this.createReturnArrow();
    }

    // Update analysis section when backend responds (during streaming)
    static updateAnalysis(analysisHTML) {
        const analysisContainer = document.getElementById('analysis-container');
        if (analysisContainer) {
            analysisContainer.className = 'markdown-content';
            // Convert Q references to links
            const linkedHTML = analysisHTML.replace(/\bQ(\d+)\b/g, '<a href="#question-$1" class="question-link" title="Jump to Question $1">Q$1</a>');
            analysisContainer.innerHTML = linkedHTML;
            
            // Initialize floating return arrow functionality
            this.initializeReturnArrow();
            
            // Note: Print button stays disabled until streaming completes
        }
    }
    
    // Enable print button when streaming is completely finished
    static enablePrintButton() {
        const printBtn = document.getElementById('print-btn');
        if (printBtn) {
            printBtn.disabled = false;
            printBtn.innerHTML = '<span data-translate="print_report">Print Report</span>';
            
            // Re-apply translations to the newly added content
            if (typeof applyTranslations === 'function' && window.currentTranslations) {
                applyTranslations(window.currentTranslations);
            } else {
                // Fallback: manually translate the print button
                const printSpan = printBtn.querySelector('[data-translate="print_report"]');
                if (printSpan && window.currentTranslations && window.currentTranslations.print_report) {
                    printSpan.textContent = window.currentTranslations.print_report;
                }
            }
        }
    }
    
    // Initialize floating return arrow functionality
    static initializeReturnArrow() {
        // Create return arrow if it doesn't exist
        if (!document.getElementById('return-arrow')) {
            this.createReturnArrow();
        }
        
        // Add click event listeners to all question links
        document.querySelectorAll('.question-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Store the position of the analysis section for returning
                const analysisContainer = document.getElementById('analysis-container');
                if (analysisContainer) {
                    sessionStorage.setItem('returnToAnalysis', analysisContainer.offsetTop.toString());
                }
                
                // Show the return arrow after a short delay (to let the scroll happen)
                setTimeout(() => {
                    this.showReturnArrow();
                }, 500);
            });
        });
        
        // Add scroll listener to auto-hide arrow when near analysis
        this.addScrollListener();
    }
    
    // Add scroll listener to automatically hide arrow when near analysis
    static addScrollListener() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            // Debounce the scroll event
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const analysisContainer = document.getElementById('analysis-container');
                const arrow = document.getElementById('return-arrow');
                
                if (analysisContainer && arrow && arrow.classList.contains('show')) {
                    const analysisTop = analysisContainer.offsetTop;
                    const currentScroll = window.pageYOffset;
                    const windowHeight = window.innerHeight;
                    
                    // Hide arrow if we're close to or above the analysis section
                    if (currentScroll < analysisTop + windowHeight / 2) {
                        this.hideReturnArrow();
                    }
                }
            }, 100);
        });
    }
    
    // Create the floating return arrow element
    static createReturnArrow() {
        const arrow = document.createElement('button');
        arrow.id = 'return-arrow';
        arrow.className = 'return-arrow';
        arrow.innerHTML = '⬆';
        arrow.title = 'Return to Analysis';
        arrow.setAttribute('aria-label', 'Return to Analysis');
        
        // Add click handler to return to analysis
        arrow.addEventListener('click', () => {
            this.returnToAnalysis();
        });
        
        document.body.appendChild(arrow);
    }
    
    // Show the return arrow
    static showReturnArrow() {
        const arrow = document.getElementById('return-arrow');
        if (arrow) {
            arrow.classList.add('show');
        }
    }
    
    // Hide the return arrow
    static hideReturnArrow() {
        const arrow = document.getElementById('return-arrow');
        if (arrow) {
            arrow.classList.remove('show');
        }
    }
    
    // Return to the analysis section
    static returnToAnalysis() {
        const savedPosition = sessionStorage.getItem('returnToAnalysis');
        const analysisContainer = document.getElementById('analysis-container');
        
        if (savedPosition && analysisContainer) {
            // Scroll to the saved position
            window.scrollTo({
                top: parseInt(savedPosition, 10) - 20, // Offset a bit for better visibility
                behavior: 'smooth'
            });
        } else if (analysisContainer) {
            // Fallback: scroll to analysis container
            analysisContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
        
        // Hide the arrow after returning
        setTimeout(() => {
            this.hideReturnArrow();
        }, 500);
    }
}

// Make ReportTemplate available globally in the report window
window.ReportTemplate = ReportTemplate;

// Translation functionality
async function loadTranslations(language = 'en') {
    try {
        const response = await fetch(`${language}.json`);
        if (!response.ok) throw new Error(`Failed to load ${language}.json`);
        const data = await response.json();
        return data.report || {};
    } catch (error) {
        console.warn(`Failed to load translations for ${language}:`, error);
        if (language !== 'en') {
            return await loadTranslations('en');
        }
        return {};
    }
}

function applyTranslations(translations) {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[key]) {
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = translations[key];
            } else {
                element.innerHTML = translations[key];
            }
        }
    });
    
    // Update CSS variables for print headers
    if (translations.header_report_title) {
        document.documentElement.style.setProperty('--report-title', `"${translations.header_report_title}"`);
    }
    if (translations.footer_generated_by) {
        document.documentElement.style.setProperty('--generated-by', `"${translations.footer_generated_by}"`);
    }
}

// Initialize translations when page loads
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const language = urlParams.get('lang') || 'en';
    
    const translations = await loadTranslations(language);
    window.currentTranslations = translations; // Store globally for later use
    applyTranslations(translations);
    
    // Note: initializeParticipantInfo() will be called from initializeReport()
    // after assessment data is available
});

// Update participant information dynamically
function initializeParticipantInfo() {
    // Get participant info from the assessment data if available
    const participantInfo = window.assessmentData?.participantInfo;
    console.log('Initializing participant info:', participantInfo);
    
    const name = participantInfo?.name || '[Name to be filled]';
    const age = participantInfo?.age || '[Age]';
    
    console.log('Setting participant info - Name:', name, 'Age:', age);
    
    // Update CSS custom property for print header
    document.documentElement.style.setProperty('--participant-header', `"${name} - ${age} years"`);
    
    // Update front page elements
    document.querySelectorAll('.participant-name').forEach(el => el.textContent = name);
    document.querySelectorAll('.participant-age').forEach(el => el.textContent = age + ' years');
}

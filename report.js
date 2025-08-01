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
            { key: 'sensory', label: 'sensory' },
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
                    <div class="chart-label">${this.getTranslatedText(domain.key === 'total' ? 'ui.results.totalScore' : `ui.results.categories.${domain.key}`, domain.label)}</div>
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

    // Generate radar chart HTML
    static generateRadarChart(assessmentData) {
        const scores = assessmentData.scores;
        
        // Define domains for radar chart (excluding total)
        const domains = [
            { key: 'social', label: 'Social Interactions', score: scores.social, max: 117, threshold: 31, average: 11 },
            { key: 'language', label: 'Communication', score: scores.language, max: 21, threshold: 4, average: 2 },
            { key: 'sensory', label: 'Sensory/Motor', score: scores.sensory, max: 60, threshold: 16, average: 6 },
            { key: 'restricted', label: 'Restricted Interests', score: scores.restricted, max: 42, threshold: 15, average: 8 }
        ];

        const centerX = 200;
        const centerY = 200;
        const maxRadius = 140;
        const numDomains = domains.length;

        // Calculate points for each circle (score, threshold, average)
        const getRadarPoints = (values) => {
            return values.map((value, index) => {
                const angle = (index / numDomains) * 2 * Math.PI - Math.PI / 2; // Start from top
                const x = centerX + Math.cos(angle) * value;
                const y = centerY + Math.sin(angle) * value;
                return `${x},${y}`;
            }).join(' ');
        };

        // Calculate radius for each domain based on percentage of max
        const scoreRadii = domains.map(d => (d.score / d.max) * maxRadius);
        const thresholdRadii = domains.map(d => (d.threshold / d.max) * maxRadius);
        const averageRadii = domains.map(d => (d.average / d.max) * maxRadius);

        // Generate background grid circles with better spacing
        const gridCircles = [0.25, 0.5, 0.75, 1.0].map(ratio => 
            `<circle cx="${centerX}" cy="${centerY}" r="${maxRadius * ratio}" fill="none" stroke="#e8e8e8" stroke-width="1"/>`
        ).join('');

        // Generate axis lines and labels
        let axisLines = '';
        let axisLabels = '';
        
        domains.forEach((domain, index) => {
            const angle = (index / numDomains) * 2 * Math.PI - Math.PI / 2;
            const endX = centerX + Math.cos(angle) * maxRadius;
            const endY = centerY + Math.sin(angle) * maxRadius;
            
            // Axis line
            axisLines += `<line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#d0d0d0" stroke-width="1"/>`;
            
            // Label positioning - closer to the chart
            const labelRadius = maxRadius + 20;
            const labelX = centerX + Math.cos(angle) * labelRadius;
            const labelY = centerY + Math.sin(angle) * labelRadius;
            
            // Adjust text anchor based on position
            let textAnchor = 'middle';
            let dominantBaseline = 'middle';
            
            if (labelX > centerX + 10) {
                textAnchor = 'start';
            } else if (labelX < centerX - 10) {
                textAnchor = 'end';
            }
            
            if (labelY < centerY - 10) {
                dominantBaseline = 'baseline';
            } else if (labelY > centerY + 10) {
                dominantBaseline = 'hanging';
            }
            
            // Get translated text and create wrapped label
            const translatedLabel = this.getTranslatedText(`ui.results.categories.${domain.key}`, domain.label);
            const wrappedLabel = this.createWrappedLabel(translatedLabel, labelX, labelY, textAnchor, dominantBaseline);
            
            axisLabels += wrappedLabel;
        });

        // Generate percentage labels for grid circles
        const gridLabels = [25, 50, 75, 100].map(percent => 
            `<text x="${centerX + 6}" y="${centerY - (maxRadius * percent / 100) + 3}" class="grid-label" font-size="10" fill="#999">${percent}%</text>`
        ).join('');

        return `
            <div class="radar-chart-wrapper">
                <div class="radar-chart-main">
                    <svg width="500" height="400" viewBox="0 0 400 400" class="radar-chart">
                        <!-- Background grid -->
                        ${gridCircles}
                        ${gridLabels}
                        
                        <!-- Axis lines -->
                        ${axisLines}
                        
                        <!-- Threshold polygon (autistic threshold) -->
                        <polygon points="${getRadarPoints(thresholdRadii)}" 
                                 fill="rgba(231, 76, 60, 0.15)" 
                                 stroke="#e74c3c" 
                                 stroke-width="2" 
                                 stroke-dasharray="8,4"
                                 class="threshold-polygon"/>
                        
                        <!-- Average polygon (neurotypical average) -->
                        <polygon points="${getRadarPoints(averageRadii)}" 
                                 fill="rgba(39, 174, 96, 0.15)" 
                                 stroke="#27ae60" 
                                 stroke-width="2" 
                                 stroke-dasharray="6,3"
                                 class="average-polygon"/>
                        
                        <!-- Score polygon (your score) -->
                        <polygon points="${getRadarPoints(scoreRadii)}" 
                                 fill="rgba(52, 152, 219, 0.25)" 
                                 stroke="#3498db" 
                                 stroke-width="3"
                                 class="score-polygon"/>
                        
                        <!-- Score points with better styling -->
                        ${domains.map((domain, index) => {
                            const angle = (index / numDomains) * 2 * Math.PI - Math.PI / 2;
                            const radius = scoreRadii[index];
                            const x = centerX + Math.cos(angle) * radius;
                            const y = centerY + Math.sin(angle) * radius;
                            return `<circle cx="${x}" cy="${y}" r="4" fill="#3498db" stroke="#fff" stroke-width="2" class="score-point">
                                        <title>${domain.label}: ${domain.score}/${domain.max} (${(domain.score/domain.max*100).toFixed(1)}%)</title>
                                    </circle>`;
                        }).join('')}
                        
                        <!-- Axis labels -->
                        ${axisLabels}
                    </svg>
                </div>
                
                <!-- Score values display on the right side -->
                <div class="radar-scores-sidebar">
                    <div class="radar-scores-title">${this.getTranslatedText('report.domain_scores', 'Domain Scores')}</div>
                    ${domains.map(domain => {
                        const translatedLabel = this.getTranslatedText(`ui.results.categories.${domain.key}`, domain.label);
                        return `
                        <div class="radar-score-item-sidebar">
                            <div class="radar-score-label-sidebar">${translatedLabel}</div>
                            <div class="radar-score-details">
                                <div class="radar-score-value-sidebar">${domain.score}/${domain.max}</div>
                                <div class="radar-score-percent-sidebar">${(domain.score/domain.max*100).toFixed(1)}%</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Helper function to get translated text
    static getTranslatedText(translationKey, fallbackText) {
        const translations = window.currentTranslations || {};
        
        // Support nested keys like "ui.results.categories.social"
        let value = translations;
        const keyParts = translationKey.split('.');
        
        for (const part of keyParts) {
            if (value && typeof value === 'object' && value.hasOwnProperty(part)) {
                value = value[part];
            } else {
                value = null;
                break;
            }
        }
        
        return value || fallbackText;
    }

    // Helper function to create wrapped SVG text labels
    static createWrappedLabel(text, x, y, textAnchor, dominantBaseline) {
        // Split text on spaces and common separators
        const words = text.split(/[\s\/\-]+/).filter(word => word.length > 0);
        
        // If only one word or short text, don't wrap
        if (words.length <= 1 || text.length <= 12) {
            return `<text x="${x}" y="${y}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}" class="radar-label">${text}</text>`;
        }
        
        // Create wrapped text with tspan elements
        const lineHeight = 1.2; // em
        const fontSize = 12; // approximate font size in px for calculation
        const lines = [];
        
        // Simple word wrapping - aim for 2 lines max
        if (words.length === 2) {
            lines.push(words[0]);
            lines.push(words[1]);
        } else if (words.length === 3) {
            // Try to balance the lines
            const firstLineLength = words[0].length + words[1].length;
            const secondLineLength = words[2].length;
            
            if (firstLineLength <= secondLineLength + 3) {
                lines.push(words[0] + ' ' + words[1]);
                lines.push(words[2]);
            } else {
                lines.push(words[0]);
                lines.push(words[1] + ' ' + words[2]);
            }
        } else {
            // For 4+ words, split roughly in half
            const midPoint = Math.ceil(words.length / 2);
            lines.push(words.slice(0, midPoint).join(' '));
            lines.push(words.slice(midPoint).join(' '));
        }
        
        // Adjust y position for multi-line text
        const totalHeight = (lines.length - 1) * lineHeight * fontSize;
        let startY = y;
        
        if (dominantBaseline === 'middle') {
            startY = y - totalHeight / 2;
        } else if (dominantBaseline === 'baseline') {
            startY = y - totalHeight;
        }
        
        // Generate the SVG text element with tspan for each line
        let svgText = `<text x="${x}" y="${startY}" text-anchor="${textAnchor}" dominant-baseline="hanging" class="radar-label">`;
        
        lines.forEach((line, index) => {
            const dy = index === 0 ? '0' : `${lineHeight}em`;
            svgText += `<tspan x="${x}" dy="${dy}">${line}</tspan>`;
        });
        
        svgText += '</text>';
        
        return svgText;
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
    static getInterpretation(score) {
        const translations = window.currentTranslations || {};
        // If no language data available, use English fallbacks
        const interpretations = translations?.ui?.results?.interpretations || {
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
        const interpretation = this.getInterpretation(totalScore);
        
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

        // Generate and insert chart (default to bar chart)
        const chartHTML = this.generateChart(assessmentData);
        document.getElementById('chart-container').innerHTML = chartHTML;
        
        // Initialize chart toggle functionality
        this.initializeChartToggle(assessmentData);

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
            // Get the current language from URL params or default to 'en'
            const urlParams = new URLSearchParams(window.location.search);
            const language = urlParams.get('lang') || 'en';
            
            // Convert Q references to links (both simple Q40 and language-specific patterns)
            const linkedHTML = this.processQuestionLinks(analysisHTML, language);
            analysisContainer.innerHTML = linkedHTML;
            
            // Initialize floating return arrow functionality
            this.initializeReturnArrow();
            
            // Note: Print button stays disabled until streaming completes
        }
    }

    // Process question links for a specific language
    static processQuestionLinks(result, language = 'en') {
        // Apply language-specific patterns
        switch (language) {
            case 'fr':
                // French: "questions 40, 41 et 63" or "question 40"
                result = result.replace(/\b(questions?)\s+(\d+(?:\s*,\s*\d+)*(?:\s+et\s+\d+)?)\b/gi, 
                    (match, questionWord, numbers) => {
                        return this.createQuestionLinks(match, questionWord, numbers, /\d+/g);
                    });
                break;
                
            case 'en':
                // English: "questions 40, 41 and 63" or "question 40"
                result = result.replace(/\b(questions?)\s+(\d+(?:\s*,\s*\d+)*(?:\s+and\s+\d+)?)\b/gi,
                    (match, questionWord, numbers) => {
                        return this.createQuestionLinks(match, questionWord, numbers, /\d+/g);
                    });
                break;
                
            case 'es':
                // Spanish: "preguntas 40, 41 y 63" or "pregunta 40"
                result = result.replace(/\b(preguntas?)\s+(\d+(?:\s*,\s*\d+)*(?:\s+y\s+\d+)?)\b/gi,
                    (match, questionWord, numbers) => {
                        return this.createQuestionLinks(match, questionWord, numbers, /\d+/g);
                    });
                break;
                
            case 'it':
                // Italian: "domande 40, 41 e 63" or "domanda 40"
                result = result.replace(/\b(domande?)\s+(\d+(?:\s*,\s*\d+)*(?:\s+e\s+\d+)?)\b/gi,
                    (match, questionWord, numbers) => {
                        return this.createQuestionLinks(match, questionWord, numbers, /\d+/g);
                    });
                break;
                
            case 'de':
                // German: "Fragen 40, 41 und 63" or "Frage 40"
                result = result.replace(/\b(Fragen?)\s+(\d+(?:\s*,\s*\d+)*(?:\s+und\s+\d+)?)\b/gi,
                    (match, questionWord, numbers) => {
                        return this.createQuestionLinks(match, questionWord, numbers, /\d+/g);
                    });
                break;
        }

        // Finally handle simple Q40 format (universal)
        result = result.replace(/\bQ(\d+)\b/g, '<a href="#question-$1" class="question-link" title="Jump to Question $1">Q$1</a>');

        return result;
    }

    // Helper function to create question links from a matched pattern
    static createQuestionLinks(fullMatch, questionWord, numbersPart, numberRegex) {
        // Extract all question numbers
        const numbers = numbersPart.match(numberRegex);
        if (!numbers) return fullMatch;

        // Create links for each number while preserving the original text structure
        let linkedText = fullMatch;
        
        // Replace each number with a linked version
        numbers.forEach(num => {
            const numRegex = new RegExp(`\\b${num}\\b`, 'g');
            linkedText = linkedText.replace(numRegex, `<a href="#question-${num}" class="question-link" title="Jump to Question ${num}">${num}</a>`);
        });

        return linkedText;
    }
    
    // Enable print button when streaming is completely finished
    static enablePrintButton() {
        const printBtn = document.getElementById('print-btn');
        if (printBtn) {
            printBtn.disabled = false;
            printBtn.innerHTML = '<span data-translate="report.print_report">Print Report</span>';
            
            // Re-apply translations to the newly added content
            if (typeof applyTranslations === 'function' && window.currentTranslations) {
                applyTranslations(window.currentTranslations);
            } else {
                // Fallback: manually translate the print button
                const printSpan = printBtn.querySelector('[data-translate="report.print_report"]');
                if (printSpan && window.currentTranslations && window.currentTranslations.report && window.currentTranslations.report.print_report) {
                    printSpan.textContent = window.currentTranslations.report.print_report;
                }
            }
        }
    }

    // Initialize chart toggle functionality
    static initializeChartToggle(assessmentData) {
        const toggleButtons = document.querySelectorAll('.chart-toggle-btn');
        const chartContainer = document.getElementById('chart-container');
        
        if (!toggleButtons.length || !chartContainer) {
            return;
        }

        let currentChartType = 'bar'; // Default to bar chart

        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const chartType = button.getAttribute('data-chart');
                
                if (chartType === currentChartType) {
                    return; // Already showing this chart type
                }

                // Update button states
                toggleButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Generate and display the appropriate chart
                let chartHTML;
                if (chartType === 'radar') {
                    chartHTML = this.generateRadarChart(assessmentData);
                } else {
                    chartHTML = this.generateChart(assessmentData);
                }

                chartContainer.innerHTML = chartHTML;
                currentChartType = chartType;

                // Update legend visibility
                this.updateLegendVisibility(chartType);

                // Apply translations to any new elements
                if (typeof applyTranslations === 'function' && window.currentTranslations) {
                    applyTranslations(window.currentTranslations);
                }
            });
        });
    }

    // Update legend visibility based on chart type
    static updateLegendVisibility(chartType) {
        const barLegendItems = document.querySelectorAll('.bar-chart-legend');
        const radarLegendItems = document.querySelectorAll('.radar-chart-legend');

        if (chartType === 'radar') {
            barLegendItems.forEach(item => item.style.display = 'none');
            radarLegendItems.forEach(item => item.style.display = 'flex');
        } else {
            barLegendItems.forEach(item => item.style.display = 'flex');
            radarLegendItems.forEach(item => item.style.display = 'none');
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
        return data || {};
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
        
        // Support nested keys like "ui.results.categories.social"
        let value = translations;
        const keyParts = key.split('.');
        
        for (const part of keyParts) {
            if (value && typeof value === 'object' && value.hasOwnProperty(part)) {
                value = value[part];
            } else {
                value = null;
                break;
            }
        }
        
        if (value) {
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = value;
            } else {
                element.innerHTML = value;
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

// Direct streaming function for report.html
async function startDirectStreaming(assessmentData, reportId) {
    // Get API base URL (same logic as in index.html)
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080'
        : 'https://raads-pdf-service-3n4fdvjefq-oa.a.run.app';
    
    try {
        console.log('Starting direct streaming to:', `${API_BASE}/analyze-stream`);
        
        const response = await fetch(`${API_BASE}/analyze-stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assessmentData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalAnalysisHTML = '';
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            buffer += chunk;
            
            // Process complete events in the buffer
            const events = buffer.split('\n\n');
            buffer = events.pop() || ''; // Keep incomplete event in buffer
            
            for (const event of events) {
                if (!event.trim()) continue;
                
                console.log('Processing event:', event);
                
                // Parse SSE format: "event: chunk\ndata: {...}"
                const lines = event.split('\n');
                let eventType = '';
                let eventData = '';
                
                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        eventType = line.slice(6).trim();
                    } else if (line.startsWith('data:')) {
                        eventData = line.slice(5).trim();
                    }
                }
                
                if (eventType === 'chunk' && eventData) {
                    try {
                        const parsed = JSON.parse(eventData);
                        
                        if (parsed.html) {
                            finalAnalysisHTML = parsed.html;
                            console.log('Direct streaming chunk - HTML length:', parsed.html.length);
                            
                            // Update the UI immediately
                            ReportTemplate.updateAnalysis(parsed.html);
                            
                            // Update localStorage for consistency
                            const reportData = localStorage.getItem(`raads-report-${reportId}`);
                            if (reportData) {
                                const report = JSON.parse(reportData);
                                report.analysisHTML = parsed.html;
                                localStorage.setItem(`raads-report-${reportId}`, JSON.stringify(report));
                            }
                        }
                    } catch (parseError) {
                        console.warn('Failed to parse event data:', parseError, 'Data:', eventData);
                    }
                } else if (eventType === 'complete' || eventData === '[DONE]') {
                    console.log('✅ Direct streaming completed - Final content length:', finalAnalysisHTML ? finalAnalysisHTML.length : 'null');
                    
                    // Mark streaming as complete in localStorage
                    const reportData = localStorage.getItem(`raads-report-${reportId}`);
                    if (reportData) {
                        const report = JSON.parse(reportData);
                        report.analysisHTML = finalAnalysisHTML;
                        report.isStreaming = false;
                        localStorage.setItem(`raads-report-${reportId}`, JSON.stringify(report));
                    }
                    
                    // Enable print button
                    ReportTemplate.enablePrintButton();
                    break;
                } else if (eventType === 'error') {
                    try {
                        const errorData = JSON.parse(eventData);
                        throw new Error(errorData.error || 'Streaming error');
                    } catch (parseError) {
                        throw new Error('Unknown streaming error');
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Direct streaming error:', error);
        throw error; // Re-throw to trigger fallback to polling
    }
}
// Report template and generation functions for client-side report creation
// This file contains the HTML template extracted from the backend and client-side generation logic

class ReportTemplate {
    // Language-specific strings for report generation
    static getLanguageStrings(language) {
        const strings = {
            'fr': {
                "lang": "fr",
                "title": "Rapport d'évaluation RAADS-R",
                "print_report": "🖨️ Imprimer le rapport",
                "close_report": "❌ Fermer le rapport",
                "assessment_report": "RAPPORT D'ÉVALUATION",
                "scale_subtitle": "Échelle diagnostique d'Asperger et d'autisme de Ritvo - Révisée",
                "participant": "Participant :",
                "age": "Âge :",
                "name_placeholder": "[Nom à remplir]",
                "age_placeholder": "[Âge]",
                "age_suffix": " ans",
                "assessment_summary": "Résumé de l'évaluation",
                "total_score": "Score total :",
                "assessment_date": "Date d'évaluation :",
                "footer_disclaimer": "Ce rapport a été généré en utilisant l'outil d'évaluation RAADS-R<br><em>Ceci n'est pas un diagnostic clinique et ne doit pas remplacer une évaluation professionnelle</em>",
                "instructions_title": "📝 Instructions",
                "before_printing": "Avant d'imprimer :",
                "fill_info": "Veuillez remplir vos informations personnelles ci-dessous. Ces informations apparaîtront dans le rapport imprimé mais <em>ne seront pas sauvegardées</em>.",
                "enter_name": "Entrez votre nom (ou identifiant préféré)",
                "specify_age": "Spécifiez votre âge au moment de l'évaluation",
                "click_print": "Une fois rempli, cliquez sur le bouton Imprimer ci-dessus pour générer votre PDF",
                "participant_info": "Informations du participant",
                "name_label": "Nom :",
                "age_label": "Âge :",
                "name_input_placeholder": "Entrez le nom du participant",
                "age_input_placeholder": "Entrez l'âge",
                "assessment_results": "Résultats de l'évaluation",
                "score_distribution": "Répartition des scores par domaine",
                "social": "Social",
                "language": "Langage",
                "sensory_motor": "Sensoriel/Moteur",
                "restricted": "Restreint",
                "total": "Total",
                "your_score": "Votre score",
                "autistic_threshold": "Seuil autistique",
                "neurotypical_average": "Moyenne neurotypique",
                "maximum_possible": "Maximum possible",
                "appendix_title": "Annexe : Questions et réponses",
                "appendix_description": "Réponses complètes de l'évaluation avec les commentaires du participant lorsqu'ils sont fournis.",
                "generated_on": "Généré le",
                "by": "par",
                "report_id": "ID du rapport :",
                "header_report_title": "Rapport d'évaluation RAADS-R",
                "footer_generated_by": "Généré par raphink.github.io/raads-r",
                "header_participant": "[Nom à remplir] - [Âge] ans"
            },
            'es': {
                "lang": "es",
                "title": "Informe de Evaluación RAADS-R",
                "print_report": "🖨️ Imprimir Informe",
                "close_report": "❌ Cerrar Informe",
                "assessment_report": "INFORME DE EVALUACIÓN",
                "scale_subtitle": "Escala Diagnóstica de Autismo y Asperger de Ritvo - Revisada",
                "participant": "Participante:",
                "age": "Edad:",
                "name_placeholder": "[Nombre a completar]",
                "age_placeholder": "[Edad]",
                "age_suffix": " años",
                "assessment_summary": "Resumen de la Evaluación",
                "total_score": "Puntuación Total:",
                "assessment_date": "Fecha de Evaluación:",
                "footer_disclaimer": "Este informe fue generado usando la herramienta de evaluación RAADS-R<br><em>Esto no es un diagnóstico clínico y no debe reemplazar una evaluación profesional</em>",
                "instructions_title": "📝 Instrucciones",
                "before_printing": "Antes de imprimir:",
                "fill_info": "Por favor, complete su información personal a continuación. Esta información aparecerá en el informe impreso pero <em>no será guardada</em>.",
                "enter_name": "Ingrese su nombre (o identificador preferido)",
                "specify_age": "Especifique su edad al momento de la evaluación",
                "click_print": "Una vez completado, haga clic en el botón Imprimir arriba para generar su PDF",
                "participant_info": "Información del Participante",
                "name_label": "Nombre:",
                "age_label": "Edad:",
                "name_input_placeholder": "Ingrese el nombre del participante",
                "age_input_placeholder": "Ingrese la edad",
                "assessment_results": "Resultados de la Evaluación",
                "score_distribution": "Distribución de Puntuaciones por Dominio",
                "social": "Social",
                "language": "Lenguaje",
                "sensory_motor": "Sensorial/Motor",
                "restricted": "Restringido",
                "total": "Total",
                "your_score": "Su Puntuación",
                "autistic_threshold": "Umbral Autista",
                "neurotypical_average": "Promedio Neurotípico",
                "maximum_possible": "Máximo Posible",
                "appendix_title": "Apéndice: Preguntas y Respuestas",
                "appendix_description": "Respuestas completas de la evaluación con comentarios del participante cuando se proporcionan.",
                "generated_on": "Generado el",
                "by": "por",
                "report_id": "ID del Informe:",
                "header_report_title": "Informe de Evaluación RAADS-R",
                "footer_generated_by": "Generado por raphink.github.io/raads-r",
                "header_participant": "[Nombre a completar] - [Edad] años"
            },
            'it': {
                "lang": "it",
                "title": "Rapporto di Valutazione RAADS-R",
                "print_report": "🖨️ Stampa Rapporto",
                "close_report": "❌ Chiudi Rapporto",
                "assessment_report": "RAPPORTO DI VALUTAZIONE",
                "scale_subtitle": "Scala Diagnostica dell'Autismo e Asperger di Ritvo - Rivista",
                "participant": "Partecipante:",
                "age": "Età:",
                "name_placeholder": "[Nome da compilare]",
                "age_placeholder": "[Età]",
                "age_suffix": " anni",
                "assessment_summary": "Riassunto della Valutazione",
                "total_score": "Punteggio Totale:",
                "assessment_date": "Data di Valutazione:",
                "footer_disclaimer": "Questo rapporto è stato generato utilizzando lo strumento di valutazione RAADS-R<br><em>Questa non è una diagnosi clinica e non deve sostituire una valutazione professionale</em>",
                "instructions_title": "📝 Istruzioni",
                "before_printing": "Prima di stampare:",
                "fill_info": "Si prega di compilare le informazioni personali di seguito. Queste informazioni appariranno nel rapporto stampato ma <em>non saranno salvate</em>.",
                "enter_name": "Inserisci il tuo nome (o identificatore preferito)",
                "specify_age": "Specifica la tua età al momento della valutazione",
                "click_print": "Una volta completato, clicca sul pulsante Stampa sopra per generare il tuo PDF",
                "participant_info": "Informazioni del Partecipante",
                "name_label": "Nome:",
                "age_label": "Età:",
                "name_input_placeholder": "Inserisci il nome del partecipante",
                "age_input_placeholder": "Inserisci l'età",
                "assessment_results": "Risultati della Valutazione",
                "score_distribution": "Distribuzione dei Punteggi per Dominio",
                "social": "Sociale",
                "language": "Linguaggio",
                "sensory_motor": "Sensoriale/Motorio",
                "restricted": "Ristretto",
                "total": "Totale",
                "your_score": "Il Tuo Punteggio",
                "autistic_threshold": "Soglia Autistica",
                "neurotypical_average": "Media Neurotipica",
                "maximum_possible": "Massimo Possibile",
                "appendix_title": "Appendice: Domande e Risposte",
                "appendix_description": "Risposte complete della valutazione con commenti del partecipante quando forniti.",
                "generated_on": "Generato il",
                "by": "da",
                "report_id": "ID Rapporto:",
                "header_report_title": "Rapporto di Valutazione RAADS-R",
                "footer_generated_by": "Generato da raphink.github.io/raads-r",
                "header_participant": "[Nome da compilare] - [Età] anni"
            },
            'de': {
                "lang": "de",
                "title": "RAADS-R Bewertungsbericht",
                "print_report": "🖨️ Bericht drucken",
                "close_report": "❌ Bericht schließen",
                "assessment_report": "BEWERTUNGSBERICHT",
                "scale_subtitle": "Ritvo Autismus Asperger Diagnostik-Skala - Überarbeitet",
                "participant": "Teilnehmer:",
                "age": "Alter:",
                "name_placeholder": "[Name auszufüllen]",
                "age_placeholder": "[Alter]",
                "age_suffix": " Jahre",
                "assessment_summary": "Bewertungszusammenfassung",
                "total_score": "Gesamtpunktzahl:",
                "assessment_date": "Bewertungsdatum:",
                "footer_disclaimer": "Dieser Bericht wurde mit dem RAADS-R Bewertungstool generiert<br><em>Dies ist keine klinische Diagnose und sollte keine professionelle Bewertung ersetzen</em>",
                "instructions_title": "📝 Anweisungen",
                "before_printing": "Vor dem Drucken:",
                "fill_info": "Bitte füllen Sie Ihre persönlichen Informationen unten aus. Diese Informationen erscheinen im gedruckten Bericht, werden aber <em>nicht gespeichert</em>.",
                "enter_name": "Geben Sie Ihren Namen ein (oder bevorzugten Bezeichner)",
                "specify_age": "Geben Sie Ihr Alter zum Zeitpunkt der Bewertung an",
                "click_print": "Nach dem Ausfüllen klicken Sie auf den Drucken-Button oben, um Ihr PDF zu generieren",
                "participant_info": "Teilnehmerinformationen",
                "name_label": "Name:",
                "age_label": "Alter:",
                "name_input_placeholder": "Teilnehmername eingeben",
                "age_input_placeholder": "Alter eingeben",
                "assessment_results": "Bewertungsergebnisse",
                "score_distribution": "Punkteverteilung nach Bereich",
                "social": "Sozial",
                "language": "Sprache",
                "sensory_motor": "Sensorisch/Motorisch",
                "restricted": "Eingeschränkt",
                "total": "Gesamt",
                "your_score": "Ihre Punktzahl",
                "autistic_threshold": "Autistische Schwelle",
                "neurotypical_average": "Neurotypischer Durchschnitt",
                "maximum_possible": "Maximal möglich",
                "appendix_title": "Anhang: Fragen und Antworten",
                "appendix_description": "Vollständige Bewertungsantworten mit Teilnehmerkommentaren, wo angegeben.",
                "generated_on": "Generiert am",
                "by": "von",
                "report_id": "Bericht-ID:",
                "header_report_title": "RAADS-R Bewertungsbericht",
                "footer_generated_by": "Generiert von raphink.github.io/raads-r",
                "header_participant": "[Name auszufüllen] - [Alter] Jahre"
            },
            'en': {
                "lang": "en",
                "title": "RAADS-R Assessment Report",
                "print_report": "🖨️ Print Report",
                "close_report": "❌ Close Report",
                "assessment_report": "ASSESSMENT REPORT",
                "scale_subtitle": "Ritvo Autism Asperger Diagnostic Scale - Revised",
                "participant": "Participant:",
                "age": "Age:",
                "name_placeholder": "[Name to be filled]",
                "age_placeholder": "[Age]",
                "age_suffix": " years",
                "assessment_summary": "Assessment Summary",
                "total_score": "Total Score:",
                "assessment_date": "Assessment Date:",
                "footer_disclaimer": "This report was generated using the RAADS-R assessment tool<br><em>This is not a clinical diagnosis and should not replace professional evaluation</em>",
                "instructions_title": "📝 Instructions",
                "before_printing": "Before printing:",
                "fill_info": "Please fill in your personal information below. This information will appear in the printed report but <em>will not be saved</em>.",
                "enter_name": "Enter your name (or preferred identifier)",
                "specify_age": "Specify your age at the time of assessment",
                "click_print": "Once filled, click the Print button above to generate your PDF",
                "participant_info": "Participant Information",
                "name_label": "Name:",
                "age_label": "Age:",
                "name_input_placeholder": "Enter participant name",
                "age_input_placeholder": "Enter age",
                "assessment_results": "Assessment Results",
                "score_distribution": "Score Distribution by Domain",
                "social": "Social",
                "language": "Language",
                "sensory_motor": "Sensory/Motor",
                "restricted": "Restricted",
                "total": "Total",
                "your_score": "Your Score",
                "autistic_threshold": "Autistic Threshold",
                "neurotypical_average": "Neurotypical Average",
                "maximum_possible": "Maximum Possible",
                "appendix_title": "Appendix: Questions and Answers",
                "appendix_description": "Complete assessment responses with participant comments where provided.",
                "generated_on": "Generated on",
                "by": "by",
                "report_id": "Report ID:",
                "header_report_title": "RAADS-R Assessment Report",
                "footer_generated_by": "Generated by raphink.github.io/raads-r",
                "header_participant": "[Name to be filled] - [Age] years"
            }
        };

        return strings[language] || strings['en']; // Default to English
    }

    // Generate the complete HTML template
    static getHTMLTemplate(language) {
        const langStrings = this.getLanguageStrings(language);

        let template = `<!DOCTYPE html>
<html lang="{{LANG}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
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
                    content: "{{HEADER_REPORT_TITLE}}";
                    font-size: 12pt;
                    font-weight: bold;
                    color: #2c3e50;
                    border-bottom: 2px solid #3498db;
                }
                @top-center {
                    content: var(--participant-header, "{{HEADER_PARTICIPANT}}");
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
                    content: "{{FOOTER_GENERATED_BY}}";
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
            
            /* Chart styling for print */
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
            
            .chart-container-inner {
                border: 2px solid #000 !important;
                background: #e8e8e8 !important;
            }
            
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
            background: #e8e8e8;
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
        
        .close-btn {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0 20px 10px;
        }
        
        .close-btn:hover {
            background: #c0392b;
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
    </style>
    <script>
        // Update participant information dynamically
        function updateParticipantInfo() {
            const name = document.getElementById('participant-name').value || '{{NAME_PLACEHOLDER}}';
            const age = document.getElementById('participant-age').value || '{{AGE_PLACEHOLDER}}';
            
            // Update CSS custom property for print header
            document.documentElement.style.setProperty('--participant-header', '"' + name + ' - ' + age + '{{AGE_SUFFIX}}"');
            
            // Update front page using CSS classes
            const participantName = document.querySelector('.participant-name');
            const participantAge = document.querySelector('.participant-age');
            
            if (participantName) participantName.textContent = name;
            if (participantAge) participantAge.textContent = age + '{{AGE_SUFFIX}}';
        }
        
        // Add event listeners when page loads
        document.addEventListener('DOMContentLoaded', function() {
            const nameInput = document.getElementById('participant-name');
            const ageInput = document.getElementById('participant-age');
            
            if (nameInput && ageInput) {
                nameInput.addEventListener('input', updateParticipantInfo);
                ageInput.addEventListener('input', updateParticipantInfo);
                
                // Initial update
                updateParticipantInfo();
            }
        });
    </script>
</head>
<body>
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">{{PRINT_REPORT}}</button>
        <button class="close-btn" onclick="window.close()">{{CLOSE_REPORT}}</button>
    </div>
    
    <!-- Title Page -->
    <div class="title-page">
        <h1>{{ASSESSMENT_REPORT}}</h1>
        <div class="subtitle">{{SCALE_SUBTITLE}}</div>
        
        <div class="participant-details">
            <div style="margin-bottom: 15px;"><strong>{{PARTICIPANT}}</strong> <span class="participant-name">{{NAME_PLACEHOLDER}}</span></div>
            <div style="margin-bottom: 15px;"><strong>{{AGE}}</strong> <span class="participant-age">{{AGE_PLACEHOLDER}}{{AGE_SUFFIX}}</span></div>
        </div>
        
        <div class="assessment-info">
            <div style="font-size: 16pt; margin-bottom: 20px; font-weight: bold;">{{ASSESSMENT_SUMMARY}}</div>
            <div style="font-size: 14pt; margin-bottom: 10px;">{{TOTAL_SCORE}} <span style="font-weight: bold; font-size: 18pt;">{{TOTAL_SCORE_VALUE}}/240</span></div>
            <div style="font-size: 14pt;">{{ASSESSMENT_DATE}} <span style="font-weight: bold;">{{ASSESSMENT_DATE_VALUE}}</span></div>
        </div>
        <div class="footer-info">
            {{FOOTER_DISCLAIMER}}
        </div>
    </div>

    <div class="no-print" style="background: #e8f4f8; border: 1px solid #3498db; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2c3e50;">{{INSTRUCTIONS_TITLE}}</h3>
        <p style="margin: 10px 0; color: #2c3e50;">
            <strong>{{BEFORE_PRINTING}}</strong> {{FILL_INFO}}
        </p>
        <ul style="margin: 10px 0; color: #2c3e50;">
            <li>{{ENTER_NAME}}</li>
            <li>{{SPECIFY_AGE}}</li>
            <li>{{CLICK_PRINT}}</li>
        </ul>
    </div>

    <div class="participant-info no-print">
        <h3 style="margin-top: 0; color: #2c3e50;">{{PARTICIPANT_INFO}}</h3>
        <div class="participant-field">
            <label for="participant-name">{{NAME_LABEL}}</label>
            <input type="text" id="participant-name" placeholder="{{NAME_INPUT_PLACEHOLDER}}" />
        </div>
        <div class="participant-field">
            <label for="participant-age">{{AGE_LABEL}}</label>
            <input type="number" id="participant-age" placeholder="{{AGE_INPUT_PLACEHOLDER}}" min="18" max="100" />
        </div>
    </div>

    <h1 style="margin-top: 40px;">{{ASSESSMENT_RESULTS}}</h1>

    <h2>{{SCORE_DISTRIBUTION}}</h2>
    <div class="chart-container">
        <div class="chart-wrapper">
            <div class="chart-item">
                <div class="chart-label">{{SOCIAL}}</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{SOCIAL_MAX}}</div>
                    <div class="score-bar" style="height: {{SOCIAL_BAR_HEIGHT}}%;">{{JS_SOCIAL_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{SOCIAL_THRESHOLD_HEIGHT}}%;" data-label="31"></div>
                    <div class="average-marker" style="bottom: {{SOCIAL_AVERAGE_HEIGHT}}%;" data-label="11"></div>
                </div>
            </div>
            <div class="chart-item">
                <div class="chart-label">{{LANGUAGE}}</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{LANGUAGE_MAX}}</div>
                    <div class="score-bar" style="height: {{LANGUAGE_BAR_HEIGHT}}%;">{{JS_LANGUAGE_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{LANGUAGE_THRESHOLD_HEIGHT}}%;" data-label="4"></div>
                    <div class="average-marker" style="bottom: {{LANGUAGE_AVERAGE_HEIGHT}}%;" data-label="2"></div>
                </div>
            </div>
            <div class="chart-item">
                <div class="chart-label">{{SENSORY_MOTOR}}</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{SENSORY_MAX}}</div>
                    <div class="score-bar" style="height: {{SENSORY_BAR_HEIGHT}}%;">{{JS_SENSORY_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{SENSORY_THRESHOLD_HEIGHT}}%;" data-label="16"></div>
                    <div class="average-marker" style="bottom: {{SENSORY_AVERAGE_HEIGHT}}%;" data-label="6"></div>
                </div>
            </div>
            <div class="chart-item">
                <div class="chart-label">{{RESTRICTED}}</div>
                <div class="chart-container-inner">
                    <div class="max-score-label">{{RESTRICTED_MAX}}</div>
                    <div class="score-bar" style="height: {{RESTRICTED_BAR_HEIGHT}}%;">{{JS_RESTRICTED_SCORE}}</div>
                    <div class="threshold-marker" style="bottom: {{RESTRICTED_THRESHOLD_HEIGHT}}%;" data-label="24"></div>
                    <div class="average-marker" style="bottom: {{RESTRICTED_AVERAGE_HEIGHT}}%;" data-label="8"></div>
                </div>
            </div>
            <div class="chart-item">
                <div class="chart-label">{{TOTAL}}</div>
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
                <span>{{YOUR_SCORE}}</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #e74c3c;"></div>
                <span>{{AUTISTIC_THRESHOLD}}</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #27ae60;"></div>
                <span>{{NEUROTYPICAL_AVERAGE}}</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #e8e8e8;"></div>
                <span>{{MAXIMUM_POSSIBLE}}</span>
            </div>
        </div>
    </div>
    
    {{MARKDOWN_CONTENT}}

    <div class="page-break"></div>
    <div class="appendix-container">
        <h2>{{APPENDIX_TITLE}}</h2>
        <p style="color: #666; margin-bottom: 20px;">{{APPENDIX_DESCRIPTION}}</p>
        {{LIST_OF_QUESTIONS}}
    </div>

    <div class="footer">
        <p>{{GENERATED_ON}} {{GENERATED_AT}} {{BY}} raphink.github.io/raads-r</p>
        <p>{{REPORT_ID}} {{REPORT_ID_VALUE}}</p>
    </div>
</body>
</html>`;

        // Replace language placeholders with actual strings
        for (const [key, value] of Object.entries(langStrings)) {
            const placeholder = "{{" + key.toUpperCase() + "}}";
            template = template.replaceAll(placeholder, value);
        }

        return template;
    }

    // Generate questions HTML for appendix
    static generateQuestionsHTML(questionsAndAnswers, language) {
        // Answer text mappings for different languages
        const answerTexts = {
            'en': {
                0: "Never true",
                1: "Sometimes true", 
                2: "Often true",
                3: "Always true"
            },
            'fr': {
                0: "Jamais vrai",
                1: "Parfois vrai",
                2: "Souvent vrai", 
                3: "Toujours vrai"
            },
            'es': {
                0: "Nunca verdadero",
                1: "A veces verdadero",
                2: "A menudo verdadero",
                3: "Siempre verdadero"
            },
            'it': {
                0: "Mai vero",
                1: "A volte vero",
                2: "Spesso vero",
                3: "Sempre vero"
            },
            'de': {
                0: "Nie wahr",
                1: "Manchmal wahr",
                2: "Oft wahr",
                3: "Immer wahr"
            }
        };

        const answers = answerTexts[language] || answerTexts['en'];
        let html = '';

        for (const qa of questionsAndAnswers) {
            const categoryClass = this.getCategoryClass(qa.category);
            const answerText = answers[qa.answer] || `Answer ${qa.answer}`;
            
            html += `
                <div class="question-item">
                    <div class="question-header">
                        <div class="question-number">${qa.id}</div>
                        <div class="question-category ${categoryClass}">${qa.category}</div>
                        <div class="score-badge">${qa.score} pts</div>
                    </div>
                    <div class="question-text">${qa.text}</div>
                    <div class="answer-section">
                        <div class="answer-text">${answerText}</div>
                        ${qa.comment ? `<div class="comment-text">"${qa.comment}"</div>` : ''}
                    </div>
                </div>
            `;
        }

        return html;
    }

    // Get CSS class for question category
    static getCategoryClass(category) {
        switch (category.toLowerCase()) {
            case 'social': return 'social';
            case 'language': return 'language'; 
            case 'sensory': return 'sensory';
            case 'restricted': return 'restricted';
            default: return '';
        }
    }

    // Generate complete HTML report
    static generateReport(assessmentData, analysisHTML, reportId) {
        const template = this.getHTMLTemplate(assessmentData.language);
        const totalScore = assessmentData.scores.total;

        // Maximum scores for each domain
        const socialMax = 117;    // 39 questions × 3 points
        const languageMax = 21;   // 7 questions × 3 points  
        const sensoryMax = 42;    // 14 questions × 3 points
        const restrictedMax = 60; // 20 questions × 3 points
        const totalMax = 240;     // Total maximum

        // Calculate bar heights as percentages
        const socialBarHeight = (assessmentData.scores.social / socialMax * 100).toFixed(1);
        const languageBarHeight = (assessmentData.scores.language / languageMax * 100).toFixed(1);
        const sensoryBarHeight = (assessmentData.scores.sensory / sensoryMax * 100).toFixed(1);
        const restrictedBarHeight = (assessmentData.scores.restricted / restrictedMax * 100).toFixed(1);
        const totalBarHeight = (totalScore / totalMax * 100).toFixed(1);

        // Calculate threshold and average heights as percentages
        const socialThresholdHeight = (31 / socialMax * 100).toFixed(1);
        const languageThresholdHeight = (4 / languageMax * 100).toFixed(1);
        const sensoryThresholdHeight = (16 / sensoryMax * 100).toFixed(1);
        const restrictedThresholdHeight = (24 / restrictedMax * 100).toFixed(1);
        const totalThresholdHeight = (65 / totalMax * 100).toFixed(1);

        const socialAverageHeight = (11 / socialMax * 100).toFixed(1);
        const languageAverageHeight = (2 / languageMax * 100).toFixed(1);
        const sensoryAverageHeight = (6 / sensoryMax * 100).toFixed(1);
        const restrictedAverageHeight = (8 / restrictedMax * 100).toFixed(1);
        const totalAverageHeight = (25 / totalMax * 100).toFixed(1);

        // Generate questions HTML
        const questionsHTML = this.generateQuestionsHTML(assessmentData.questionsAndAnswers, assessmentData.language);

        // Replace all placeholders
        let html = template
            // Scores
            .replaceAll("{{TOTAL_SCORE}}", totalScore.toString())
            .replaceAll("{{JS_TOTAL_SCORE}}", totalScore.toString())
            .replaceAll("{{JS_SOCIAL_SCORE}}", assessmentData.scores.social.toString())
            .replaceAll("{{JS_LANGUAGE_SCORE}}", assessmentData.scores.language.toString())
            .replaceAll("{{JS_SENSORY_SCORE}}", assessmentData.scores.sensory.toString())
            .replaceAll("{{JS_RESTRICTED_SCORE}}", assessmentData.scores.restricted.toString())
            
            // Max scores
            .replaceAll("{{SOCIAL_MAX}}", socialMax.toString())
            .replaceAll("{{LANGUAGE_MAX}}", languageMax.toString())
            .replaceAll("{{SENSORY_MAX}}", sensoryMax.toString())
            .replaceAll("{{RESTRICTED_MAX}}", restrictedMax.toString())
            .replaceAll("{{TOTAL_MAX}}", totalMax.toString())
            
            // Bar heights
            .replaceAll("{{SOCIAL_BAR_HEIGHT}}", socialBarHeight)
            .replaceAll("{{LANGUAGE_BAR_HEIGHT}}", languageBarHeight)
            .replaceAll("{{SENSORY_BAR_HEIGHT}}", sensoryBarHeight)
            .replaceAll("{{RESTRICTED_BAR_HEIGHT}}", restrictedBarHeight)
            .replaceAll("{{TOTAL_BAR_HEIGHT}}", totalBarHeight)
            
            // Threshold heights
            .replaceAll("{{SOCIAL_THRESHOLD_HEIGHT}}", socialThresholdHeight)
            .replaceAll("{{LANGUAGE_THRESHOLD_HEIGHT}}", languageThresholdHeight)
            .replaceAll("{{SENSORY_THRESHOLD_HEIGHT}}", sensoryThresholdHeight)
            .replaceAll("{{RESTRICTED_THRESHOLD_HEIGHT}}", restrictedThresholdHeight)
            .replaceAll("{{TOTAL_THRESHOLD_HEIGHT}}", totalThresholdHeight)
            
            // Average heights
            .replaceAll("{{SOCIAL_AVERAGE_HEIGHT}}", socialAverageHeight)
            .replaceAll("{{LANGUAGE_AVERAGE_HEIGHT}}", languageAverageHeight)
            .replaceAll("{{SENSORY_AVERAGE_HEIGHT}}", sensoryAverageHeight)
            .replaceAll("{{RESTRICTED_AVERAGE_HEIGHT}}", restrictedAverageHeight)
            .replaceAll("{{TOTAL_AVERAGE_HEIGHT}}", totalAverageHeight)
            
            // Content
            .replaceAll("{{MARKDOWN_CONTENT}}", `<div class="markdown-content">${analysisHTML}</div>`)
            .replaceAll("{{LIST_OF_QUESTIONS}}", questionsHTML)
            
            // Metadata
            .replaceAll("{{TOTAL_SCORE_VALUE}}", totalScore.toString())
            .replaceAll("{{ASSESSMENT_DATE_VALUE}}", new Date(assessmentData.metadata.testDate).toLocaleDateString())
            .replaceAll("{{REPORT_ID_VALUE}}", reportId)
            .replaceAll("{{ASSESSMENT_DATE}}", new Date(assessmentData.metadata.testDate).toLocaleDateString())
            .replaceAll("{{GENERATED_AT}}", new Date().toLocaleDateString())
            .replaceAll("{{REPORT_ID}}", reportId);

        return html;
    }
}

// Export for use in main application
window.ReportTemplate = ReportTemplate;

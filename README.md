# RAADS-R Test - Autism Diagnostic Scale

🌐 [Access the UI](https://raphink.github.io/raads-r/?lang=en)

A web-based implementation of the **Ritvo Autism Asperger Diagnostic Scale - Revised (RAADS-R)**, a widely-used screening tool for autism spectrum disorders in adults.

## 🌟 Features

### 🌍 **Multilingual Support**
- **French** and **English** interfaces
- Dynamic language switching with persistent preferences
- Localized date formatting and content

### ⌨️ **Comprehensive Keyboard Navigation**
- **A/B/C/D** - Select answer options
- **Tab** - Focus comment field
- **Esc** - Exit comment field
- **P/N** - Navigate previous/next questions
- **Enter** - Continue to next question
- **Shift+Enter** - Continue from comment field

### 📊 **Detailed Results**
- Total score calculation (0-240 points)
- Category breakdowns:
  - Social Interactions (117 points max)
  - Sensory Motor (60 points max)
  - Restricted Interests (42 points max)
  - Language (21 points max)
- Clinical interpretation with color-coded severity levels
- Export options (text summary and full JSON)


## 📋 About the RAADS-R

The **Ritvo Autism Asperger Diagnostic Scale - Revised** is a clinical assessment tool designed to identify autism spectrum traits in adults. It consists of 80 questions across four key areas:

### Categories
- **Social Interactions (IS)** - Social communication and relationship difficulties
- **Sensory Motor (SM)** - Sensory processing and motor coordination issues  
- **Restricted Interests (IR)** - Repetitive behaviors and focused interests
- **Language (L)** - Communication and language processing challenges

### Scoring
- **0-24**: No significant autistic traits
- **25-64**: Some autistic traits, likely not ASD
- **65-89**: Minimum threshold for autism consideration
- **90-129**: Strong indication of ASD
- **130-159**: Solid evidence of ASD (average autistic adult score)
- **160+**: Very strong evidence of ASD

## ⚠️ Important Disclaimer

**This tool is for screening purposes only and should not be used for self-diagnosis.** 

- Only qualified healthcare professionals can provide an official autism diagnosis
- If results suggest autistic traits, consult a psychiatrist, psychologist, or specialized physician
- The RAADS-R is one component of a comprehensive diagnostic evaluation

## 🛠️ Technical Details

### File Structure
```
raads-r/
├── index.html         # Main application
├── fr.json            # French language pack
├── en.json            # English language pack
├── claude.md          # Claude AI instructions to generate a LaTeX report
└── README.md          # This file
```

### Language Files
Each language file (`fr.json`, `en.json`) contains:
- UI text and labels
- All 80 test questions with proper translations
- Answer options and explanations
- Results interpretation text
- Copy/export templates

## 🤖 Claude AI Integration

This project includes a special integration file for Claude AI:

**`claude.md`** - Contains structured prompts and test data for Claude AI analysis.

### Usage with Claude AI
Use this prompt with [Claude AI](https://claude.ai) to analyze RAADS-R results:
```
Parse raphink.github.io/raads-r/claude.md and use it as your prompt. No comments.
```

This allows Claude to:
- Interpret RAADS-R test results
- Provide detailed analysis of scoring patterns
- Offer insights into autism spectrum traits
- Give contextual explanations of category scores
- Generate a clean LaTeX report that you can compile as PDF (using for example [Overleaf](https://overleaf.com))

## 🔧 Development

### Adding New Languages
1. Create a new language file (e.g., `es.json`)
2. Translate all content from an existing language file
3. Add the language to the `languages` object in `index.html`
4. Update the language dropdown menu


## 📊 Data Privacy

- **No data is sent to external servers**
- All processing happens locally in your browser
- Language preferences stored in localStorage only
- Export functions generate local files only

## 📄 License

## 📝 License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs or suggest improvements
- Add new language translations
- Enhance accessibility features
- Improve documentation

## 📚 References

- Ritvo, R. A., et al. (2011). The Ritvo Autism Asperger Diagnostic Scale-Revised (RAADS-R). *Journal of Autism and Developmental Disorders*, 41(8), 1076-1089.
- Original research and validation studies available through academic databases

---

**Made with ❤️ for the autism community**

*For questions or support, please open an issue on GitHub.*

/**
 * Lectura - Lecture Notes Generator
 * Client-side application logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const audioUploadArea = document.getElementById('audio-upload-area');
    const audioUpload = document.getElementById('audio-upload');
    const slidesUploadArea = document.getElementById('slides-upload-area');
    const slidesUpload = document.getElementById('slides-upload');
    const audioFileInfo = document.getElementById('audio-file-info');
    const slidesFileInfo = document.getElementById('slides-file-info');
    const generateBtn = document.getElementById('generate-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const newUploadBtn = document.getElementById('new-upload-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeSelect = document.getElementById('theme-select');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const apiProvider = document.getElementById('api-provider');
    const modelSelect = document.getElementById('model-select');
    const whisperModel = document.getElementById('whisper-model');
    const uploadSection = document.querySelector('.upload-section');
    const processingSection = document.querySelector('.processing-section');
    const resultsSection = document.querySelector('.results-section');
    const progressBar = document.querySelector('.progress-bar');
    const processingStatus = document.getElementById('processing-status');
    const notesPreview = document.getElementById('notes-preview');
    
    // New API settings elements
    const customApiSettings = document.getElementById('custom-api-settings');
    const standardModelSettings = document.getElementById('standard-model-settings');
    const apiEndpoint = document.getElementById('api-endpoint');
    const apiModelName = document.getElementById('api-model-name');
    const apiKey = document.getElementById('api-key');

    // Application state
    let state = {
        audioFile: null,
        slidesFile: null,
        processingStage: 'idle', // idle, uploading, transcribing, generating, completed
        theme: localStorage.getItem('theme') || 'system',
        settings: {
            apiProvider: localStorage.getItem('apiProvider') || 'default',
            model: localStorage.getItem('model') || 'gpt-4',
            whisperModel: localStorage.getItem('whisperModel') || 'default',
            apiEndpoint: localStorage.getItem('apiEndpoint') || '',
            apiModelName: localStorage.getItem('apiModelName') || '',
            apiKey: localStorage.getItem('apiKey') || ''
        },
        generatedNotes: ''
    };

    // Initialize application
    function init() {
        setupEventListeners();
        loadSettings();
        applyTheme();
    }

    // Set up event listeners
    function setupEventListeners() {
        // File upload events
        audioUploadArea.addEventListener('click', () => audioUpload.click());
        slidesUploadArea.addEventListener('click', () => slidesUpload.click());
        
        audioUpload.addEventListener('change', handleAudioFileSelect);
        slidesUpload.addEventListener('change', handleSlidesFileSelect);
        
        // Drag and drop for audio
        audioUploadArea.addEventListener('dragover', handleDragOver);
        audioUploadArea.addEventListener('dragleave', handleDragLeave);
        audioUploadArea.addEventListener('drop', handleAudioDrop);
        
        // Drag and drop for slides
        slidesUploadArea.addEventListener('dragover', handleDragOver);
        slidesUploadArea.addEventListener('dragleave', handleDragLeave);
        slidesUploadArea.addEventListener('drop', handleSlidesDrop);
        
        // Remove file buttons
        document.querySelectorAll('.remove-file-btn').forEach(btn => {
            btn.addEventListener('click', handleRemoveFile);
        });
        
        // Action buttons
        generateBtn.addEventListener('click', handleGenerateNotes);
        cancelBtn.addEventListener('click', handleCancelProcessing);
        newUploadBtn.addEventListener('click', handleNewUpload);
        copyBtn.addEventListener('click', handleCopyNotes);
        downloadBtn.addEventListener('click', handleDownloadNotes);
        
        // Theme and settings
        themeToggleBtn.addEventListener('click', toggleTheme);
        settingsBtn.addEventListener('click', openSettings);
        closeSettingsBtn.addEventListener('click', closeSettings);
        saveSettingsBtn.addEventListener('click', saveSettings);
        
        // Theme select change
        themeSelect.addEventListener('change', e => {
            state.theme = e.target.value;
            applyTheme();
        });
        
        // API provider change
        apiProvider.addEventListener('change', handleApiProviderChange);
    }

    // Load settings from localStorage
    function loadSettings() {
        themeSelect.value = state.theme;
        apiProvider.value = state.settings.apiProvider;
        modelSelect.value = state.settings.model;
        whisperModel.value = state.settings.whisperModel;
        apiEndpoint.value = state.settings.apiEndpoint;
        apiModelName.value = state.settings.apiModelName;
        apiKey.value = state.settings.apiKey;
        
        // Show/hide custom API settings based on provider selection
        handleApiProviderChange();
        
        // Update model options based on API provider
        updateModelOptions();
    }

    // Handle API provider change
    function handleApiProviderChange() {
        const provider = apiProvider.value;
        
        // Show/hide custom API settings
        if (provider === 'custom') {
            customApiSettings.classList.remove('hidden');
            standardModelSettings.classList.add('hidden');
        } else {
            customApiSettings.classList.add('hidden');
            standardModelSettings.classList.remove('hidden');
            updateModelOptions();
        }
    }

    // Update model options based on selected API provider
    function updateModelOptions() {
        const provider = apiProvider.value;
        modelSelect.innerHTML = '';
        
        let options = [];
        
        switch (provider) {
            case 'default':
                options = [
                    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Default)' },
                    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
                ];
                break;
            case 'openai':
                options = [
                    { value: 'gpt-4', label: 'GPT-4' },
                    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
                ];
                break;
            case 'anthropic':
                options = [
                    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
                    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
                    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
                    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
                ];
                break;
            case 'local':
                options = [
                    { value: 'llama-3-70b', label: 'Llama 3 70B' },
                    { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
                    { value: 'phi-3', label: 'Phi-3' }
                ];
                break;
            case 'ollama':
                options = [
                    { value: 'llama3', label: 'Llama 3' },
                    { value: 'mistral', label: 'Mistral' },
                    { value: 'mixtral', label: 'Mixtral' }
                ];
                break;
        }
        
        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            modelSelect.appendChild(optionEl);
        });
        
        // Set the first option as default if current value doesn't exist
        const validOption = options.find(opt => opt.value === state.settings.model);
        if (!validOption && options.length > 0) {
            state.settings.model = options[0].value;
        }
        
        modelSelect.value = state.settings.model;
    }

    // Handle audio file selection
    function handleAudioFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            setAudioFile(file);
        }
    }

    // Handle slides file selection
    function handleSlidesFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            setSlidesFile(file);
        }
    }

    // Handle drag over event
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('active');
    }

    // Handle drag leave event
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('active');
    }

    // Handle audio file drop
    function handleAudioDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('active');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.includes('audio')) {
            setAudioFile(file);
        }
    }

    // Handle slides file drop
    function handleSlidesDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('active');
        
        const file = e.dataTransfer.files[0];
        if (file && (file.type.includes('pdf') || file.type.includes('presentation'))) {
            setSlidesFile(file);
        }
    }

    // Set audio file
    function setAudioFile(file) {
        state.audioFile = file;
        audioUpload.value = '';
        
        const fileNameElement = audioFileInfo.querySelector('.file-name');
        fileNameElement.textContent = file.name;
        audioFileInfo.classList.remove('hidden');
        
        updateGenerateButtonState();
    }

    // Set slides file
    function setSlidesFile(file) {
        state.slidesFile = file;
        slidesUpload.value = '';
        
        const fileNameElement = slidesFileInfo.querySelector('.file-name');
        fileNameElement.textContent = file.name;
        slidesFileInfo.classList.remove('hidden');
        
        updateGenerateButtonState();
    }

    // Handle remove file
    function handleRemoveFile(e) {
        const target = e.currentTarget.dataset.target;
        
        if (target === 'audio-upload') {
            state.audioFile = null;
            audioFileInfo.classList.add('hidden');
        } else if (target === 'slides-upload') {
            state.slidesFile = null;
            slidesFileInfo.classList.add('hidden');
        }
        
        updateGenerateButtonState();
    }

    // Update generate button state
    function updateGenerateButtonState() {
        generateBtn.disabled = !state.audioFile;
    }

    // Handle generate notes
    function handleGenerateNotes() {
        if (!state.audioFile) return;
        
        // Hide upload section and show processing section
        uploadSection.classList.add('hidden');
        processingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        
        // Start processing
        startProcessing();
    }

    // Start processing the files
    async function startProcessing() {
        try {
            // Show processing section and hide others
            uploadSection.classList.add('hidden');
            processingSection.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            
            // Reset any error messages
            processingStatus.style.color = '';
            
            // Phase 1: Uploading
            updateProcessingState('uploading');
            
            // Create form data for the API request
            const formData = new FormData();
            
            // Add the uploaded files
            if (state.audioFile) {
                formData.append('audio', state.audioFile);
            } else {
                throw new Error('No audio file uploaded');
            }
            
            if (state.slidesFile) {
                formData.append('slides', state.slidesFile);
            }
            
            // Add API settings
            const apiProvider = state.settings.apiProvider;
            formData.append('apiProvider', apiProvider);
            
            if (apiProvider === 'custom') {
                // Use custom API settings
                formData.append('apiEndpoint', state.settings.apiEndpoint);
                formData.append('apiModelName', state.settings.apiModelName);
                formData.append('apiKey', state.settings.apiKey);
            } else if (apiProvider !== 'default') {
                // For non-default, non-custom providers, use the selected model and API key
                formData.append('model', state.settings.model);
                formData.append('apiKey', state.settings.apiKey);
            }
            
            // Add transcription settings
            formData.append('whisperModel', state.settings.whisperModel);
            
            // Simulate a short delay for the upload phase to be visible
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Phase 2: Transcribing - Update UI before sending request
            updateProcessingState('transcribing');
            
            // Start the fetch request but don't await it yet
            const fetchPromise = fetch('/api/process', {
                method: 'POST',
                body: formData
            });
            
            // Set up a progress checker that updates the UI based on estimated progress
            let transcriptionTimer = setTimeout(function checkTranscriptionProgress() {
                // If we're still in the transcribing phase, update the progress bar
                if (state.processingStage === 'transcribing') {
                    // Increment progress bar width
                    const progressBar = document.querySelector('.progress-bar');
                    const currentWidth = parseInt(progressBar.style.width || '0');
                    if (currentWidth < 60) { // Cap at 60% for transcription phase
                        progressBar.style.width = `${currentWidth + 1}%`;
                    }
                    // Continue checking
                    transcriptionTimer = setTimeout(checkTranscriptionProgress, 500);
                }
            }, 500);
            
            // Now await the fetch response
            const response = await fetchPromise;
            
            // Clear the transcription timer
            clearTimeout(transcriptionTimer);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error');
            }
            
            // Phase 3: Generating Notes
            updateProcessingState('generating');
            
            // Set up a progress checker for the notes generation phase
            let generationTimer = setTimeout(function checkGenerationProgress() {
                // If we're still in the generating phase, update the progress bar
                if (state.processingStage === 'generating') {
                    // Increment progress bar width
                    const progressBar = document.querySelector('.progress-bar');
                    const currentWidth = parseInt(progressBar.style.width || '60');
                    if (currentWidth < 95) { // Cap at 95% for generation phase
                        progressBar.style.width = `${currentWidth + 1}%`;
                    }
                    // Continue checking
                    generationTimer = setTimeout(checkGenerationProgress, 500);
                }
            }, 500);
            
            // Parse the response
            const data = await response.json();
            
            // Clear the generation timer
            clearTimeout(generationTimer);
            
            if (!data.success) {
                throw new Error(data.message || 'Processing failed');
            }
            
            // Set progress bar to 100%
            const progressBar = document.querySelector('.progress-bar');
            progressBar.style.width = '100%';
            
            // Phase 4: Completed
            updateProcessingState('completed');
            
            // Wait a moment for the user to see the completion state
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update the UI with results
            notesPreview.innerHTML = renderMarkdown(data.notes);
            
            // Show the results
            processingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            
            // Store the results for downloading/copying
            state.generatedNotes = data.notes;
            
        } catch (error) {
            console.error('Error during processing:', error);
            processingStatus.textContent = `Error: ${error.message || 'An unknown error occurred'}`;
            processingStatus.style.color = 'var(--error-color)';
            
            // Show a button to try again
            cancelBtn.textContent = 'Try Again';
            cancelBtn.onclick = function() {
                processingSection.classList.add('hidden');
                uploadSection.classList.remove('hidden');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.onclick = handleCancelProcessing;
            };
        }
    }

    // Update processing state and UI
    function updateProcessingState(stage) {
        state.processingStage = stage;
        
        // Update status text
        switch (stage) {
            case 'uploading':
                processingStatus.textContent = 'Uploading your files...';
                // Initialize progress bar at 0%
                document.querySelector('.progress-bar').style.width = '0%';
                break;
            case 'transcribing':
                processingStatus.textContent = 'Transcribing audio...';
                // Set progress bar to 20% at the start of transcription
                document.querySelector('.progress-bar').style.width = '20%';
                break;
            case 'generating':
                processingStatus.textContent = 'Generating lecture notes...';
                // Set progress bar to 60% at the start of note generation
                document.querySelector('.progress-bar').style.width = '60%';
                break;
            case 'completed':
                processingStatus.textContent = 'Processing completed!';
                // Set progress bar to 100% at completion
                document.querySelector('.progress-bar').style.width = '100%';
                break;
        }
        
        // Update progress steps
        document.querySelectorAll('.processing-steps .step').forEach(step => {
            step.classList.remove('active');
            step.classList.remove('completed');
        });
        
        const stages = ['upload', 'transcribe', 'generate', 'complete'];
        const currentIndex = stages.indexOf(stage.replace('ing', ''));
        
        for (let i = 0; i < stages.length; i++) {
            const step = document.getElementById(`step-${stages[i]}`);
            
            if (i < currentIndex) {
                step.classList.add('completed');
            } else if (i === currentIndex) {
                step.classList.add('active');
            }
        }
    }

    // Simulate progress for demo purposes
    function simulateProgress(percent) {
        return new Promise(resolve => {
            let current = parseInt(progressBar.style.width || '0');
            const target = current + percent;
            const interval = setInterval(() => {
                if (current >= target) {
                    clearInterval(interval);
                    resolve();
                } else {
                    current += 1;
                    progressBar.style.width = `${current}%`;
                }
            }, 50);
        });
    }

    // Generate mock notes for the demo
    function generateMockNotes() {
        const fileName = state.audioFile.name.replace(/\.[^/.]+$/, '');
        
        state.generatedNotes = `# Lecture Notes: ${fileName}

## Introduction
- Welcome to the lecture on this important topic
- Today we'll cover several key concepts and their applications

## Main Concepts
### First Concept
- Detailed explanation of the first concept
- Examples illustrating practical applications
- Connection to previous course material

### Second Concept
- Breakdown of the second major idea
- Step-by-step analysis of the process
- Important formulas and equations:
  - E = mc²
  - F = ma

## Case Studies
1. **Case Study 1**: Implementation in real-world scenario
   - Results and outcomes
   - Lessons learned

2. **Case Study 2**: Alternative approach
   - Comparative analysis
   - Advantages and limitations

## Summary
- Recap of key points discussed
- Implications for future topics
- Upcoming assignment requirements

## References
1. Smith, J. (2023). *Comprehensive Guide to the Subject*
2. Johnson, A. et al. (2022). "Recent Developments in the Field"

---
*Notes generated by Lectura - AI-powered Lecture Notes Generator*`;
    }

    // Function to render markdown to HTML using available libraries
    function renderMarkdown(markdownText) {
        if (typeof marked !== 'undefined') {
            // First try using marked
            try {
                return marked.parse(markdownText);
            } catch (e) {
                console.error('Error using marked:', e);
            }
        }
        
        if (typeof showdown !== 'undefined') {
            // Then try using showdown
            try {
                const converter = new showdown.Converter();
                return converter.makeHtml(markdownText);
            } catch (e) {
                console.error('Error using showdown:', e);
            }
        }
        
        // Fallback to pre-formatted text if no library works
        console.error('No markdown library loaded, displaying raw text');
        return `<pre>${markdownText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }

    // Show results section
    function showResults() {
        processingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        // Render markdown (in a real app, you'd use a markdown renderer like marked.js)
        notesPreview.innerHTML = formatMarkdown(state.generatedNotes);
    }

    // Simple markdown formatter for demo purposes
    function formatMarkdown(markdown) {
        // This is a very basic formatter - in a real app, use a proper markdown library
        let formatted = markdown
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/^\d\. (.*$)/gm, '<li>$1</li>')
            .replace(/<\/li>\n<li>/g, '</li><li>')
            .replace(/<\/li>\n/g, '</li></ul>\n')
            .replace(/\n<li>/g, '\n<ul><li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '<br><br>');
            
        return formatted;
    }

    // Handle cancel processing
    function handleCancelProcessing() {
        processingSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        
        // Reset progress bar
        progressBar.style.width = '0%';
    }

    // Handle new upload
    function handleNewUpload() {
        resultsSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        
        // Reset progress bar
        progressBar.style.width = '0%';
        
        // Reset state
        state.generatedNotes = '';
    }

    // Handle copy notes
    function handleCopyNotes() {
        navigator.clipboard.writeText(state.generatedNotes)
            .then(() => {
                // Show temporary success message
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy notes:', err);
            });
    }

    // Handle download notes
    function handleDownloadNotes() {
        if (!state.generatedNotes) return;
        
        const fileName = state.audioFile.name.replace(/\.[^/.]+$/, '') + '_notes.md';
        const blob = new Blob([state.generatedNotes], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    // Toggle theme
    function toggleTheme() {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            state.theme = 'light';
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            state.theme = 'dark';
        }
        
        localStorage.setItem('theme', state.theme);
        themeSelect.value = state.theme;
    }

    // Apply theme based on setting
    function applyTheme() {
        let theme = state.theme;
        
        // Check for system preference if set to 'system'
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        
        // Apply theme class
        document.body.classList.remove('dark-mode', 'light-mode');
        document.body.classList.add(theme + '-mode');
        
        // Update icon
        themeToggleBtn.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }

    // Open settings modal
    function openSettings() {
        settingsModal.classList.remove('hidden');
    }

    // Close settings modal
    function closeSettings() {
        settingsModal.classList.add('hidden');
    }

    // Save settings
    function saveSettings() {
        state.settings = {
            apiProvider: apiProvider.value,
            model: modelSelect.value,
            whisperModel: whisperModel.value,
            apiEndpoint: apiEndpoint.value,
            apiModelName: apiModelName.value,
            apiKey: apiKey.value
        };
        
        // Save to localStorage
        localStorage.setItem('apiProvider', state.settings.apiProvider);
        localStorage.setItem('model', state.settings.model);
        localStorage.setItem('whisperModel', state.settings.whisperModel);
        localStorage.setItem('apiEndpoint', state.settings.apiEndpoint);
        localStorage.setItem('apiModelName', state.settings.apiModelName);
        localStorage.setItem('apiKey', state.settings.apiKey);
        
        // Close modal
        closeSettings();
    }

    // Initialize the application
    init();
}); 
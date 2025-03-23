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
    const themeSelect = document.getElementById('theme-select');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const apiProvider = document.getElementById('api-provider');
    const modelSelect = document.getElementById('model-select');
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

    // New sidebar and notes elements
    const notesSidebar = document.querySelector('.notes-sidebar');
    const collapseSidebarBtn = document.getElementById('collapse-sidebar-btn');
    const expandSidebarBtn = document.getElementById('expand-sidebar-btn');
    const notesList = document.getElementById('notes-list');
    const currentNotesTitle = document.getElementById('current-notes-title');
    const regenerateNotesBtn = document.getElementById('regenerate-notes-btn');
    const resultsContent = document.querySelector('.results-content');

    // Application state
    let state = {
        audioFile: null,
        slidesFile: null,
        processingStage: 'idle', // idle, uploading, transcribing, generating, completed
        theme: localStorage.getItem('theme') || 'system',
        settings: {
            apiProvider: localStorage.getItem('apiProvider') || 'default',
            model: localStorage.getItem('model') || 'gemini-2.0-flash',
            whisperModel: 'default', // Always use default whisper model
            apiEndpoint: localStorage.getItem('apiEndpoint') || '',
            apiModelName: localStorage.getItem('apiModelName') || '',
            apiKey: localStorage.getItem('apiKey') || ''
        },
        currentNote: {
            id: null,
            title: 'Generated Notes',
            content: '',
            transcription: '',
            audioFile: null,
            date: null,
            audioId: null  // Add audioId to track the stored transcription
        },
        notes: [], // Array of saved notes
        sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true' || false
    };

    // Initialize application
    function init() {
        setupEventListeners();
        loadSettings();
        loadSavedNotes();
        applyTheme();
        updateSidebarState();
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
        settingsBtn.addEventListener('click', openSettings);
        closeSettingsBtn.addEventListener('click', closeSettings);
        saveSettingsBtn.addEventListener('click', saveSettings);
        themeSelect.addEventListener('change', () => {
            state.theme = themeSelect.value;
            localStorage.setItem('theme', state.theme);
            applyTheme();
        });
        
        // API provider change
        apiProvider.addEventListener('change', handleApiProviderChange);

        // Notes management buttons
        regenerateNotesBtn.addEventListener('click', handleRegenerateNotes);
        
        // Sidebar toggle
        collapseSidebarBtn.addEventListener('click', toggleSidebar);
        expandSidebarBtn.addEventListener('click', toggleSidebar);
    }

    // Load settings from localStorage
    function loadSettings() {
        themeSelect.value = state.theme;
        apiProvider.value = state.settings.apiProvider;
        
        // Only set model value if not using default provider
        if (state.settings.apiProvider !== 'default') {
            modelSelect.value = state.settings.model;
        }
        
        apiEndpoint.value = state.settings.apiEndpoint;
        apiModelName.value = state.settings.apiModelName;
        apiKey.value = state.settings.apiKey;
        
        // Show/hide custom API settings based on provider selection
        handleApiProviderChange();
        
        // Update model options based on API provider
        if (state.settings.apiProvider !== 'default') {
            updateModelOptions();
        }
    }

    // Load saved notes from localStorage
    function loadSavedNotes() {
        const savedNotes = localStorage.getItem('savedNotes');
        if (savedNotes) {
            state.notes = JSON.parse(savedNotes);
            updateNotesList();
        }
    }

    // Update sidebar state (collapsed or expanded)
    function updateSidebarState() {
        if (state.sidebarCollapsed) {
            notesSidebar.classList.add('collapsed');
            // Hide the entire sidebar
            notesSidebar.style.width = '0';
            notesSidebar.style.overflow = 'hidden';
            notesSidebar.style.marginLeft = '-10px'; // Push it slightly offscreen to hide the border
            
            // Show the expand button
            expandSidebarBtn.classList.remove('hidden');
        } else {
            notesSidebar.classList.remove('collapsed');
            notesSidebar.style.width = '280px';
            notesSidebar.style.overflow = '';
            notesSidebar.style.marginLeft = '0';
            
            // Hide the expand button
            expandSidebarBtn.classList.add('hidden');
        }
    }

    // Toggle sidebar collapse state
    function toggleSidebar() {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
        updateSidebarState();
    }

    // Update the notes list in the sidebar
    function updateNotesList() {
        // Clear existing list items except for the empty message
        const emptyMessage = notesList.querySelector('.empty-notes-message');
        notesList.innerHTML = '';
        
        if (state.notes.length === 0) {
            // Show empty message if no notes
            notesList.appendChild(emptyMessage || createEmptyNotesMessage());
            return;
        }
        
        // Sort notes by date (newest first)
        const sortedNotes = [...state.notes].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Add each note to the list
        sortedNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.dataset.id = note.id;
            
            if (state.currentNote.id === note.id) {
                noteItem.classList.add('active');
            }
            
            const title = document.createElement('div');
            title.className = 'note-title editable';
            title.textContent = note.title;
            title.title = 'Double-click to edit title';
            
            // Add event listener for double-click to edit
            title.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                makeNoteEditable(title, note);
            });
            
            const date = document.createElement('div');
            date.className = 'note-date';
            date.textContent = formatDate(new Date(note.date));
            
            const actions = document.createElement('div');
            actions.className = 'note-actions';
            
            const regenerateBtn = document.createElement('button');
            regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            regenerateBtn.title = 'Regenerate';
            regenerateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                regenerateNoteById(note.id);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(note.id);
            });
            
            actions.appendChild(regenerateBtn);
            actions.appendChild(deleteBtn);
            
            noteItem.appendChild(title);
            noteItem.appendChild(date);
            noteItem.appendChild(actions);
            
            // Add click event to load note
            noteItem.addEventListener('click', () => {
                loadNote(note.id);
            });
            
            notesList.appendChild(noteItem);
        });
    }

    // Create empty notes message
    function createEmptyNotesMessage() {
        const message = document.createElement('div');
        message.className = 'empty-notes-message';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-folder-open';
        
        const text = document.createElement('p');
        text.textContent = 'No saved notes yet';
        
        message.appendChild(icon);
        message.appendChild(text);
        
        return message;
    }

    // Format date for display
    function formatDate(date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }

    // Save current note
    function handleSaveNotes() {
        // Find the note we're currently viewing
        if (!state.currentNote || !state.currentNote.id) {
            console.log('No current note to save');
            return;
        }
        
        // Find the note in the array
        const noteIndex = state.notes.findIndex(note => note.id === state.currentNote.id);
        if (noteIndex === -1) {
            console.log('Note not found in saved notes');
            return;
        }
        
        // Update the note
        state.notes[noteIndex] = {
            ...state.notes[noteIndex],
            content: state.currentNote.content,
            date: new Date() // Update the date
        };
        
        // Save to localStorage
        localStorage.setItem('notes', JSON.stringify(state.notes));
        console.log('Notes saved:', state.notes);
        
        // Update the list of notes
        updateNotesList();
    }

    // Load a note from the saved notes
    function loadNote(noteId) {
        const note = state.notes.find(note => note.id === noteId);
        if (!note) return;
        
        // Update current note
        state.currentNote = { ...note };
        
        // Update UI
        currentNotesTitle.textContent = note.title;
        
        // Make sure the note content is properly displayed in the preview
        if (note.content) {
            // Use the appropriate markdown library
            if (typeof marked !== 'undefined') {
                notesPreview.innerHTML = marked.parse(note.content);
            } else if (typeof showdown !== 'undefined') {
                const converter = new showdown.Converter({
                    simpleLineBreaks: true,
                    strikethrough: true,
                    tables: true
                });
                notesPreview.innerHTML = converter.makeHtml(note.content);
            } else {
                notesPreview.innerHTML = formatMarkdown(note.content);
            }
        } else {
            notesPreview.innerHTML = '<p class="empty-content-message">This note has no content.</p>';
        }
        
        // Show results section and hide others
        uploadSection.classList.add('hidden');
        processingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        // Update active note in the list
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === noteId) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Handle regenerating notes for the current note
     */
    function handleRegenerateNotes() {
        if (!state.currentNote || !state.currentNote.id) {
            console.error('No current note to regenerate');
            return;
        }
        
        // Show processing section with regeneration status
        uploadSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        processingSection.classList.remove('hidden');
        
        updateProcessingState('generating');
        processingStatus.textContent = 'Regenerating notes...';
        
        regenerateNoteById(state.currentNote.id);
    }

    /**
     * Regenerate notes by note ID
     * 
     * @param {string} noteId - ID of the note to regenerate
     */
    async function regenerateNoteById(noteId) {
        try {
            // Find the note to regenerate
            const note = state.notes.find(n => n.id === noteId);
            if (!note) {
                throw new Error('Note not found');
            }
            
            // If we have an audioId, use the regenerate endpoint
            if (note.audioId) {
                console.log(`Regenerating notes using saved transcription with audioId: ${note.audioId}`);
                
                // Set up API parameters
                const params = {
                    audioId: note.audioId,
                    apiProvider: state.settings.apiProvider,
                    model: state.settings.model
                };
                
                // Add API key if available
                if (state.settings.apiKey) {
                    params.apiKey = state.settings.apiKey;
                }
                
                // Add custom endpoint and model name if using custom provider
                if (state.settings.apiProvider === 'custom') {
                    params.apiEndpoint = state.settings.apiEndpoint;
                    params.apiModelName = state.settings.apiModelName;
                }
                
                // Show simulated progress
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 5;
                    if (progress > 95) progress = 95;
                    simulateProgress(progress);
                }, 500);
                
                // Call the regenerate-notes endpoint
                const response = await fetch('/api/regenerate-notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                });
                
                clearInterval(progressInterval);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error regenerating notes');
                }
                
                const data = await response.json();
                simulateProgress(100);
                
                // Clean up the notes content by removing any auto-generated title
                let cleanedNotes = data.notes;
                
                // Clean up any blank lines at the beginning
                cleanedNotes = cleanedNotes.replace(/^\s+/, '');
                
                // Update the note with regenerated content
                note.content = cleanedNotes;
                note.date = new Date();
                note.timestamp = new Date().toISOString();
                
                // If the current note is the regenerated one, update it
                if (state.currentNote.id === noteId) {
                    state.currentNote = { ...note };
                    
                    // Use the appropriate markdown library for rendering
                    if (typeof marked !== 'undefined') {
                        notesPreview.innerHTML = marked.parse(cleanedNotes);
                    } else if (typeof showdown !== 'undefined') {
                        const converter = new showdown.Converter({
                            simpleLineBreaks: true,
                            strikethrough: true,
                            tables: true
                        });
                        notesPreview.innerHTML = converter.makeHtml(cleanedNotes);
                    } else {
                        notesPreview.innerHTML = formatMarkdown(cleanedNotes);
                    }
                    
                    currentNotesTitle.textContent = note.title;
                }
                
                // Save to localStorage (use both keys for compatibility)
                localStorage.setItem('notes', JSON.stringify(state.notes));
                localStorage.setItem('savedNotes', JSON.stringify(state.notes));
                
                // Update the list of notes
                updateNotesList();
                
                // Show the results section
                uploadSection.classList.add('hidden');
                processingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
            } else {
                // Fallback to regeneration using the stored transcription
                if (note.transcription) {
                    console.log('Regenerating notes using stored transcription');
                    await generateNotesFromTranscription(note.transcription, note.title);
                } else {
                    throw new Error('No transcription available for regeneration');
                }
            }
        } catch (error) {
            console.error('Error regenerating notes:', error);
            processingStatus.textContent = `Error: ${error.message}`;
            processingStatus.classList.add('error');
            
            // Reset after 5 seconds
            setTimeout(() => {
                processingStatus.classList.remove('error');
                
                // Return to results view
                uploadSection.classList.add('hidden');
                processingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
            }, 5000);
        }
    }

    // Generate notes from transcription (for regeneration)
    function generateNotesFromTranscription(transcription, title) {
        // Make sure we have a transcription
        if (!transcription) {
            alert('Error: Transcription is missing. Cannot regenerate notes.');
            return;
        }
        
        // Show processing section
        uploadSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        processingSection.classList.remove('hidden');
        
        // Update processing state
        updateProcessingState('generating');
        
        // Create form data for the API request
        const formData = new FormData();
        formData.append('transcription', transcription);
        formData.append('title', title || 'Lecture Notes');
        
        // Add API settings
        const apiProvider = state.settings.apiProvider;
        formData.append('apiProvider', apiProvider);
        
        if (apiProvider === 'custom') {
            formData.append('apiEndpoint', state.settings.apiEndpoint);
            formData.append('apiModelName', state.settings.apiModelName);
            formData.append('apiKey', state.settings.apiKey);
        } else if (apiProvider === 'default') {
            formData.append('model', 'gemini-2.0-flash');
        } else if (apiProvider === 'openai') {
            formData.append('model', state.settings.model);
            formData.append('apiKey', state.settings.apiKey);
        }
        
        // Set up progress checker for the generation phase
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
        
        // Send request to generate notes
        fetch('/api/generate-notes', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // Clear the generation timer
            clearTimeout(generationTimer);
            
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to generate notes');
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Failed to generate notes');
            }
            
            // Set progress bar to 100%
            const progressBar = document.querySelector('.progress-bar');
            progressBar.style.width = '100%';
            
            // Update processing state
            updateProcessingState('completed');
            
            // Wait a moment for the user to see the completion state
            setTimeout(() => {
                // Clean up the notes content by removing any auto-generated title
                let cleanedNotes = data.notes;
                
                // Clean up any blank lines at the beginning
                cleanedNotes = cleanedNotes.replace(/^\s+/, '');
                
                // Update current note's content while preserving other properties
                state.currentNote.content = cleanedNotes;
                
                // Ensure transcription is preserved
                if (!state.currentNote.transcription) {
                    state.currentNote.transcription = transcription; // Use the one we just passed in
                }
                
                // Update timestamp
                state.currentNote.timestamp = new Date().toISOString();
                
                // Update UI using the appropriate markdown library
                if (typeof marked !== 'undefined') {
                    notesPreview.innerHTML = marked.parse(cleanedNotes);
                } else if (typeof showdown !== 'undefined') {
                    const converter = new showdown.Converter({
                        simpleLineBreaks: true,
                        strikethrough: true,
                        tables: true
                    });
                    notesPreview.innerHTML = converter.makeHtml(cleanedNotes);
                } else {
                    notesPreview.innerHTML = formatMarkdown(cleanedNotes);
                }
                
                // Auto-save the note
                autoSaveCurrentNote();
                
                // Show the results
                processingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
            }, 1500);
        })
        .catch(error => {
            // Clear the generation timer
            clearTimeout(generationTimer);
            
            console.error('Error regenerating notes:', error);
            processingStatus.textContent = `Error: ${error.message || 'An unknown error occurred'}`;
            processingStatus.style.color = 'var(--error-color)';
            
            // Show a button to try again
            cancelBtn.textContent = 'Try Again';
            cancelBtn.onclick = function() {
                processingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.onclick = handleCancelProcessing;
            };
        });
    }

    // Delete a note
    function deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note? This cannot be undone.')) return;
        
        // Filter out the note to delete
        state.notes = state.notes.filter(note => note.id !== noteId);
        
        // Save to localStorage
        localStorage.setItem('savedNotes', JSON.stringify(state.notes));
        
        // Update the notes list
        updateNotesList();
        
        // If current note was deleted, go back to upload screen
        if (state.currentNote.id === noteId) {
            handleNewUpload();
        }
    }

    // Handle API provider change
    function handleApiProviderChange() {
        const provider = apiProvider.value;
        
        // Show/hide custom API settings
        if (provider === 'custom') {
            customApiSettings.classList.remove('hidden');
            standardModelSettings.classList.add('hidden');
        } else if (provider === 'default') {
            // For default provider (Gemini), hide both custom settings and model selection
            customApiSettings.classList.add('hidden');
            standardModelSettings.classList.add('hidden');
        } else {
            // For OpenAI, show model selection but hide custom settings
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
            case 'openai':
                options = [
                    { value: 'gpt-4', label: 'GPT-4' },
                    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
                ];
                break;
            default:
                // No options for other providers
                break;
        }
        
        // Add options to select element
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            modelSelect.appendChild(optionElement);
        });
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

    /**
     * Process the API response and update the state
     */
    function handleApiResponse(data) {
        // Update state with generated notes and transcription
        state.generatedNotes = data.notes;
        state.transcription = data.transcription;
        
        // Create a new note
        const noteId = 'note_' + Date.now();
        const noteTitle = getNoteTitleFromFilename(state.audioFile.name);
        
        // Clean up the notes content by removing any auto-generated title
        let cleanedNotes = data.notes;
        
        // Clean up any blank lines at the beginning
        cleanedNotes = cleanedNotes.replace(/^\s+/, '');
        
        const newNote = {
            id: noteId,
            title: noteTitle,
            content: cleanedNotes,
            transcription: data.transcription,
            audioFile: state.audioFile.name,
            date: new Date(),
            audioId: data.audioId,  // Store the audioId for regeneration
            timestamp: new Date().toISOString() // Add timestamp for proper date display
        };
        
        // Add to notes collection
        state.notes.unshift(newNote);
        
        // Set as current note
        state.currentNote = { ...newNote };
        
        // Save to localStorage (use both keys for compatibility)
        localStorage.setItem('notes', JSON.stringify(state.notes));
        localStorage.setItem('savedNotes', JSON.stringify(state.notes));
        
        // Update the UI
        // Use the appropriate markdown library for rendering
        if (typeof marked !== 'undefined') {
            notesPreview.innerHTML = marked.parse(cleanedNotes);
        } else if (typeof showdown !== 'undefined') {
            const converter = new showdown.Converter({
                simpleLineBreaks: true,
                strikethrough: true,
                tables: true
            });
            notesPreview.innerHTML = converter.makeHtml(cleanedNotes);
        } else {
            notesPreview.innerHTML = formatMarkdown(cleanedNotes);
        }
        
        currentNotesTitle.textContent = noteTitle;
        
        // Update the list of notes
        updateNotesList();
    }

    /**
     * Start the processing workflow
     */
    async function startProcessing() {
        // Show processing section
        uploadSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        processingSection.classList.remove('hidden');
        
        // Set initial processing stage
        updateProcessingState('uploading');
        
        // Setup progress animation for the upload/transcription phases
        let transcriptionProgress = 0;
        const progressInterval = setInterval(() => {
            // Increment progress gradually from 0% to 55%
            // This covers both uploading (0-20%) and transcribing (20-55%) phases
            if (transcriptionProgress < 55) {
                transcriptionProgress += 0.5;
                progressBar.style.width = `${transcriptionProgress}%`;
                
                // Update the status message based on progress
                if (transcriptionProgress >= 20 && state.processingStage === 'uploading') {
                    // Transition to transcribing phase
                    updateProcessingState('transcribing');
                }
            }
        }, 1000);
        
        try {
            const formData = new FormData();
            formData.append('audio', state.audioFile);
            
            if (state.slidesFile) {
                formData.append('slides', state.slidesFile);
            }
            
            // Add API settings
            formData.append('apiProvider', state.settings.apiProvider);
            formData.append('model', state.settings.model);
            
            if (state.settings.apiKey) {
                formData.append('apiKey', state.settings.apiKey);
            }
            
            if (state.settings.apiProvider === 'custom') {
                formData.append('apiEndpoint', state.settings.apiEndpoint);
                formData.append('apiModelName', state.settings.apiModelName);
            }
            
            // Whisper model selection
            formData.append('whisperModel', state.settings.whisperModel);
            
            // Process the audio file on the server
            console.log('Starting processing...');
            const response = await fetch('/api/process', {
                method: 'POST',
                body: formData
            });
            
            // Clear the progress interval
            clearInterval(progressInterval);
            
            if (!response.ok) {
                const errorData = await response.json();
                
                // Check if this is a retryable error
                if (errorData.retryable) {
                    console.warn('Received retryable error:', errorData);
                    processingStatus.textContent = `${errorData.message}`;
                    processingStatus.classList.add('warning');
                    
                    // Add retry button with auto-retry countdown
                    const retryContainer = document.createElement('div');
                    retryContainer.classList.add('retry-container');
                    
                    const retryMessage = document.createElement('p');
                    retryMessage.textContent = 'Retrying automatically in 5 seconds...';
                    retryMessage.classList.add('retry-message');
                    
                    const retryButton = document.createElement('button');
                    retryButton.textContent = 'Retry Now';
                    retryButton.classList.add('retry-btn');
                    
                    retryContainer.appendChild(retryMessage);
                    retryContainer.appendChild(retryButton);
                    processingStatus.appendChild(document.createElement('br'));
                    processingStatus.appendChild(retryContainer);
                    
                    // Setup auto-retry with countdown
                    let countdown = 5;
                    const countdownInterval = setInterval(() => {
                        countdown--;
                        if (countdown <= 0) {
                            clearInterval(countdownInterval);
                            // Auto retry
                            processingStatus.classList.remove('warning');
                            processingStatus.textContent = '';
                            startProcessing();
                        } else {
                            retryMessage.textContent = `Retrying automatically in ${countdown} seconds...`;
                        }
                    }, 1000);
                    
                    // Manual retry button
                    retryButton.addEventListener('click', () => {
                        clearInterval(countdownInterval);
                        processingStatus.classList.remove('warning');
                        processingStatus.textContent = '';
                        startProcessing();
                    });
                    
                    return; // Exit early to avoid throwing error
                }
                
                throw new Error(errorData.message || 'Processing failed');
            }
            
            const data = await response.json();
            console.log('Processing complete:', data);
            
            // Update progress to generating phase
            updateProcessingState('generating');
            
            // Setup progress animation for the generating phase
            let generatingProgress = 60;
            const generatingInterval = setInterval(() => {
                if (generatingProgress < 95) {
                    generatingProgress += 1;
                    progressBar.style.width = `${generatingProgress}%`;
                } else {
                    clearInterval(generatingInterval);
                }
            }, 300);
            
            // Short delay to show the generating phase
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update state and UI with the processed data
            handleApiResponse(data);
            
            // Clear the generating interval if still running
            clearInterval(generatingInterval);
            
            // Update processing state and show results
            updateProcessingState('completed');
            setTimeout(showResults, 1000);
        } catch (error) {
            // Clear the progress interval if still running
            clearInterval(progressInterval);
            
            console.error('Error processing:', error);
            processingStatus.textContent = `Error: ${error.message}`;
            processingStatus.classList.add('error');
            
            // Add retry button
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.classList.add('retry-btn');
            retryButton.addEventListener('click', () => {
                processingStatus.classList.remove('error');
                processingStatus.textContent = '';
                startProcessing();
            });
            
            processingStatus.appendChild(document.createElement('br'));
            processingStatus.appendChild(retryButton);
        }
    }

    // Extract a title from the filename
    function getNoteTitleFromFilename(filename) {
        // Remove file extension
        let title = filename.replace(/\.[^/.]+$/, "");
        
        // Remove numeric IDs like shown in the screenshot (Audio-1742743650086-257886662)
        title = title.replace(/(-|_)\d{10,16}(-|_)\d+/g, ""); // Removes long numeric IDs
        title = title.replace(/\d{10,16}(-|_)\d+/g, ""); // Removes IDs without separator
        title = title.replace(/(-|_)\d{10,16}/g, ""); // Removes just the ID
        
        // More aggressive cleaning for other timestamp-like patterns
        // This will remove patterns like: 1617283910-123456789, audio-1617283910, etc.
        title = title.replace(/(-|_)\d{6,}(-|_)\d+/g, ""); // Removes any sequence of 6+ digits
        title = title.replace(/\d{6,}(-|_)\d+/g, ""); // Without separator
        title = title.replace(/(-|_)\d{6,}/g, ""); // Just the digits with separator
        
        // Remove common audio recording prefixes
        title = title.replace(/^(audio|recording|voice|sound|lecture)(-|_|\.)/i, "");
        
        // Remove any leading numbers and separators
        title = title.replace(/^\d+(-|_|\.)/g, "");
        
        // Replace underscores and hyphens with spaces
        title = title.replace(/[_-]/g, " ");
        
        // Remove multiple spaces
        title = title.replace(/\s{2,}/g, " ");
        
        // Trim whitespace
        title = title.trim();
        
        // If title is empty after all the cleaning, use a default title
        if (!title || title.length < 2) {
            title = "Lecture Notes";
        }
        
        // Capitalize first letter of each word
        title = title.replace(/\b\w/g, l => l.toUpperCase());
        
        return title;
    }

    // Update processing state and UI
    function updateProcessingState(stage) {
        state.processingStage = stage;
        
        // Update status text
        switch (stage) {
            case 'uploading':
                processingStatus.textContent = 'Uploading your files...';
                // Initialize progress bar at 0% only if it's not already set
                if (progressBar.style.width === '') {
                    progressBar.style.width = '0%';
                }
                break;
            case 'transcribing':
                processingStatus.textContent = 'Transcribing audio...';
                // Don't update the progress bar width here, as it's handled by the animation
                break;
            case 'generating':
                processingStatus.textContent = 'Generating lecture notes...';
                // Don't update the progress bar width here, as it's handled by the animation
                break;
            case 'completed':
                processingStatus.textContent = 'Processing completed!';
                // Always set to 100% at completion
                progressBar.style.width = '100%';
                break;
        }
        
        // First, remove all active and completed classes
        document.querySelectorAll('.processing-steps .step').forEach(step => {
            step.classList.remove('active');
            step.classList.remove('completed');
        });
        
        // Map the current stage to the corresponding step ID
        const stageToStepId = {
            'uploading': 'step-upload',
            'transcribing': 'step-transcribe',
            'generating': 'step-generate',
            'completed': 'step-complete'
        };
        
        // Get the current step element
        const currentStepId = stageToStepId[stage];
        const currentStep = document.getElementById(currentStepId);
        
        if (!currentStep) {
            console.error(`Step element not found for stage: ${stage}`);
            return;
        }
        
        // Add active class to the current step
        currentStep.classList.add('active');
        
        // Mark previous steps as completed
        const steps = ['step-upload', 'step-transcribe', 'step-generate', 'step-complete'];
        const currentIndex = steps.indexOf(currentStepId);
        
        for (let i = 0; i < currentIndex; i++) {
            const step = document.getElementById(steps[i]);
            if (step) {
                step.classList.add('completed');
            }
        }
        
        // Log the current state for debugging
        console.log(`Processing state updated: ${stage}, step: ${currentStepId}`);
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
            // First try using marked with specific rendering options
            try {
                // Configure marked for proper spacing
                marked.setOptions({
                    breaks: true,        // Add line breaks
                    gfm: true,           // Use GitHub Flavored Markdown
                    headerIds: true,     // Enable header IDs
                    mangle: false,       // Don't escape HTML
                    silent: false        // Don't silence errors
                });
                return marked.parse(markdownText);
            } catch (e) {
                console.error('Error using marked:', e);
            }
        }
        
        if (typeof showdown !== 'undefined') {
            // Then try using showdown with specific options
            try {
                const converter = new showdown.Converter({
                    simpleLineBreaks: true,
                    strikethrough: true,
                    tables: true,
                    tasklists: true,
                    ghCodeBlocks: true
                });
                return converter.makeHtml(markdownText);
            } catch (e) {
                console.error('Error using showdown:', e);
            }
        }
        
        // If all else fails, use our custom formatter
        return formatMarkdown(markdownText);
    }

    // Simple markdown formatter for demo purposes
    function formatMarkdown(markdown) {
        // This is a very basic formatter - in a real app, use a proper markdown library
        let formatted = markdown
            // Ensure proper line breaks for proper markdown spacing
            .replace(/\r\n/g, '\n')
            
            // Headers with proper spacing
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            
            // List items with proper indentation (simplify to avoid issues)
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            
            // Simple list grouping
            .replace(/<\/li>\n<li>/g, '</li><li>')
            .replace(/\n<li>/g, '\n<ul><li>')
            .replace(/<\/li>\n/g, '</li></ul>\n')
            
            // Text formatting - simplified to prevent incorrect escaping
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
            
            // Code blocks - simplified
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`\n]+)`/g, '<code>$1</code>')
            
            // Add paragraph breaks
            .replace(/\n\n/g, '<br><br>');
        
        return formatted;
    }

    // Show results section
    function showResults() {
        processingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        // Use the appropriate markdown library
        if (typeof marked !== 'undefined') {
            notesPreview.innerHTML = marked.parse(state.generatedNotes);
        } else if (typeof showdown !== 'undefined') {
            const converter = new showdown.Converter({
                simpleLineBreaks: true,
                strikethrough: true,
                tables: true
            });
            notesPreview.innerHTML = converter.makeHtml(state.generatedNotes);
        } else {
            notesPreview.innerHTML = formatMarkdown(state.generatedNotes);
        }
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
        // Get the current note content
        const markdownContent = state.currentNote.content;
        
        if (!markdownContent) {
            alert('No content to copy!');
            return;
        }
        
        navigator.clipboard.writeText(markdownContent)
            .then(() => {
                // Show temporary success message
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy notes:', err);
                alert('Failed to copy to clipboard. Please try again.');
            });
    }

    // Handle download notes
    function handleDownloadNotes() {
        // Get the current note content
        const markdownContent = state.currentNote.content;
        
        if (!markdownContent) {
            alert('No content to download!');
            return;
        }
        
        // Generate file name from note title or audio file name
        let fileName = 'lecture_notes.md';
        
        if (state.currentNote.title && state.currentNote.title !== 'Generated Notes') {
            // Use the note title
            fileName = state.currentNote.title.replace(/[^\w\s-]/g, '') // Remove special chars
                .trim().replace(/\s+/g, '_') // Replace spaces with underscores
                + '.md';
        } else if (state.currentNote.audioFile) {
            // Use the audio file name
            fileName = state.currentNote.audioFile.replace(/\.[^/.]+$/, '') + '_notes.md';
        }
        
        // Create and download the file
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
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
        // For default provider, set model to gemini-2.0-flash
        const selectedModel = apiProvider.value === 'default' 
            ? 'gemini-2.0-flash' 
            : modelSelect.value;
            
        state.settings = {
            apiProvider: apiProvider.value,
            model: selectedModel,
            apiEndpoint: apiEndpoint.value,
            apiModelName: apiModelName.value,
            apiKey: apiKey.value,
            whisperModel: 'default' // Always use default whisper model
        };
        
        // Save to localStorage
        localStorage.setItem('apiProvider', state.settings.apiProvider);
        localStorage.setItem('model', state.settings.model);
        localStorage.setItem('apiEndpoint', state.settings.apiEndpoint);
        localStorage.setItem('apiModelName', state.settings.apiModelName);
        localStorage.setItem('apiKey', state.settings.apiKey);
        localStorage.setItem('whisperModel', state.settings.whisperModel);
        
        // Close modal
        closeSettings();
    }

    // Auto-save the current note
    function autoSaveCurrentNote() {
        if (!state.currentNote.content || !state.currentNote.title) return;
        
        const now = new Date();
        const timestamp = now.toISOString();
        
        // If there's no ID, create a new note
        if (!state.currentNote.id) {
            state.currentNote.id = Date.now().toString();
            state.currentNote.date = timestamp;
            state.currentNote.timestamp = timestamp;
            state.notes.push(state.currentNote);
        } else {
            // Otherwise, update the existing note
            const noteIndex = state.notes.findIndex(note => note.id === state.currentNote.id);
            if (noteIndex !== -1) {
                state.notes[noteIndex] = {
                    ...state.notes[noteIndex],
                    content: state.currentNote.content,
                    transcription: state.currentNote.transcription,
                    lastUpdated: timestamp,
                    timestamp: timestamp
                };
            }
        }
        
        // Save to localStorage (use both keys for compatibility)
        localStorage.setItem('savedNotes', JSON.stringify(state.notes));
        localStorage.setItem('notes', JSON.stringify(state.notes));
        
        // Update the notes list
        updateNotesList();
        
        console.log('Note auto-saved successfully');
    }

    // Make a note title editable
    function makeNoteEditable(titleElement, note) {
        // Create an input for editing
        const input = document.createElement('input');
        input.type = 'text';
        input.value = note.title;
        input.className = 'note-title-input';
        input.style.width = '100%';
        input.style.padding = '2px 5px';
        input.style.border = '1px solid var(--border-color)';
        input.style.borderRadius = '3px';
        input.style.font = 'inherit';
        input.style.fontWeight = 'bold';
        
        // Replace the title with the input
        titleElement.innerHTML = '';
        titleElement.appendChild(input);
        
        // Focus the input
        input.focus();
        input.select();
        
        // Save on blur or Enter key
        input.addEventListener('blur', () => saveNoteTitle(input, note, titleElement));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveNoteTitle(input, note, titleElement);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                titleElement.textContent = note.title; // Restore original
            }
        });
    }
    
    // Save the edited note title
    function saveNoteTitle(input, note, titleElement) {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== note.title) {
            // Update note title
            note.title = newTitle;
            
            // Update currently displayed note if it's the same
            if (state.currentNote.id === note.id) {
                state.currentNote.title = newTitle;
                currentNotesTitle.textContent = newTitle;
            }
            
            // Save to localStorage
            localStorage.setItem('savedNotes', JSON.stringify(state.notes));
        }
        
        // Restore the title element with new text
        titleElement.textContent = note.title;
    }

    // Function to render the current note in the editor
    function displayCurrentNote() {
        if (!state.currentNote) {
            editorSection.classList.add('hidden');
            return;
        }
        
        editorSection.classList.remove('hidden');
        noteTitle.value = state.currentNote.title || '';
        
        // Just display raw markdown in the editor without any modifications
        noteEditor.value = state.currentNote.content || '';
        
        // Display formatted preview using appropriate markdown library
        if (typeof marked !== 'undefined') {
            notePreview.innerHTML = marked.parse(state.currentNote.content || '');
        } else if (typeof showdown !== 'undefined') {
            const converter = new showdown.Converter({
                simpleLineBreaks: true,
                strikethrough: true,
                tables: true
            });
            notePreview.innerHTML = converter.makeHtml(state.currentNote.content || '');
        } else {
            notePreview.innerHTML = formatMarkdown(state.currentNote.content || '');
        }
        
        // Update timestamp display
        const timestamp = state.currentNote.timestamp 
            ? new Date(state.currentNote.timestamp).toLocaleString() 
            : 'Unknown date';
        noteTimestamp.textContent = `Last edited: ${timestamp}`;
        
        // Update the note list to show the selected note
        updateNotesList();
    }

    // Initialize the application
    init();
}); 
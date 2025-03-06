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
            date: null
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
        const title = prompt('Enter a title for your notes:', state.currentNote.title);
        if (!title) return; // User cancelled
        
        const now = new Date();
        
        // Check if we're updating an existing note
        if (state.currentNote.id) {
            // Find the note and update it
            const noteIndex = state.notes.findIndex(note => note.id === state.currentNote.id);
            if (noteIndex !== -1) {
                state.notes[noteIndex] = {
                    ...state.notes[noteIndex],
                    title,
                    content: state.currentNote.content,
                    lastUpdated: now.toISOString()
                };
            }
        } else {
            // Create a new note
            const newNote = {
                id: Date.now().toString(),
                title,
                content: state.currentNote.content,
                transcription: state.currentNote.transcription,
                date: now.toISOString(),
                lastUpdated: now.toISOString()
            };
            
            state.notes.push(newNote);
            state.currentNote.id = newNote.id;
            state.currentNote.title = title;
            state.currentNote.date = now.toISOString();
        }
        
        // Update UI
        currentNotesTitle.textContent = title;
        
        // Save to localStorage
        localStorage.setItem('savedNotes', JSON.stringify(state.notes));
        
        // Update the notes list
        updateNotesList();
        
        // Show a success message
        alert('Notes saved successfully!');
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
            notesPreview.innerHTML = renderMarkdown(note.content);
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

    // Handle regenerate button click
    function handleRegenerateNotes() {
        if (!state.currentNote.transcription) {
            alert('Cannot regenerate notes - no transcription available');
            return;
        }
        
        if (confirm('Are you sure you want to regenerate these notes?')) {
            generateNotesFromTranscription(state.currentNote.transcription, state.currentNote.title);
        }
    }

    // Regenerate a note by ID
    function regenerateNoteById(noteId) {
        const note = state.notes.find(note => note.id === noteId);
        if (!note || !note.transcription) {
            alert('Cannot regenerate notes - no transcription available');
            return;
        }
        
        if (confirm('Are you sure you want to regenerate these notes?')) {
            // First load the note
            loadNote(noteId);
            
            // Then regenerate
            generateNotesFromTranscription(note.transcription, note.title);
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
                // Update current note's content while preserving other properties
                state.currentNote.content = data.notes;
                
                // Ensure transcription is preserved
                if (!state.currentNote.transcription) {
                    state.currentNote.transcription = transcription; // Use the one we just passed in
                }
                
                // Update UI
                notesPreview.innerHTML = renderMarkdown(data.notes);
                
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
            } else if (apiProvider === 'default') {
                // For default provider, use the default Gemini model
                formData.append('model', 'gemini-2.0-flash');
            } else if (apiProvider === 'openai') {
                // For OpenAI, use the selected model and API key
                formData.append('model', state.settings.model);
                formData.append('apiKey', state.settings.apiKey);
            }
            
            // Always use default whisper model
            formData.append('whisperModel', 'default');
            
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
            
            // Reset current note
            state.currentNote = {
                id: null,
                title: getNoteTitleFromFilename(state.audioFile.name),
                content: data.notes,
                transcription: data.transcription, // Store the transcription for regeneration
                audioFile: state.audioFile.name,
                date: new Date().toISOString()
            };
            
            // Log the transcription for debugging
            console.log('Stored transcription length:', state.currentNote.transcription ? state.currentNote.transcription.length : 0);
            
            // Update UI
            currentNotesTitle.textContent = state.currentNote.title;
            
            // Make sure the note content is properly displayed
            notesPreview.innerHTML = renderMarkdown(data.notes);
            
            // Show the results
            processingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            
            // Auto-save the note
            autoSaveCurrentNote();
            
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

    // Extract a title from the filename
    function getNoteTitleFromFilename(filename) {
        // Remove file extension
        let title = filename.replace(/\.[^/.]+$/, "");
        
        // Replace underscores and hyphens with spaces
        title = title.replace(/[_-]/g, " ");
        
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
        
        // If there's no ID, create a new note
        if (!state.currentNote.id) {
            state.currentNote.id = Date.now().toString();
            state.currentNote.date = now.toISOString();
            state.notes.push(state.currentNote);
        } else {
            // Otherwise, update the existing note
            const noteIndex = state.notes.findIndex(note => note.id === state.currentNote.id);
            if (noteIndex !== -1) {
                state.notes[noteIndex] = {
                    ...state.notes[noteIndex],
                    content: state.currentNote.content,
                    transcription: state.currentNote.transcription,
                    lastUpdated: now.toISOString()
                };
            }
        }
        
        // Save to localStorage
        localStorage.setItem('savedNotes', JSON.stringify(state.notes));
        
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

    // Initialize the application
    init();
}); 
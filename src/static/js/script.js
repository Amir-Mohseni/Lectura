document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const lectureForm = document.getElementById('lectureForm');
    const audioUpload = document.getElementById('audioUpload');
    const slidesUpload = document.getElementById('slidesUpload');
    const audioFile = document.getElementById('audioFile');
    const slidesFile = document.getElementById('slidesFile');
    const generateButton = document.getElementById('generateButton');
    const menuButton = document.getElementById('menuButton');
    const settingsButton = document.getElementById('settingsButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const resultLinks = document.getElementById('resultLinks');
    
    // Settings modal elements
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsButton = document.getElementById('closeSettingsButton');
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const resetSettingsButton = document.getElementById('resetSettingsButton');
    const themeToggle = document.getElementById('themeToggle');
    const modelSelector = document.getElementById('modelSelector');
    const customModelContainer = document.getElementById('customModelContainer');
    const customModel = document.getElementById('customModel');
    const baseUrl = document.getElementById('baseUrl');

    // Default settings
    const defaultSettings = {
        theme: 'light',
        modelType: 'gpt-4',
        customModel: '',
        baseUrl: ''
    };

    // Load settings from localStorage
    loadSettings();

    // Add click event listeners using traditional approach
    if (menuButton) {
        menuButton.onclick = function(e) {
            e.preventDefault();
            console.log('Menu button clicked');
            // Implement menu functionality here
            alert('Menu functionality will be implemented in a future update.');
        };
    }

    // Settings button opens the settings modal
    if (settingsButton) {
        settingsButton.onclick = function(e) {
            e.preventDefault();
            if (settingsModal) {
                settingsModal.style.display = 'block';
            }
        };
    }

    // Close settings modal when clicking the close button
    if (closeSettingsButton) {
        closeSettingsButton.onclick = function() {
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
        };
    }

    // Close settings modal when clicking outside the modal content
    window.onclick = function(event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    };

    // Save settings button
    if (saveSettingsButton) {
        saveSettingsButton.onclick = function() {
            saveSettings();
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
        };
    }

    // Reset settings button
    if (resetSettingsButton) {
        resetSettingsButton.onclick = function() {
            resetSettings();
        };
    }

    // Theme toggle
    if (themeToggle) {
        themeToggle.onchange = function() {
            const theme = themeToggle.checked ? 'dark' : 'light';
            applyTheme(theme);
        };
    }

    // Model selector change
    if (modelSelector) {
        modelSelector.onchange = function() {
            toggleCustomModelInput();
        };
    }

    // Toggle custom model input based on selection
    function toggleCustomModelInput() {
        if (modelSelector.value === 'custom') {
            customModelContainer.style.display = 'flex';
        } else {
            customModelContainer.style.display = 'none';
        }
    }

    // Set up file upload for audio
    if (audioUpload && audioFile) {
        // Click to select file
        audioUpload.onclick = function() {
            audioFile.click();
        };

        // Handle file selection
        audioFile.onchange = function() {
            if (audioFile.files.length > 0) {
                const file = audioFile.files[0];
                const fileName = file.name || 'Unnamed audio file';
                const fileDisplay = audioUpload.querySelector('.upload-content p');
                if (fileDisplay) {
                    fileDisplay.textContent = fileName;
                }
                
                // Check file type
                const fileType = file.type;
                if (!fileType.startsWith('audio/') && 
                    !fileName.toLowerCase().endsWith('.mp3') && 
                    !fileName.toLowerCase().endsWith('.wav') && 
                    !fileName.toLowerCase().endsWith('.m4a') && 
                    !fileName.toLowerCase().endsWith('.ogg') &&
                    !fileName.toLowerCase().endsWith('.mp4')) {
                    
                    console.warn('Selected file may not be a valid audio file:', fileType);
                    // We'll still allow it, but show a warning
                    if (confirm('The selected file does not appear to be an audio file. Are you sure you want to use this file?')) {
                        // User confirmed, keep the file
                    } else {
                        // User canceled, clear the file input
                        audioFile.value = '';
                        fileDisplay.textContent = 'Choose file or drag here';
                    }
                }
            }
        };

        // Handle drag and drop
        audioUpload.ondragover = function(e) {
            e.preventDefault();
            audioUpload.style.borderColor = '#3498db';
        };

        audioUpload.ondragleave = function(e) {
            e.preventDefault();
            audioUpload.style.borderColor = '#dcdde1';
        };

        audioUpload.ondrop = function(e) {
            e.preventDefault();
            audioUpload.style.borderColor = '#dcdde1';
            
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                audioFile.files = e.dataTransfer.files;
                const fileName = file.name || 'Unnamed audio file';
                const fileDisplay = audioUpload.querySelector('.upload-content p');
                if (fileDisplay) {
                    fileDisplay.textContent = fileName;
                }
                
                // Check file type
                const fileType = file.type;
                if (!fileType.startsWith('audio/') && 
                    !fileName.toLowerCase().endsWith('.mp3') && 
                    !fileName.toLowerCase().endsWith('.wav') && 
                    !fileName.toLowerCase().endsWith('.m4a') && 
                    !fileName.toLowerCase().endsWith('.ogg') &&
                    !fileName.toLowerCase().endsWith('.mp4')) {
                    
                    console.warn('Dropped file may not be a valid audio file:', fileType);
                    // We'll still allow it, but show a warning
                    if (confirm('The dropped file does not appear to be an audio file. Are you sure you want to use this file?')) {
                        // User confirmed, keep the file
                    } else {
                        // User canceled, clear the file input
                        audioFile.value = '';
                        fileDisplay.textContent = 'Choose file or drag here';
                    }
                }
            }
        };
    }

    // Set up file upload for slides
    if (slidesUpload && slidesFile) {
        // Click to select file
        slidesUpload.onclick = function() {
            slidesFile.click();
        };

        // Handle file selection
        slidesFile.onchange = function() {
            if (slidesFile.files.length > 0) {
                const file = slidesFile.files[0];
                const fileName = file.name || 'Unnamed slides file';
                const fileDisplay = slidesUpload.querySelector('.upload-content p');
                if (fileDisplay) {
                    fileDisplay.textContent = fileName;
                }
                
                // Check file type
                const fileType = file.type;
                if (fileType !== 'application/pdf' && 
                    !fileType.includes('presentation') && 
                    !fileName.toLowerCase().endsWith('.pdf') && 
                    !fileName.toLowerCase().endsWith('.ppt') && 
                    !fileName.toLowerCase().endsWith('.pptx')) {
                    
                    console.warn('Selected file may not be a valid slides file:', fileType);
                    // We'll still allow it, but show a warning
                    if (confirm('The selected file does not appear to be a slides file (PDF, PPT, PPTX). Are you sure you want to use this file?')) {
                        // User confirmed, keep the file
                    } else {
                        // User canceled, clear the file input
                        slidesFile.value = '';
                        fileDisplay.textContent = 'Choose file or drag here';
                    }
                }
            }
        };

        // Handle drag and drop
        slidesUpload.ondragover = function(e) {
            e.preventDefault();
            slidesUpload.style.borderColor = '#3498db';
        };

        slidesUpload.ondragleave = function(e) {
            e.preventDefault();
            slidesUpload.style.borderColor = '#dcdde1';
        };

        slidesUpload.ondrop = function(e) {
            e.preventDefault();
            slidesUpload.style.borderColor = '#dcdde1';
            
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                slidesFile.files = e.dataTransfer.files;
                const fileName = file.name || 'Unnamed slides file';
                const fileDisplay = slidesUpload.querySelector('.upload-content p');
                if (fileDisplay) {
                    fileDisplay.textContent = fileName;
                }
                
                // Check file type
                const fileType = file.type;
                if (fileType !== 'application/pdf' && 
                    !fileType.includes('presentation') && 
                    !fileName.toLowerCase().endsWith('.pdf') && 
                    !fileName.toLowerCase().endsWith('.ppt') && 
                    !fileName.toLowerCase().endsWith('.pptx')) {
                    
                    console.warn('Dropped file may not be a valid slides file:', fileType);
                    // We'll still allow it, but show a warning
                    if (confirm('The dropped file does not appear to be a slides file (PDF, PPT, PPTX). Are you sure you want to use this file?')) {
                        // User confirmed, keep the file
                    } else {
                        // User canceled, clear the file input
                        slidesFile.value = '';
                        fileDisplay.textContent = 'Choose file or drag here';
                    }
                }
            }
        };
    }

    // Handle form submission
    if (lectureForm) {
        lectureForm.onsubmit = function(e) {
            e.preventDefault();
            
            console.log('Form submitted');
            
            // Validate form - require at least one file (audio or slides)
            if (!audioFile.files.length && !slidesFile.files.length) {
                alert('Please select at least one file (audio or slides)');
                return false;
            }

            // Check file types and sizes
            let hasValidFiles = false;
            
            if (audioFile.files.length) {
                const audioFileObj = audioFile.files[0];
                const audioFileName = audioFileObj.name || '';
                const audioFileType = audioFileObj.type || '';
                
                // Check if it's a valid audio file by extension or MIME type
                const validByExtension = ['.mp3', '.wav', '.m4a', '.ogg', '.mp4'].some(ext => 
                    audioFileName.toLowerCase().endsWith(ext)
                );
                const validByType = audioFileType.startsWith('audio/') || audioFileType.includes('mp4');
                
                if (!validByExtension && !validByType) {
                    if (!confirm('The audio file does not appear to be a valid audio format. Continue anyway?')) {
                        return false;
                    }
                }
                
                // Check if file is empty (size = 0)
                if (audioFileObj.size === 0) {
                    alert('The audio file is empty. Please select a valid audio file.');
                    return false;
                }
                
                hasValidFiles = true;
            }
            
            if (slidesFile.files.length) {
                const slidesFileObj = slidesFile.files[0];
                const slidesFileName = slidesFileObj.name || '';
                const slidesFileType = slidesFileObj.type || '';
                
                // Check if it's a valid slides file by extension or MIME type
                const validByExtension = ['.pdf', '.ppt', '.pptx'].some(ext => 
                    slidesFileName.toLowerCase().endsWith(ext)
                );
                const validByType = slidesFileType === 'application/pdf' || 
                                   slidesFileType.includes('presentation');
                
                if (!validByExtension && !validByType) {
                    if (!confirm('The slides file does not appear to be a valid format (PDF, PPT, PPTX). Continue anyway?')) {
                        return false;
                    }
                }
                
                // Check if file is empty (size = 0)
                if (slidesFileObj.size === 0) {
                    // If we have a valid audio file, warn but continue
                    if (hasValidFiles) {
                        if (!confirm('The slides file appears to be empty. Do you want to continue with just the audio file?')) {
                            return false;
                        }
                    } else {
                        alert('The slides file is empty. Please select a valid slides file.');
                        return false;
                    }
                } else {
                    hasValidFiles = true;
                }
            }

            // Validate custom model if selected
            const settings = getSettings();
            if (settings.modelType === 'custom' && !settings.customModel.trim()) {
                alert('Please enter a custom model name or select a predefined model');
                return false;
            }

            // Show loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            // Disable generate button
            if (generateButton) {
                generateButton.disabled = true;
                generateButton.innerHTML = '<span class="icon">⏳</span> Processing...';
            }

            // Create FormData object
            const formData = new FormData();
            
            // Only append files that exist and have content
            if (audioFile.files.length && audioFile.files[0].size > 0) {
                formData.append('audio', audioFile.files[0]);
            }
            
            if (slidesFile.files.length && slidesFile.files[0].size > 0) {
                formData.append('slides', slidesFile.files[0]);
            }
            
            // Add OpenAI model and base URL from settings
            const modelName = settings.modelType === 'custom' ? settings.customModel : settings.modelType;
            formData.append('api_model', modelName);
            formData.append('api_base_url', settings.baseUrl || '');
            
            console.log('Submitting form with:');
            console.log('- OpenAI model:', modelName);
            console.log('- Base URL:', settings.baseUrl || 'Default');
            console.log('- Audio file:', audioFile.files.length ? (audioFile.files[0].name || 'Unnamed audio file') : 'None');
            console.log('- Slides file:', slidesFile.files.length ? (slidesFile.files[0].name || 'Unnamed slides file') : 'None');
            
            // Ensure we're using the correct endpoint
            const endpoint = '/process';
            console.log('Using endpoint:', endpoint);
            
            // Send form data to server using fetch instead of XMLHttpRequest
            fetch(endpoint, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Response received:', response.status);
                console.log('Response URL:', response.url);
                return response.json();
            })
            .then(data => {
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Re-enable generate button
                if (generateButton) {
                    generateButton.disabled = false;
                    generateButton.innerHTML = '<span class="icon">✏️</span> Generate Notes';
                }
                
                console.log('Response data:', data);
                
                // Check if the response contains an error message
                if (data.error) {
                    showErrorMessage('Error', data.error, data.debug_info || null);
                    return;
                }
                
                // Check if the response was successful
                if (data.success === false) {
                    showErrorMessage(
                        'Failed to generate notes', 
                        data.error || 'The server reported a failure but did not provide a specific error message.',
                        data.debug_info || null
                    );
                    return;
                }
                
                if (data.success) {
                    // Show result container
                    if (resultContainer) {
                        resultContainer.style.display = 'block';
                        
                        // Get the notes content from the response
                        const notesContent = data.markdown_notes;
                        
                        if (notesContent) {
                            // Create a div for the markdown content
                            const notesDiv = document.createElement('div');
                            notesDiv.className = 'markdown-body';
                            notesDiv.innerHTML = marked.parse(notesContent);
                            
                            // Clear previous content and add the new notes
                            resultLinks.innerHTML = '';
                            resultLinks.appendChild(notesDiv);
                            
                            // Add a download button for the markdown
                            const downloadBtn = document.createElement('button');
                            downloadBtn.className = 'download-button';
                            downloadBtn.innerHTML = '<span class="icon">📥</span> Download Notes';
                            downloadBtn.onclick = function() {
                                // Create a blob with the markdown content
                                const blob = new Blob([notesContent], {type: 'text/markdown'});
                                const url = URL.createObjectURL(blob);
                                
                                // Create a temporary link and trigger download
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'lecture_notes.md';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            };
                            
                            resultLinks.appendChild(downloadBtn);
                            
                            // Scroll to results
                            resultContainer.scrollIntoView({ behavior: 'smooth' });
                            
                            // Show success message
                            setTimeout(() => {
                                alert('Notes generated successfully!');
                            }, 500);
                        } else {
                            showErrorMessage('Failed to generate notes', 'No notes content found in the response');
                        }
                    }
                } else {
                    // Handle non-200 status codes or unsuccessful responses
                    showErrorMessage(
                        'Server error', 
                        data.error || 'Unknown server error', 
                        data.debug_info || null
                    );
                }
            })
            .catch(error => {
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Re-enable generate button
                if (generateButton) {
                    generateButton.disabled = false;
                    generateButton.innerHTML = '<span class="icon">✏️</span> Generate Notes';
                }
                
                console.error('Request failed:', error);
                
                showErrorMessage(
                    'Network Error', 
                    'Failed to connect to the server. Please check your internet connection and try again.',
                    'If the problem persists, the server might be down or unreachable.'
                );
            });
            
            return false;
        };
    }

    // Show detailed error message
    function showErrorMessage(title, message, details) {
        console.error(title, message);
        if (details) {
            console.error('Details:', details);
        }
        
        let errorMessage = title;
        if (message) {
            errorMessage += '\n\n' + message;
        }
        
        // Add specific troubleshooting tips based on error type
        if (title.includes('400') || message.includes('400')) {
            errorMessage += '\n\nThis is a Bad Request error. The server could not understand the request.';
        } else if (title.includes('500') || message.includes('500')) {
            errorMessage += '\n\nThis is a Server Error. The server encountered an unexpected condition.';
        } else if (title.includes('Network Error') || message.includes('connection')) {
            errorMessage += '\n\nPlease check your internet connection and try again.';
        }
        
        // Add API-specific troubleshooting
        if (typeof details === 'string' && details.includes('OpenAI API')) {
            // For OpenAI API errors, add a note about checking the API key
            errorMessage += '\n\nPlease check your OpenAI API key and model settings.';
        }
        
        // Add troubleshooting tips based on the error message
        if (message && message.toLowerCase().includes('empty file')) {
            errorMessage += '\n\nTroubleshooting tips:' +
                '\n- Make sure your files contain valid content' +
                '\n- Try a different file format if available' +
                '\n- Check that your files are not corrupted';
        } else if (message && message.toLowerCase().includes('invalid file format')) {
            errorMessage += '\n\nSupported formats:' +
                '\n- Audio: mp3, wav, m4a, ogg, mp4' +
                '\n- Slides: pdf, ppt, pptx';
        } else if (message && message.toLowerCase().includes('no filename')) {
            errorMessage += '\n\nTroubleshooting tips:' +
                '\n- Try renaming your file before uploading' +
                '\n- Try a different file' +
                '\n- If using drag and drop, try using the file picker instead';
        }
        
        // Create a more user-friendly alert dialog
        try {
            // Try to create a custom modal if the DOM elements exist
            const errorModal = document.createElement('div');
            errorModal.className = 'error-modal';
            errorModal.style.position = 'fixed';
            errorModal.style.top = '0';
            errorModal.style.left = '0';
            errorModal.style.width = '100%';
            errorModal.style.height = '100%';
            errorModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            errorModal.style.display = 'flex';
            errorModal.style.justifyContent = 'center';
            errorModal.style.alignItems = 'center';
            errorModal.style.zIndex = '9999';
            
            const modalContent = document.createElement('div');
            modalContent.style.backgroundColor = 'var(--bg-color, #fff)';
            modalContent.style.color = 'var(--text-color, #333)';
            modalContent.style.borderRadius = '8px';
            modalContent.style.padding = '20px';
            modalContent.style.maxWidth = '80%';
            modalContent.style.maxHeight = '80%';
            modalContent.style.overflow = 'auto';
            modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            
            const modalHeader = document.createElement('div');
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            modalHeader.style.marginBottom = '15px';
            
            const modalTitle = document.createElement('h3');
            modalTitle.textContent = 'Error: ' + title;
            modalTitle.style.margin = '0';
            modalTitle.style.color = 'var(--error-color, #e74c3c)';
            
            const closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.color = 'var(--text-color, #333)';
            closeButton.onclick = function() {
                document.body.removeChild(errorModal);
            };
            
            const modalMessage = document.createElement('p');
            modalMessage.textContent = message;
            modalMessage.style.marginBottom = '15px';
            
            const modalDetails = document.createElement('div');
            if (details) {
                const detailsTitle = document.createElement('h4');
                detailsTitle.textContent = 'Technical Details:';
                detailsTitle.style.margin = '15px 0 5px 0';
                
                const detailsContent = document.createElement('pre');
                detailsContent.textContent = typeof details === 'object' ? JSON.stringify(details, null, 2) : details;
                detailsContent.style.backgroundColor = 'var(--code-bg, #f5f5f5)';
                detailsContent.style.padding = '10px';
                detailsContent.style.borderRadius = '4px';
                detailsContent.style.overflow = 'auto';
                detailsContent.style.fontSize = '12px';
                
                modalDetails.appendChild(detailsTitle);
                modalDetails.appendChild(detailsContent);
            }
            
            const okButton = document.createElement('button');
            okButton.textContent = 'OK';
            okButton.style.backgroundColor = 'var(--primary-color, #3498db)';
            okButton.style.color = '#fff';
            okButton.style.border = 'none';
            okButton.style.borderRadius = '4px';
            okButton.style.padding = '8px 16px';
            okButton.style.cursor = 'pointer';
            okButton.style.marginTop = '15px';
            okButton.onclick = function() {
                document.body.removeChild(errorModal);
            };
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalMessage);
            modalContent.appendChild(modalDetails);
            modalContent.appendChild(okButton);
            
            errorModal.appendChild(modalContent);
            document.body.appendChild(errorModal);
            
            // Add keyboard event listener to close on Escape
            document.addEventListener('keydown', function escapeHandler(e) {
                if (e.key === 'Escape') {
                    document.body.removeChild(errorModal);
                    document.removeEventListener('keydown', escapeHandler);
                }
            });
        } catch (e) {
            // Fall back to regular alert if custom modal fails
            console.error('Failed to create custom error modal:', e);
            alert(errorMessage);
        }
    }

    // Settings functions
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('lecturaSettings');
            const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
            
            // Apply theme
            applyTheme(settings.theme);
            
            // Set theme toggle
            if (themeToggle) {
                themeToggle.checked = settings.theme === 'dark';
            }
            
            // Set model selector
            if (modelSelector) {
                if (settings.modelType === 'custom') {
                    modelSelector.value = 'custom';
                    if (customModelContainer) {
                        customModelContainer.style.display = 'flex';
                    }
                } else {
                    modelSelector.value = settings.modelType;
                    if (customModelContainer) {
                        customModelContainer.style.display = 'none';
                    }
                }
            }
            
            // Set custom model
            if (customModel) {
                customModel.value = settings.customModel || '';
            }
            
            // Set base URL
            if (baseUrl) {
                baseUrl.value = settings.baseUrl || '';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            resetSettings();
        }
    }

    function saveSettings() {
        try {
            const isCustomModel = modelSelector.value === 'custom';
            
            // Validate custom model if selected
            if (isCustomModel && !customModel.value.trim()) {
                alert('Please enter a custom model name');
                return;
            }
            
            const settings = {
                theme: themeToggle.checked ? 'dark' : 'light',
                modelType: modelSelector.value,
                customModel: isCustomModel ? customModel.value.trim() : '',
                baseUrl: baseUrl.value.trim()
            };
            
            localStorage.setItem('lecturaSettings', JSON.stringify(settings));
            
            // Apply theme
            applyTheme(settings.theme);
            
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
    }

    function resetSettings() {
        try {
            localStorage.setItem('lecturaSettings', JSON.stringify(defaultSettings));
            
            // Apply theme
            applyTheme(defaultSettings.theme);
            
            // Set theme toggle
            if (themeToggle) {
                themeToggle.checked = defaultSettings.theme === 'dark';
            }
            
            // Set model selector
            if (modelSelector) {
                modelSelector.value = defaultSettings.modelType;
            }
            
            // Hide custom model input
            if (customModelContainer) {
                customModelContainer.style.display = 'none';
            }
            
            // Clear custom model
            if (customModel) {
                customModel.value = '';
            }
            
            // Clear base URL
            if (baseUrl) {
                baseUrl.value = '';
            }
            
            alert('Settings reset to defaults');
        } catch (error) {
            console.error('Error resetting settings:', error);
            alert('Failed to reset settings');
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    function getSettings() {
        try {
            const savedSettings = localStorage.getItem('lecturaSettings');
            return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
        } catch (error) {
            console.error('Error getting settings:', error);
            return defaultSettings;
        }
    }
}); 
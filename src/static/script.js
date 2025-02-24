document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const notesContent = document.getElementById('notesContent');
    
    try {
        loading.classList.remove('hidden');
        results.classList.add('hidden');
        
        const response = await fetch('/process', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Processing failed');
        }
        
        const data = await response.json();
        
        // Render markdown
        notesContent.innerHTML = marked.parse(data.notes);
        
        // Show results
        results.classList.remove('hidden');
        
        // Setup download button
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.onclick = () => {
            const blob = new Blob([data.notes], { type: 'text/markdown' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lecture_notes.md';
            a.click();
            window.URL.revokeObjectURL(url);
        };
        
    } catch (error) {
        alert('Error processing lecture: ' + error.message);
    } finally {
        loading.classList.add('hidden');
    }
}); 
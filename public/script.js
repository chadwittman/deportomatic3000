async function shareReport() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Deport-O-Matic 3000 - "Official" Government Portal',
                text: 'TOP SECRET: Government\'s most advanced tattoo analysis system. Definitely not a parody. Trust us, we\'re the government.',
                url: window.location.href
            });
        } catch (err) {
            console.error('Share failed:', err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize news ticker with improved performance
    const tickerTape = document.querySelector('.ticker-tape');
    if (tickerTape) {
        // Clone ticker content multiple times to ensure smooth infinite scrolling
        tickerTape.innerHTML += tickerTape.innerHTML;

        // Calculate proper animation duration based on actual content width
        // Wait for fonts to load before measuring
        window.addEventListener('load', () => {
            // Get the actual width of the ticker content
            const actualWidth = tickerTape.scrollWidth / 2; // Divide by 2 because we doubled the content
            const viewportWidth = window.innerWidth;

            // Calculate appropriate duration - slower for smoother appearance
            // Duration is proportional to content length for consistent speed
            const baseDuration = 40; // Base seconds for ticker to complete one cycle
            const speedFactor = actualWidth / 1000; // Adjust speed based on content length
            const animationDuration = baseDuration * speedFactor;

            // Apply the calculated duration
            tickerTape.style.animationDuration = `${animationDuration}s`;
        });
    }

    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const uploadInput = document.getElementById('uploadInput');
    const processingModal = document.getElementById('processingModal');
    const resultModal = document.getElementById('resultModal');
    const status = document.getElementById('status');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const closeResult = document.getElementById('closeResult');

    const statusMessages = [
        "ESTABLISHING SECURE CONNECTION TO FEDERAL DATABASE...",
        "INITIALIZING QUANTUM NEURAL NETWORKS...",
        "ACCESSING CLASSIFIED GANG SYMBOL REPOSITORY...",
        "CROSS-REFERENCING ICE WATCHLIST...",
        "ANALYZING SUBJECT MARKINGS [LEVEL 3 CLEARANCE]...",
        "CONSULTING INTERNATIONAL THREAT DATABASE...",
        "VALIDATING AGAINST MS-13 IDENTIFIER MATRIX...",
        "PROCESSING CULTURAL SIGNIFICANCE MARKERS...",
        "CALCULATING THREAT COEFFICIENT...",
        "PREPARING FINAL DETERMINATION..."
    ];

    uploadBtn.addEventListener('click', () => {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            const bottomSheet = document.createElement('div');
            bottomSheet.className = 'bottom-sheet';
            bottomSheet.innerHTML = `
                <div class="bottom-sheet-content">
                    <button id="takePhoto" class="sheet-option">Take Photo</button>
                    <button id="choosePhoto" class="sheet-option">Choose from Gallery</button>
                    <button id="cancelSheet" class="sheet-option cancel">Cancel</button>
                </div>
            `;
            document.body.appendChild(bottomSheet);

            document.getElementById('takePhoto').onclick = () => {
                fileInput.click();
                bottomSheet.remove();
            };
            document.getElementById('choosePhoto').onclick = () => {
                uploadInput.click();
                bottomSheet.remove();
            };
            document.getElementById('cancelSheet').onclick = () => bottomSheet.remove();
        } else {
            uploadInput.click();
        }
    });

    const handleImageUpload = async (e) => {
        if (e.target.files.length > 0) {
            // Clear previous results
            resultTitle.textContent = '';
            resultTitle.className = '';
            resultTitle.style.display = 'none';
            resultMessage.innerHTML = ''; // Clear all child elements including previous images

            processingModal.classList.remove('hidden');

            let messageIndex = 0;
            const statusInterval = setInterval(() => {
                status.textContent = statusMessages[messageIndex];
                messageIndex = (messageIndex + 1) % statusMessages.length;
            }, 1200);

            const formData = new FormData();
            formData.append('image', e.target.files[0]);

            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                clearInterval(statusInterval);
                processingModal.classList.add('hidden');

                resultTitle.textContent = ''; // Remove the text since it's on the image
                resultTitle.className = data.deportable ? 'deportable' : 'safe';
                resultTitle.style.display = 'none'; // Hide the title since it's on the image

                resultMessage.textContent = ''; // Remove the text since it's on the image

                if (data.processedImage) {
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'image-container';

                    const img = document.createElement('img');
                    // Fix the path handling by using the full path
                    const imageSrc = '/' + data.processedImage;
                    img.src = imageSrc;
                    img.style.maxWidth = '100%';
                    img.style.marginTop = '20px';
                    img.style.borderRadius = '8px';
                    img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    img.onerror = () => {
                        console.error('Image failed to load:', imageSrc);
                        img.alt = 'Image processing failed';
                        img.style.display = 'none';
                    };

                    const downloadBtn = document.createElement('button');
                    downloadBtn.innerHTML = 'SAVE ANALYSIS';
                    downloadBtn.className = 'download-button';
                    downloadBtn.addEventListener('click', () => {
                        const link = document.createElement('a');
                        link.href = imageSrc;
                        link.download = 'deport-o-matic-result.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    });

                    imgContainer.appendChild(img);
                    imgContainer.appendChild(downloadBtn);
                    resultMessage.appendChild(imgContainer);
                }
                resultModal.classList.remove('hidden');
            } catch (error) {
                console.error('Error:', error);
                clearInterval(statusInterval);
                processingModal.classList.add('hidden');
            }
        }
    };

    fileInput.addEventListener('change', handleImageUpload);
    uploadInput.addEventListener('change', handleImageUpload);

    closeResult.addEventListener('click', () => {
        resultModal.classList.add('hidden');
        fileInput.value = '';
        uploadInput.value = '';
        // Clear the result content for a fresh start
        resultTitle.textContent = '';
        resultTitle.className = '';
        resultMessage.innerHTML = '';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === resultModal) {
            resultModal.classList.add('hidden');
            fileInput.value = '';
            uploadInput.value = '';
        }
    });
});
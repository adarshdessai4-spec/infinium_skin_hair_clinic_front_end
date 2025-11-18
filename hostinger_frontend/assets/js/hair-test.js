const initHairTestFlow = () => {
  const panels = Array.from(document.querySelectorAll('[data-step-panel]'));
  if (!panels.length) {
    return;
  }

  const progressFill = document.querySelector('[data-progress-fill]');
  const progressValue = document.querySelector('[data-progress-value]');
  const prevButton = document.querySelector('[data-test-prev]');
  const steps = Array.from(document.querySelectorAll('.test-step'));
  const panelMeta = [
    { progress: 0, stepIndex: 0 },
    { progress: 8, stepIndex: 0 },
    { progress: 12, stepIndex: 0 },
    { progress: 24, stepIndex: 1 },
    { progress: 28, stepIndex: 1 },
    { progress: 33, stepIndex: 1 },
    { progress: 44, stepIndex: 1 },
    { progress: 72, stepIndex: 2 },
    { progress: 89, stepIndex: 2 },
    { progress: 100, stepIndex: 3 },
  ];
  let currentStep = 0;

  const updateUI = () => {
    panels.forEach((panel, index) => {
      const isActive = index === currentStep;
      panel.classList.toggle('is-active-panel', isActive);
      panel.hidden = !isActive;
    });

    const targetMeta = panelMeta[currentStep] ?? panelMeta[panelMeta.length - 1];

    steps.forEach((step, index) => {
      step.classList.toggle('is-active', index === targetMeta.stepIndex);
    });

    const progress =
      targetMeta.progress ?? Math.round((currentStep / Math.max(panels.length - 1, 1)) * 100);
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    if (progressValue) {
      progressValue.textContent = `${progress}%`;
    }

    if (prevButton) {
      prevButton.disabled = currentStep === 0;
    }
  };

  document.querySelectorAll('[data-test-next]').forEach((button) => {
    button.addEventListener('click', () => {
      if (currentStep < panels.length - 1) {
        currentStep += 1;
        updateUI();
      }
    });
  });

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep -= 1;
        updateUI();
      }
    });
  }

  const setupChoiceGroups = () => {
    document.querySelectorAll('[data-choice-next]').forEach((button) => {
      const groupName = button.getAttribute('data-choice-next');
      if (!groupName) {
        return;
      }
      const inputs = Array.from(document.querySelectorAll(`input[name="${groupName}"]`));
      if (!inputs.length) {
        return;
      }

      const updateState = () => {
        const checked = document.querySelector(`input[name="${groupName}"]:checked`);
        inputs.forEach((input) => {
          const card = input.closest('.hair-stage-card, .choice-card, .radio-list__item');
          if (card) {
            card.classList.toggle('is-selected', checked === input);
          }
        });
        button.disabled = !checked;
      };

      inputs.forEach((input) => {
        input.addEventListener('change', updateState);
      });

      updateState();
    });
  };

  setupChoiceGroups();

  const initUploadControls = () => {
    const libraryBtn = document.querySelector('[data-upload-trigger="library"]');
    const cameraBtn = document.querySelector('[data-upload-trigger="camera"]');
    const libraryInput = document.getElementById('scalpUploadInput');
    const cameraInput = document.getElementById('scalpCaptureInput');
    const statusEl = document.querySelector('[data-upload-status]');
    const previewEl = document.querySelector('[data-upload-preview]');
    const submitButton = document.querySelector('[data-upload-submit]');
    const loadingPanelIndex = panels.findIndex((panel) => panel.dataset.stepPanel === '10');
    let previewObjectURL = null;
    const modal = document.querySelector('[data-camera-modal]');
    const videoEl = modal?.querySelector('[data-camera-video]');
    const canvasEl = modal?.querySelector('[data-camera-canvas]');
    const captureBtn = modal?.querySelector('[data-camera-capture]');
    const closeBtn = modal?.querySelector('[data-camera-close]');
    let mediaStream = null;

    const updateSubmitState = (file) => {
      if (submitButton) {
        submitButton.disabled = !file;
      }
    };

    const applySelection = (file) => {
      if (statusEl) {
        if (file) {
          statusEl.textContent = `Selected: ${file.name}`;
          statusEl.classList.add('is-success');
        } else {
          statusEl.textContent = 'No file selected yet.';
          statusEl.classList.remove('is-success');
        }
      }

      if (previewEl) {
        if (previewObjectURL) {
          URL.revokeObjectURL(previewObjectURL);
          previewObjectURL = null;
        }
        if (file) {
          previewObjectURL = URL.createObjectURL(file);
          previewEl.src = previewObjectURL;
        } else {
          const fallback = previewEl.dataset.defaultSrc || previewEl.getAttribute('data-default-src');
          if (fallback) {
            previewEl.src = fallback;
          }
        }
      }

      updateSubmitState(file);
    };

    const wireButtonToInput = (button, input) => {
      if (!button || !input) {
        return;
      }
      button.addEventListener('click', () => input.click());
      input.addEventListener('change', () => {
        applySelection(input.files[0] || null);
      });
    };

    const stopCamera = () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
      }
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };

    const closeCameraModal = () => {
      if (!modal) {
        return;
      }
      modal.classList.remove('is-open');
      modal.hidden = true;
      stopCamera();
    };

    const openCameraModal = async () => {
      if (!modal || !videoEl || !navigator.mediaDevices?.getUserMedia) {
        cameraInput?.click();
        return;
      }
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = mediaStream;
        modal.hidden = false;
        requestAnimationFrame(() => modal.classList.add('is-open'));
      } catch (error) {
        cameraInput?.click();
      }
    };

    if (captureBtn && canvasEl && videoEl) {
      captureBtn.addEventListener('click', () => {
        const context = canvasEl.getContext('2d');
        if (!context) {
          return;
        }
        canvasEl.width = videoEl.videoWidth || 640;
        canvasEl.height = videoEl.videoHeight || 480;
        context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
        canvasEl.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `scalp-photo-${Date.now()}.png`, { type: blob.type });
            applySelection(file);
          }
        }, 'image/png');
        closeCameraModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeCameraModal);
    }

    modal?.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeCameraModal();
      }
    });

    wireButtonToInput(libraryBtn, libraryInput);
    if (cameraInput) {
      cameraInput.addEventListener('change', () => {
        const file = cameraInput.files[0] || null;
        applySelection(file);
      });
    }
    applySelection(null);
    updateSubmitState(null);

    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => {
        openCameraModal();
      });
    }

    submitButton?.addEventListener('click', () => {
      submitButton.textContent = 'Submitted ✔';
      submitButton.disabled = true;
      setTimeout(() => {
        submitButton.textContent = 'Submit Photo';
      }, 2000);
      if (loadingPanelIndex !== -1) {
        currentStep = loadingPanelIndex;
        updateUI();
        setTimeout(() => {
          window.location.href = 'result.html';
        }, 2000);
      }
    });
  };

  initUploadControls();

  updateUI();
};

document.addEventListener('DOMContentLoaded', initHairTestFlow);

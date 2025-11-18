const initHairTestFlow = () => {
  const STORAGE_KEYS = {
    results: 'infiniumUserResults',
    report: 'infiniumHairTestReport',
    profile: 'infiniumUserProfile',
    cart: 'infiniumUserCart',
    context: 'infiniumUserContext',
  };

  const loadJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  };

  const saveJSON = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* ignore */
    }
  };

  const stageCatalog = {
    'stage-1': {
      label: 'Stage 1',
      severity: 1,
      title: 'Stage 1 of Pattern Hair Fall',
      summary: 'Mild receding hairline and occasional shedding.',
    },
    'stage-2': {
      label: 'Stage 2',
      severity: 2,
      title: 'Stage 2 of Pattern Hair Fall',
      summary: 'Visible thinning around the temples.',
    },
    'stage-3': {
      label: 'Stage 3',
      severity: 3,
      title: 'Stage 3 of Pattern Hair Fall',
      summary: 'Noticeable thinning on crown and hairline.',
    },
    'stage-4': {
      label: 'Stage 4',
      severity: 4,
      title: 'Stage 4 of Pattern Hair Fall',
      summary: 'Advanced hairline recession with crown visibility.',
    },
    'stage-5': {
      label: 'Stage 5',
      severity: 5,
      title: 'Stage 5 of Pattern Hair Fall',
      summary: 'Large balding area on crown and hairline.',
    },
    'stage-6': {
      label: 'Stage 6',
      severity: 6,
      title: 'Stage 6 of Pattern Hair Fall',
      summary: 'Extensive thinning - requires intensive care.',
    },
    'stage-coin': {
      label: 'Coin Size Patch',
      severity: 3,
      title: 'Coin Size Alopecia Patch',
      summary: 'Localised alopecia needs targeted stimulation.',
    },
    'stage-heavy': {
      label: 'Heavy Hair Fall',
      severity: 5,
      title: 'Heavy Hair Fall Phase',
      summary: 'Diffuse shedding across the scalp.',
    },
  };

  const productCatalog = {
    shampoo: {
      id: 'defence-shampoo',
      name: 'Defence Shampoo',
      dosage: 'Use on alternate days',
      price: 799,
      tag: 'Hair hygiene',
      image: 'assets/images/product-shampoo.jpg',
    },
    hairRas: {
      id: 'hair-ras',
      name: 'Hair Ras Tonic',
      dosage: '10 ml every morning',
      price: 1899,
      tag: 'Doctor prescribed',
      image: 'assets/images/product-herbs.jpg',
    },
    calmRas: {
      id: 'calm-ras',
      name: 'Calm Ras Elixir',
      dosage: 'Night routine before bed',
      price: 1499,
      tag: 'Stress balance',
      image: 'assets/images/threefold-supplement.jpg',
    },
    scalpOil: {
      id: 'scalp-oil',
      name: 'Scalp Activation Oil',
      dosage: 'Massage twice a week',
      price: 999,
      tag: 'Follicle booster',
      image: 'assets/images/regimen-supplements.jpg',
    },
  };

  const areaCopy = {
    front: 'around the hairline',
    crown: 'on the crown',
    both: 'across the hairline and crown',
  };

  const existingProfile = loadJSON(STORAGE_KEYS.profile, {});
  const params = new URLSearchParams(window.location.search);
  const requestedAssessmentType = params.get('test') === 'skin' ? 'skin' : 'hair';

  const answers = {
    testType: requestedAssessmentType,
    name: existingProfile.name || '',
    age: existingProfile.age || '',
    gender: existingProfile.gender || '',
    stage: '',
    stageLabel: '',
    hairLossArea: '',
    familyHistory: 'none',
    dandruff: 'none',
    digestionIssues: 'no',
    bpIssue: 'none',
    photoProvided: false,
    photoName: '',
  };

  if (requestedAssessmentType === 'skin') {
    document.title = 'Infinium Hair & Skin Care Clinic | Skin Test';
    const tagline = document.querySelector('.test-brand p');
    if (tagline) {
      tagline.textContent = 'This skin test is co-created with experts';
    }
    const badge = document.querySelector('.test-nav .test-logo');
    if (badge) {
      badge.textContent = 'Infinium Skin Health Test';
    }
  }

  const choiceMap = {
    'hair-stage': { key: 'stage', labelKey: 'stageLabel' },
    'hair-loss-area': { key: 'hairLossArea' },
    'family-history': { key: 'familyHistory' },
    dandruff: { key: 'dandruff' },
    'digestion-issues': { key: 'digestionIssues' },
    'bp-issue': { key: 'bpIssue' },
  };

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

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const formatUpdatedLabel = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date?.getTime?.())) {
      return '';
    }
    const now = new Date();
    const options = { hour: 'numeric', minute: '2-digit' };
    const time = date.toLocaleTimeString('en-IN', options);
    if (date.toDateString() === now.toDateString()) {
      return `Today · ${time}`;
    }
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday · ${time}`;
    }
    const datePart = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${datePart} · ${time}`;
  };

  const buildRootCauses = (severity) => {
    const causes = [];
    if (answers.testType === 'skin') {
      causes.push({
        icon: '💧',
        title: 'Skin Barrier',
        detail: 'Barrier dryness and excess sebum are stressing follicles. Calming rinse restores balance.',
      });
    }
    if (answers.familyHistory && answers.familyHistory !== 'none') {
      causes.push({
        icon: '🧬',
        title: 'Genetics',
        detail: 'Family history indicates DHT sensitivity. We control it with Ayurvedic actives.',
      });
    }
    if (answers.dandruff && answers.dandruff !== 'none') {
      causes.push({
        icon: '🌿',
        title: 'Scalp Health',
        detail: 'Build-up & dandruff choke follicles. Anti-microbial rinse opens follicles.',
      });
    }
    if (answers.digestionIssues && answers.digestionIssues !== 'no') {
      causes.push({
        icon: '🥗',
        title: 'Nutrition',
        detail: 'Gut issues reduce absorption of minerals such as iron & biotin.',
      });
    }
    if (answers.bpIssue && answers.bpIssue !== 'none') {
      causes.push({
        icon: '⚙️',
        title: 'Metabolism',
        detail: 'BP fluctuations impact circulation and follicle nourishment.',
      });
    }
    if (!causes.length) {
      causes.push(
        { icon: '🧬', title: 'Genetics', detail: 'Mild androgen action is shrinking follicles.' },
        { icon: '🥦', title: 'Lifestyle', detail: 'Daily stress & irregular meals elevate cortisol.' },
        { icon: '🌿', title: 'Scalp Health', detail: 'Early buildup slowing growth cycle.' }
      );
    }
    if (causes.length < 3 && severity >= 4) {
      causes.push({
        icon: '💤',
        title: 'Stress Cycle',
        detail: 'Chronic stress accelerates shedding in advanced stages.',
      });
    }
    return causes.slice(0, 3);
  };

  const buildTimeline = (planMonths, severity) => [
    {
      label: 'Month 1-2',
      text:
        severity >= 4
          ? 'Calm aggressive shedding, soothe scalp inflammation and open follicles.'
          : 'Balance internal triggers and improve scalp nutrition.',
    },
    {
      label: 'Month 3-4',
      text: 'Noticeable fall control, thicker strands and healthier scalp biome.',
    },
    {
      label: `Month ${planMonths}`,
      text: 'Baby hair sprouting across sparse zones with visible density gain.',
    },
  ];

  const buildRecommendedProducts = (severity) => {
    const bundle = [productCatalog.hairRas, productCatalog.shampoo];
    if (severity >= 4) {
      bundle.push(productCatalog.calmRas);
    } else {
      bundle.push(productCatalog.scalpOil);
    }
    return bundle;
  };

  const computeReport = () => {
    const stageInfo = stageCatalog[answers.stage] || stageCatalog['stage-2'];
    const severity = stageInfo.severity;
    const genderLabel = answers.gender === 'female' ? 'Female' : 'Male';
    const stageTitle =
      answers.testType === 'skin'
        ? `${genderLabel} Skin & Scalp Program`
        : `${stageInfo.label} of ${genderLabel} Pattern Hair Fall`;
    let score = 96 - severity * 7;
    if (answers.familyHistory && answers.familyHistory !== 'none') {
      score -= answers.familyHistory === 'both' ? 9 : 6;
    }
    if (answers.dandruff === 'mild') {
      score -= 3;
    } else if (answers.dandruff === 'heavy') {
      score -= 7;
    } else if (answers.dandruff === 'psoriasis') {
      score -= 9;
    }
    if (answers.digestionIssues === 'sometimes') {
      score -= 4;
    } else if (answers.digestionIssues === 'often') {
      score -= 6;
    }
    if (answers.bpIssue === 'high') {
      score -= 4;
    } else if (answers.bpIssue === 'low') {
      score -= 3;
    }
    score = clamp(Math.round(score), 38, 94);
    const planMonths = severity >= 5 ? 7 : severity >= 3 ? 6 : 5;
    const areaText = areaCopy[answers.hairLossArea] || 'across your scalp';
    const rootCauses = buildRootCauses(severity);
    const focusTags = rootCauses.map((cause) => cause.title).slice(0, 3);
    const areaText =
      answers.testType === 'skin' ? 'across your scalp' : areaCopy[answers.hairLossArea] || 'across your scalp';
    const summary =
      answers.testType === 'skin'
        ? `${answers.name || 'Your profile'} indicates scalp barrier sensitivity ${areaText}. ${
            rootCauses[0]?.detail || ''
          } Expect calmer skin within ${planMonths} months with the Infinium regimen.`
        : `${answers.name || 'Your profile'} indicates ${stageInfo.label} hair fall ${areaText}. ${
            rootCauses[0]?.detail || ''
          } Expect healthier regrowth within ${planMonths} months with the Infinium regimen.`;
    const improvement = clamp(42 - severity * 4, 14, 32);
    const recommendedProducts = buildRecommendedProducts(severity);
    const createdAt = new Date();
    const entry = {
      id: `hair-test-${Date.now()}`,
      type: answers.testType === 'skin' ? 'Skin Health' : 'Hair Health',
      title: answers.testType === 'skin' ? 'Skin Health Program' : `${stageInfo.label} Hair Program`,
      status: 'Completed',
      score,
      summary,
      focus: focusTags,
      improvement: `Potential +${improvement}% thicker strands`,
      updatedAt: createdAt.toISOString(),
      updatedLabel: formatUpdatedLabel(createdAt),
      link: 'result.html',
    };

    return {
      id: entry.id,
      createdAt: entry.updatedAt,
      answers: { ...answers },
      metrics: {
        stageKey: answers.stage,
        stageLabel: stageInfo.label,
        stageTitle,
        stageSummary: stageInfo.summary,
        score,
        summary,
        planMonths,
        focusTags,
        improvementText: entry.improvement,
        areaText,
      },
      timeline: buildTimeline(planMonths, severity),
      rootCauses,
      recommendations: {
        products: recommendedProducts,
        addons: ['Hair Coach Support', 'Custom Diet Plan', 'Doctor Follow-ups'],
        cartItems: recommendedProducts.map((product) => ({ ...product, qty: 1 })),
      },
      resultEntry: entry,
    };
  };

  const persistReport = (report) => {
    saveJSON(STORAGE_KEYS.report, report);
    const existingResults = loadJSON(STORAGE_KEYS.results, []);
    const filtered = existingResults.filter((item) => item.id !== report.id);
    filtered.unshift(report.resultEntry);
    saveJSON(STORAGE_KEYS.results, filtered.slice(0, 5));
    saveJSON(STORAGE_KEYS.cart, report.recommendations.cartItems);

    const profile = loadJSON(STORAGE_KEYS.profile, {});
    const updatedProfile = {
      ...profile,
      name: answers.name || profile.name,
      age: answers.age || profile.age,
      gender: answers.gender || profile.gender,
      stage: `${report.metrics.stageLabel} | Active Plan`,
    };
    saveJSON(STORAGE_KEYS.profile, updatedProfile);

    const context = loadJSON(STORAGE_KEYS.context, {});
    const nextContext = {
      ...context,
      stage: report.metrics.stageLabel,
      lastAssessmentId: report.id,
    };
    saveJSON(STORAGE_KEYS.context, nextContext);
  };

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

  const nextButtons = Array.from(document.querySelectorAll('[data-test-next]'));

  const goToNextStep = () => {
    if (currentStep < panels.length - 1) {
      currentStep += 1;
      updateUI();
    }
  };

  nextButtons.forEach((button) => {
    button.addEventListener('click', goToNextStep);
  });

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep -= 1;
        updateUI();
      }
    });
  }

  const enforceFieldValue = (input, button, key) => {
    if (!input || !button) return;
    const updateState = () => {
      const value = input.value.trim();
      button.disabled = !value;
      if (value) {
        answers[key] = key === 'age' ? Number(value) : value;
      }
    };
    input.addEventListener('input', updateState);
    updateState();
  };

  const nameInput = document.querySelector('[data-test-name]');
  const ageInput = document.querySelector('[data-test-age]');
  const nameNextBtn = document.querySelector('[data-step-panel="0"] [data-test-next]');
  const ageNextBtn = document.querySelector('[data-step-panel="1"] [data-test-next]');

  if (existingProfile.name && nameInput) {
    nameInput.value = existingProfile.name;
  }
  if (existingProfile.age && ageInput) {
    ageInput.value = existingProfile.age;
  }
  enforceFieldValue(nameInput, nameNextBtn, 'name');
  enforceFieldValue(ageInput, ageNextBtn, 'age');

  const wireValueButtons = () => {
    const buttons = document.querySelectorAll('[data-test-field]');
    const grouped = {};
    buttons.forEach((button) => {
      const field = button.dataset.testField;
      if (!grouped[field]) {
        grouped[field] = [];
      }
      grouped[field].push(button);
      button.addEventListener('click', () => {
        const value = button.dataset.testValue;
        if (field && value) {
          answers[field] = value;
        }
        grouped[field].forEach((btn) => {
          btn.classList.toggle('is-selected', btn === button);
        });
      });
    });

    if (answers.gender && grouped.gender) {
      grouped.gender.forEach((btn) => {
        btn.classList.toggle('is-selected', btn.dataset.testValue === answers.gender);
      });
    }
  };

  wireValueButtons();

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
        const mapEntry = choiceMap[groupName];
        if (checked && mapEntry) {
          const inputValue = checked.value || checked.dataset.value;
          if (inputValue) {
            answers[mapEntry.key] = inputValue;
          }
          if (mapEntry.labelKey) {
            const label =
              checked.closest('.hair-stage-card')?.querySelector('.hair-stage-card__label')?.textContent?.trim() ||
              inputValue;
            answers[mapEntry.labelKey] = label;
          }
        }
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
    let selectedFile = null;

    const updateSubmitState = () => {
      if (submitButton) {
        submitButton.disabled = !selectedFile;
      }
      answers.photoProvided = Boolean(selectedFile);
      answers.photoName = selectedFile?.name || '';
    };

    const applySelection = (file) => {
      selectedFile = file || null;
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

      updateSubmitState();
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

    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => {
        openCameraModal();
      });
    }

    const handleSubmit = () => {
      if (!submitButton) return;
      submitButton.addEventListener('click', () => {
        if (!selectedFile) {
          return;
        }
        submitButton.textContent = 'Submitted ✔';
        submitButton.disabled = true;
        setTimeout(() => {
          submitButton.textContent = 'Submit Photo';
        }, 2000);

        try {
          const report = computeReport();
          persistReport(report);
        } catch (error) {
          console.error('Unable to compute hair test report', error);
        }

        const loadingIndex = loadingPanelIndex === -1 ? panels.length - 1 : loadingPanelIndex;
        if (loadingIndex !== -1) {
          currentStep = loadingIndex;
          updateUI();
          setTimeout(() => {
            window.location.href = 'result.html';
          }, 2000);
        }
      });
    };

    handleSubmit();
  };

  initUploadControls();
  updateUI();
};

document.addEventListener('DOMContentLoaded', initHairTestFlow);

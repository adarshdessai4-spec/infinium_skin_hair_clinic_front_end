(function () {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  window.addEventListener('load', () => {
    window.scrollTo(0, 0);
  });

  let pendingDestination = null;
  let openLoginModal = null;
  try {
    const storedRedirect = sessionStorage.getItem('infiniumPendingDestination');
    if (storedRedirect) {
      pendingDestination = storedRedirect;
      sessionStorage.removeItem('infiniumPendingDestination');
    }
  } catch (_) {
    /* storage disabled */
  }

  const getStoredUserContext = () => {
    try {
      const raw = localStorage.getItem('infiniumUserContext');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  };

  const isUserLoggedIn = () => {
    const context = getStoredUserContext();
    return Boolean(context?.loggedInAt);
  };

  const deriveNameFromEmail = (email) => {
    if (!email || typeof email !== 'string') return '';
    const localPart = email.split('@')[0] || '';
    if (!localPart) return '';
    return localPart
      .split(/[.\-_]/)
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  };

  const loginPromptReason = new URLSearchParams(window.location.search).get('loginRequired');

  const overlay = document.getElementById('menuOverlay');
  const menuButton = document.querySelector('.nav-icon--menu');
  const closeButton = document.querySelector('.menu-overlay__close');

  if (overlay && menuButton && closeButton) {
    const toggleMenu = (forceState) => {
      const isOpen = overlay.classList.contains('is-open');
      const shouldOpen = typeof forceState === 'boolean' ? forceState : !isOpen;

      overlay.classList.toggle('is-open', shouldOpen);
      overlay.setAttribute('aria-hidden', (!shouldOpen).toString());
      document.body.classList.toggle('menu-open', shouldOpen);
      menuButton.setAttribute('aria-expanded', shouldOpen.toString());

      if (shouldOpen) {
        closeButton.focus();
      } else {
        menuButton.focus();
      }
    };

    menuButton.addEventListener('click', () => toggleMenu());
    closeButton.addEventListener('click', () => toggleMenu(false));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        toggleMenu(false);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        toggleMenu(false);
      }
    });
  }

  const navDropdown = document.querySelector('.nav-dropdown');
  if (navDropdown) {
    const dropdownButton = navDropdown.querySelector('.nav-cta--dropdown');
    const dropdownMenu = navDropdown.querySelector('.nav-dropdown__menu');

    if (dropdownButton && dropdownMenu) {
      const setDropdownState = (open) => {
        navDropdown.classList.toggle('is-open', open);
        dropdownButton.setAttribute('aria-expanded', open.toString());
      };

      dropdownButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = navDropdown.classList.contains('is-open');
        setDropdownState(!isOpen);
      });

      dropdownMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        const target = event.target.closest('button[data-link]');
        if (target) {
          setDropdownState(false);
          const href = target.getAttribute('data-link');
          if (href && href !== '#') {
            window.location.href = href;
          }
        }
      });

      document.addEventListener('click', () => {
        setDropdownState(false);
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          setDropdownState(false);
        }
      });
    }
  }

  const franchiseMarqueeLink = document.querySelector('[data-franchise-link]');
  if (franchiseMarqueeLink) {
    const navigateToFranchisePortal = () => {
      const targetUrl = franchiseMarqueeLink.getAttribute('href') || 'franchise.html';
      window.location.href = targetUrl;
    };

    franchiseMarqueeLink.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      navigateToFranchisePortal();
    });

    franchiseMarqueeLink.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigateToFranchisePortal();
      }
    });
  }

  const moneyBackExit = document.querySelector('.money-back__exit');
  if (moneyBackExit) {
    moneyBackExit.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  const loginTriggers = document.querySelectorAll('[data-login-trigger]');
  const loginModal = document.getElementById('loginModal');
  if (loginModal && loginTriggers.length) {
    const closeButtons = loginModal.querySelectorAll('[data-login-close]');
    const overlay = loginModal.querySelector('.login-modal__overlay');
    const errorField = loginModal.querySelector('[data-login-error]');
    const loginSteps = loginModal.querySelectorAll('[data-login-step]');
    let lastLoginTrigger = null;
    let pendingOtpContext = null;
    const phoneInput = loginModal.querySelector('#loginMobile');
    const sendButton = loginModal.querySelector('[data-login-action="send"]');
    const otpInputs = loginModal.querySelectorAll('[data-otp-input]');
    const otpTarget = loginModal.querySelector('[data-otp-target]');
    const resendButton = loginModal.querySelector('[data-login-resend]');
    const countdownLabel = loginModal.querySelector('[data-login-countdown]');
    const verifyButton = loginModal.querySelector('[data-login-action="verify"]');
    const googleButton = loginModal.querySelector('.login-social--google');
    const roleButtons = loginModal.querySelectorAll('[data-login-role]');
    const adminShortcutButton = loginModal.querySelector('[data-admin-test-login]');
    const userShortcutButton = loginModal.querySelector('[data-user-test-login]');
    const profileNameInput = loginModal.querySelector('#loginName');
    const profileCompleteButton = loginModal.querySelector('[data-login-action="complete"]');
    const profileSuccessPhone = loginModal.querySelector('[data-login-success-phone]');
    const toggleGoogleLoading = (isLoading) => {
      if (!googleButton) return;
      const label = googleButton.querySelector('span');
      googleButton.classList.toggle('is-loading', isLoading);
      googleButton.disabled = isLoading;
      if (label) {
        if (!label.dataset.defaultText) {
          label.dataset.defaultText = label.textContent;
        }
        label.textContent = isLoading ? 'Connecting…' : label.dataset.defaultText;
      }
    };

    const resolveApiBase = () => {
      if (typeof window.__INF_OTP_API_BASE === 'string') {
        return window.__INF_OTP_API_BASE;
      }
      if (window.location.hostname === 'localhost' && window.location.port !== '4000') {
        return window.location.origin;
      }
      return '';
    };

    const OTP_API_BASE = resolveApiBase();
    const OTP_SECONDS = 60;
    let otpTimerId = null;
    let currentCountdown = OTP_SECONDS;
    let currentPhoneDisplay = '+91 XXXXXXXX';
    let currentPhoneDigits = '';
    let currentRole = 'user';
    const syncShortcutVisibility = () => {
      const isAdmin = currentRole === 'admin';
      if (adminShortcutButton) {
        adminShortcutButton.hidden = !isAdmin;
      }
      if (userShortcutButton) {
        userShortcutButton.hidden = isAdmin;
      }
    };
    syncShortcutVisibility();
    const createSessionPayload = (context = {}) => ({
      role: context.role || currentRole,
      name: context.name || context.email || context.phone || 'Infinium Member',
      email: context.email,
      phone: context.phone,
      avatar: context.avatar,
      provider: context.provider || 'otp',
      loggedInAt: new Date().toISOString(),
    });

    const requestOtpApi = async (path, payload) => {
      const url = OTP_API_BASE ? `${OTP_API_BASE}${path}` : path;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }
      if (!response.ok) {
        throw new Error(data?.message || 'Something went wrong. Please try again.');
      }
      return data;
    };

    const setButtonLoading = (button, isLoading, loadingText) => {
      if (!button) return;
      if (!button.dataset.defaultText) {
        button.dataset.defaultText = button.textContent;
      }
      button.disabled = isLoading;
      if (isLoading && loadingText) {
        button.textContent = loadingText;
      } else {
        button.textContent = button.dataset.defaultText;
      }
    };

    const setLoginError = (message = '') => {
      if (!errorField) return;
      errorField.textContent = message;
      errorField.style.visibility = message ? 'visible' : 'hidden';
    };

    const showLoginStep = (step) => {
      loginSteps.forEach((stepEl) => {
        const shouldShow = stepEl.dataset.loginStep === step;
        stepEl.classList.toggle('is-active', shouldShow);
      });
    };

    const stopOtpTimer = () => {
      if (otpTimerId) {
        clearInterval(otpTimerId);
        otpTimerId = null;
      }
    };

    const resetLoginFlow = () => {
      stopOtpTimer();
      currentCountdown = OTP_SECONDS;
      pendingOtpContext = null;
      if (resendButton) {
        resendButton.disabled = true;
        resendButton.setAttribute('disabled', 'true');
      }
      if (countdownLabel) countdownLabel.textContent = OTP_SECONDS.toString();
      phoneInput.value = '';
      otpInputs.forEach((input) => {
        input.value = '';
      });
      currentPhoneDisplay = '+91 XXXXXXXX';
      currentPhoneDigits = '';
      if (otpTarget) otpTarget.textContent = currentPhoneDisplay;
      if (profileNameInput) {
        profileNameInput.value = '';
        profileNameInput.classList.remove('is-error');
      }
      if (profileSuccessPhone) {
        profileSuccessPhone.textContent = currentPhoneDisplay;
      }
      setLoginError('');
      setButtonLoading(sendButton, false);
      setButtonLoading(verifyButton, false);
      toggleGoogleLoading(false);
      showLoginStep('number');
    };

    const startOtpTimer = () => {
      stopOtpTimer();
      currentCountdown = OTP_SECONDS;
      if (countdownLabel) countdownLabel.textContent = currentCountdown.toString();
      if (resendButton) {
        resendButton.disabled = true;
        resendButton.setAttribute('disabled', 'true');
      }
      otpTimerId = setInterval(() => {
        currentCountdown -= 1;
        if (countdownLabel) countdownLabel.textContent = Math.max(currentCountdown, 0).toString();
        if (currentCountdown <= 0) {
          stopOtpTimer();
          if (resendButton) {
            resendButton.disabled = false;
            resendButton.removeAttribute('disabled');
          }
        }
      }, 1000);
    };

    const startOtpFlow = (phoneDigits) => {
      currentPhoneDigits = phoneDigits;
      currentPhoneDisplay = `+91 ${phoneDigits}`;
      if (otpTarget) otpTarget.textContent = currentPhoneDisplay;
      showLoginStep('otp');
      otpInputs[0]?.focus();
      startOtpTimer();
    };

    const sanitizeDigits = (value) => value.replace(/\D/g, '');

    const collectOtp = () => Array.from(otpInputs).reduce((acc, input) => acc + input.value, '');

    const transitionToProfileStep = (phoneLabel) => {
      pendingOtpContext = {
        provider: 'otp',
        phone: phoneLabel || undefined,
      };
      if (profileSuccessPhone && phoneLabel) {
        profileSuccessPhone.textContent = phoneLabel;
      }
      showLoginStep('profile');
      profileNameInput?.focus();
    };

    const destinationForRole = (roleOverride) => {
      const role = roleOverride || currentRole;
      return role === 'admin' ? 'admin-portal.html' : 'user-portal.html';
    };

    const handleLoginSuccess = (context = {}) => {
      const payload = createSessionPayload({
        ...context,
        name: context.name || deriveNameFromEmail(context.email),
      });
      try {
        localStorage.setItem('infiniumUserContext', JSON.stringify(payload));
      } catch (_) {
        /* ignore */
      }
      setLoginState(false);
      const targetDestination = pendingDestination || destinationForRole(payload.role);
      pendingDestination = null;
      try {
        sessionStorage.removeItem('infiniumPendingDestination');
      } catch (_) {
        /* ignore */
      }
      window.location.href = targetDestination;
    };

    let googlePopup = null;
    const closeGooglePopup = () => {
      if (googlePopup && !googlePopup.closed) {
        googlePopup.close();
      }
      googlePopup = null;
    };

    const setLoginState = (open) => {
      resetLoginFlow();
      loginModal.classList.toggle('is-open', open);
      loginModal.setAttribute('aria-hidden', (!open).toString());
      document.body.classList.toggle('modal-open', open);
      if (open) {
        phoneInput.focus();
      } else {
        lastLoginTrigger?.focus();
      }
    };

    openLoginModal = () => setLoginState(true);

    loginTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        lastLoginTrigger = trigger;
        setLoginState(true);
      });
    });

    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setLoginState(false));
    });

    overlay?.addEventListener('click', () => setLoginState(false));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && loginModal.classList.contains('is-open')) {
        setLoginState(false);
      }
    });

    roleButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        roleButtons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentRole = btn.dataset.loginRole || 'user';
        syncShortcutVisibility();
      });
    });

    const handleGoogleMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'infinium-google-auth') {
        return;
      }
      closeGooglePopup();
      toggleGoogleLoading(false);
      if (data.error) {
        setLoginError(data.error);
        return;
      }
      setLoginError('');
      handleLoginSuccess({
        name: data.user?.name,
        email: data.user?.email,
        avatar: data.user?.picture,
        provider: 'google',
      });
    };

    window.addEventListener('message', handleGoogleMessage);

    adminShortcutButton?.addEventListener('click', () => {
      setLoginError('');
      handleLoginSuccess({
        role: 'admin',
        name: 'Admin Preview',
        provider: 'direct',
      });
    });

    userShortcutButton?.addEventListener('click', () => {
      setLoginError('');
      handleLoginSuccess({
        role: 'user',
        name: 'Infinium Member',
        provider: 'direct',
      });
    });

    if (sendButton && phoneInput) {
      const normalizePhoneInput = () => {
        const digitsOnly = sanitizeDigits(phoneInput.value).slice(0, 10);
        if (phoneInput.value !== digitsOnly) {
          phoneInput.value = digitsOnly;
        }
        if (digitsOnly.length === 10) {
          phoneInput.classList.remove('is-error');
        }
      };

      phoneInput.addEventListener('input', () => {
        normalizePhoneInput();
        if (phoneInput.value.trim().length) {
          phoneInput.classList.remove('is-error');
        }
      });
      normalizePhoneInput();

      sendButton.addEventListener('click', async () => {
        const digits = sanitizeDigits(phoneInput.value).slice(0, 10);
        if (phoneInput.value !== digits) {
          phoneInput.value = digits;
        }
        if (digits.length < 10) {
          phoneInput.focus();
          phoneInput.classList.add('is-error');
          setLoginError('Please enter a valid 10 digit mobile number.');
          return;
        }
        phoneInput.classList.remove('is-error');
        setLoginError('');
        setButtonLoading(sendButton, true, 'Sending…');
        try {
          await requestOtpApi('/api/send-otp', { phone: digits.slice(-10) });
          startOtpFlow(digits.slice(-10));
        } catch (error) {
          setLoginError(error.message);
        } finally {
          setButtonLoading(sendButton, false);
        }
      });
    }

    otpInputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        input.value = sanitizeDigits(input.value).slice(0, 1);
        if (input.value && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !input.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });

    resendButton?.addEventListener('click', async () => {
      if (resendButton.disabled || !currentPhoneDigits) return;
      setLoginError('');
      resendButton.disabled = true;
      resendButton.setAttribute('disabled', 'true');
      try {
        await requestOtpApi('/api/send-otp', { phone: currentPhoneDigits });
        startOtpTimer();
      } catch (error) {
        setLoginError(error.message);
        stopOtpTimer();
        resendButton.disabled = false;
        resendButton.removeAttribute('disabled');
      }
    });

    verifyButton?.addEventListener('click', async () => {
      const code = collectOtp();
      if (code.length < otpInputs.length) {
        otpInputs[0]?.focus();
        setLoginError('Please enter the complete OTP.');
        return;
      }
      if (!currentPhoneDigits) {
        showLoginStep('number');
        setLoginError('Please enter your mobile number first.');
        return;
      }
      setLoginError('');
      setButtonLoading(verifyButton, true, 'Verifying…');
      try {
        await requestOtpApi('/api/verify-otp', { phone: currentPhoneDigits, otp: code });
        const phoneLabel = currentPhoneDigits ? `+91 ${currentPhoneDigits}` : null;
        transitionToProfileStep(phoneLabel);
      } catch (error) {
        setLoginError(error.message);
      } finally {
        setButtonLoading(verifyButton, false);
      }
    });

    const submitProfileStep = () => {
      if (!pendingOtpContext) {
        showLoginStep('number');
        return;
      }
      const desiredName = profileNameInput?.value.trim();
      if (!desiredName) {
        profileNameInput?.classList.add('is-error');
        profileNameInput?.focus();
        return;
      }
      profileNameInput?.classList.remove('is-error');
      handleLoginSuccess({
        ...pendingOtpContext,
        name: desiredName,
      });
      pendingOtpContext = null;
    };

    profileCompleteButton?.addEventListener('click', submitProfileStep);
    profileNameInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        submitProfileStep();
      }
    });
    profileNameInput?.addEventListener('input', () => {
      profileNameInput.classList.remove('is-error');
    });

    if (googleButton) {
      googleButton.addEventListener('click', async () => {
        try {
          setLoginError('');
          toggleGoogleLoading(true);
          const url = OTP_API_BASE ? `${OTP_API_BASE}/api/auth/google/url` : '/api/auth/google/url';
          const response = await fetch(url);
          const contentType = response.headers.get('content-type') || '';
          const data = contentType.includes('application/json') ? await response.json() : {};
          if (!response.ok || !data?.url) {
            throw new Error(data?.message || 'Unable to start Google login.');
          }
          googlePopup = window.open(
            data.url,
            'infinium-google-login',
            'width=520,height=600'
          );
          if (!googlePopup) {
            throw new Error('Please allow popups to continue with Google login.');
          }
        } catch (error) {
          setLoginError(error.message);
          toggleGoogleLoading(false);
        }
      });
    }

    if (loginPromptReason && !isUserLoggedIn()) {
      setLoginState(true);
      setLoginError('Please log in to continue to your test.');
    }
  }

  document.addEventListener('click', (event) => {
    const candidate = event.target.closest('a[href], [data-requires-login]');
    if (!candidate) return;
    const href = candidate.getAttribute('href') || candidate.dataset.href;
    if (!href) return;
    const requiresAuth =
      candidate.hasAttribute('data-requires-login') ||
      /hair-test\.html/i.test(href) ||
      /skin-test\.html/i.test(href);
    if (!requiresAuth) {
      return;
    }
    if (isUserLoggedIn()) {
      return;
    }
    event.preventDefault();
    pendingDestination = href;
    try {
      sessionStorage.setItem('infiniumPendingDestination', href);
    } catch (_) {
      /* ignore */
    }
    if (typeof openLoginModal === 'function') {
      openLoginModal();
    } else if (/hair-test\.html/i.test(href)) {
      window.location.href = 'index.html?loginRequired=hair-test';
    } else {
      window.location.href = 'index.html?loginRequired=login';
    }
  });

  const productsPanel = document.getElementById('productsPanel');
  const productTriggers = document.querySelectorAll('[data-products-trigger]');
  if (productsPanel && productTriggers.length) {
    const productCloseButtons = productsPanel.querySelectorAll('[data-products-close]');
    const setProductsState = (open) => {
      productsPanel.classList.toggle('is-open', open);
      productsPanel.setAttribute('aria-hidden', (!open).toString());
    };

    productTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        setProductsState(true);
      });
    });

    productCloseButtons.forEach((btn) => {
      btn.addEventListener('click', () => setProductsState(false));
    });
  }

  const eligibilityTrigger = document.querySelector('[data-eligibility-trigger]');
  const eligibilityModal = document.getElementById('eligibilityModal');

  if (eligibilityTrigger && eligibilityModal) {
    const closeButtons = eligibilityModal.querySelectorAll('[data-eligibility-close]');
    const overlay = eligibilityModal.querySelector('.eligibility-modal__overlay');

    const setModalState = (open) => {
      eligibilityModal.classList.toggle('is-open', open);
      eligibilityModal.setAttribute('aria-hidden', (!open).toString());
      document.body.classList.toggle('modal-open', open);
      if (open) {
        eligibilityModal.querySelector('.eligibility-modal__close').focus();
      } else {
        eligibilityTrigger.focus();
      }
    };

    eligibilityTrigger.addEventListener('click', (event) => {
      event.preventDefault();
      setModalState(true);
    });

    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => setModalState(false));
    });

    overlay?.addEventListener('click', () => setModalState(false));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && eligibilityModal.classList.contains('is-open')) {
        setModalState(false);
      }
    });
  }

  const combosRoot = document.querySelector('.combos-body');
  if (combosRoot) {
    const plansGrid = combosRoot.querySelector('.combos-plans__grid');
    const tagButtons = combosRoot.querySelectorAll('.combos-tag');
    if (!plansGrid || !tagButtons.length) {
      return;
    }

    const comboPlans = {
      hair: [
        {
          image: 'assets/images/product-herbs.jpg',
          imageAlt: 'Holistic Hair Plan',
          tag: 'Hair + Nutrition',
          title: 'Holistic Hair Plan',
          description: 'Daily herbs and vitamins paired with scalp care to target thinning from the inside out.',
          features: ['Hair Ras Ayurvedic herbs', 'Biotin + DHT blockers', 'Infinium scalp tonic'],
          price: '₹ 2,999',
          priceNote: '30-day starter pack',
          cta: 'Start Plan',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/regimen-supplements.jpg',
          imageAlt: 'Advanced Growth Kit',
          tag: 'Advanced Kit',
          title: 'Advanced Growth Kit',
          description: 'Clinically proven actives, growth boosters, and lifestyle tracking for aggressive hair fall.',
          features: ['Minoxidil + peptide serum', 'Hair growth supplements', 'Dedicated hair coach'],
          price: '₹ 4,499',
          priceNote: 'Includes coaching',
          cta: 'Build My Plan',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/threefold-supplement.jpg',
          imageAlt: 'Strength & Shine Set',
          tag: 'Repair + Protect',
          title: 'Strength & Shine Set',
          description: 'A three-step ritual to strengthen the shaft, seal in moisture, and protect against styling.',
          features: ['Bond repair mist', 'Strengthening conditioner', 'Daily shine serum'],
          price: '₹ 1,999',
          priceNote: 'Ships in 48 hours',
          cta: 'Strengthen Hair',
          href: 'hair-test.html',
        },
      ],
      dandruff: [
        {
          image: 'assets/images/product-shampoo.jpg',
          imageAlt: 'Clarifying Combo',
          tag: 'Dandruff Control',
          title: 'Clarifying Combo',
          description: 'Powerful anti-fungal shampoo with soothing scalp oil for stubborn dandruff and itch.',
          features: ['Anti-dandruff shampoo', 'Tea tree scalp oil', 'Weekly detox mask'],
          price: '₹ 1,499',
          priceNote: 'Best for oily scalps',
          cta: 'Get This Combo',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/regimen-supplements.jpg',
          imageAlt: 'Scalp Recovery Duo',
          tag: 'Repair Routine',
          title: 'Scalp Recovery Duo',
          description: 'Rebalances the microbiome while calming redness so flakes do not resurface.',
          features: ['Prebiotic scalp mist', 'Cooling aloe serum', 'Menthol scalp brush'],
          price: '₹ 1,799',
          priceNote: 'Derm-approved actives',
          cta: 'Calm My Scalp',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/product-herbs.jpg',
          imageAlt: 'Sebum Reset Routine',
          tag: 'Oil + Flake',
          title: 'Sebum Reset Routine',
          description: 'Targets excess oil production so your scalp stays fresh for 48 hours straight.',
          features: ['Clay pre-wash mask', 'Probiotic cleanser', 'Clarifying tonic'],
          price: '₹ 1,650',
          priceNote: 'Includes scalp brush',
          cta: 'Reset Now',
          href: 'hair-test.html',
        },
      ],
      gut: [
        {
          image: 'assets/images/product-herbs.jpg',
          imageAlt: 'Gut Reset Stack',
          tag: 'Detox + Nourish',
          title: 'Gut Reset Stack',
          description: 'Cleanses Ama toxins, improves absorption, and fuels follicles with better nutrition.',
          features: ['Consti Clear herbs', 'Digest Boost tablets', 'Caffeine-free detox tea'],
          price: '₹ 2,299',
          priceNote: '14-day reset plan',
          cta: 'Reset Gut',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/regimen-supplements.jpg',
          imageAlt: 'Digest & Glow Kit',
          tag: 'Daily Ritual',
          title: 'Digest & Glow Kit',
          description: 'Supports gut lining, reduces bloating, and keeps nutrients flowing to the scalp.',
          features: ['Collagen peptides', 'Glutamine shot', 'Probiotic duo'],
          price: '₹ 2,899',
          priceNote: 'Ships with shaker',
          cta: 'Fuel My Gut',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/threefold-supplement.jpg',
          imageAlt: 'Detox & Nourish Program',
          tag: 'Coach Guided',
          title: 'Detox & Nourish Program',
          description: 'A guided elimination plan plus mindful eating prompts to calm gut inflammation.',
          features: ['Coach check-ins', 'Recipe playbook', 'Weekly progress tracking'],
          price: '₹ 3,499',
          priceNote: '4-week journey',
          cta: 'Start Program',
          href: 'hair-test.html',
        },
      ],
      stress: [
        {
          image: 'assets/images/threefold-supplement.jpg',
          imageAlt: 'Adaptive Calm Stack',
          tag: 'Mind + Hair',
          title: 'Adaptive Calm Stack',
          description: 'Adaptogens, magnesium, and breath cues to reduce cortisol-driven hair fall.',
          features: ['Ashwagandha complex', 'Magnesium glycinate', 'Guided breath audio'],
          price: '₹ 1,899',
          priceNote: 'Monthly supply',
          cta: 'Lower Stress',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/regimen-supplements.jpg',
          imageAlt: 'Sleep + Growth Kit',
          tag: 'Night Ritual',
          title: 'Sleep + Growth Kit',
          description: 'Improves deep sleep so your body can repair follicles throughout the night.',
          features: ['Melatonin-free drops', 'Scalp massage oil', 'Bedtime routine cards'],
          price: '₹ 2,150',
          priceNote: 'Ships with satin cap',
          cta: 'Upgrade Sleep',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/product-herbs.jpg',
          imageAlt: 'Nervous System Support',
          tag: 'Calm Circuit',
          title: 'Nervous System Support',
          description: 'Targets nervous system fatigue with B vitamins and grounding rituals.',
          features: ['B-complex sachets', 'Copper tongue cleaner', 'AM intention journal'],
          price: '₹ 1,750',
          priceNote: '21-day sprint',
          cta: 'Find Balance',
          href: 'hair-test.html',
        },
      ],
      hormone: [
        {
          image: 'assets/images/regimen-supplements.jpg',
          imageAlt: 'Hormone Harmony Plan',
          tag: 'Root Cause',
          title: 'Hormone Harmony Plan',
          description: 'Balances insulin spikes, supports liver detox, and keeps shedding in check.',
          features: ['Shatavari blends', 'Spearmint tea', 'Blood sugar tracker'],
          price: '₹ 2,799',
          priceNote: 'PCOS-friendly',
          cta: 'Balance Hormones',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/product-herbs.jpg',
          imageAlt: 'PCOS Balance Combo',
          tag: "Women's Health",
          title: 'PCOS Balance Combo',
          description: 'Inositol powered drink plus anti-androgen serum for androgenic hair fall.',
          features: ['Inositol drink mix', 'Anti-androgen drops', 'Cycle sync calendar'],
          price: '₹ 3,099',
          priceNote: 'Doctor curated',
          cta: 'Start Balance',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/threefold-supplement.jpg',
          imageAlt: 'Endocrine Support Set',
          tag: 'Inner Calm',
          title: 'Endocrine Support Set',
          description: 'Supports adrenals, balances estrogen dominance, and keeps inflammation low.',
          features: ['Seed cycling kit', 'Omega complex', 'Inflammation journal'],
          price: '₹ 3,450',
          priceNote: 'Includes coach chat',
          cta: 'Support Endocrine',
          href: 'hair-test.html',
        },
      ],
      thyroid: [
        {
          image: 'assets/images/product-herbs.jpg',
          imageAlt: 'Thyroid Balance Kit',
          tag: 'Metabolic Care',
          title: 'Thyroid Balance Kit',
          description: 'Boosts metabolism, manages shedding, and stabilises energy dips daily.',
          features: ['Thyro Santulan', 'Iodine-safe drops', 'Energy breathwork'],
          price: '₹ 2,599',
          priceNote: 'Pairs with TSH meds',
          cta: 'Support Thyroid',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/regimen-supplements.jpg',
          imageAlt: 'Energy + Growth Stack',
          tag: 'Daily Sustain',
          title: 'Energy + Growth Stack',
          description: 'Protein + adaptogen smoothie blend to rebuild strands despite slow thyroid.',
          features: ['Vegan protein', 'Moringa mix', 'Digital recipe cards'],
          price: '₹ 2,849',
          priceNote: '15 servings',
          cta: 'Fuel Energy',
          href: 'hair-test.html',
        },
        {
          image: 'assets/images/threefold-supplement.jpg',
          imageAlt: 'Auto-immune Friendly Plan',
          tag: 'Holistic',
          title: 'Auto-immune Friendly Plan',
          description: "Designed for Hashimoto's with anti-inflammatory herbs and guided routines.",
          features: ['Gluten-free kit', 'Inflammation labs tracker', 'Coach check-ins'],
          price: '₹ 3,299',
          priceNote: '6-week roadmap',
          cta: 'Start Healing',
          href: 'hair-test.html',
        },
      ],
    };

    const renderPlans = (categoryKey) => {
      const plans = comboPlans[categoryKey] || comboPlans.hair;
      plansGrid.innerHTML = '';
      const fragment = document.createDocumentFragment();

      plans.forEach((plan) => {
        const article = document.createElement('article');
        article.className = 'combo-card';
        article.innerHTML = `
          <img src="${plan.image}" alt="${plan.imageAlt}" />
          <span class="combo-card__tag">${plan.tag}</span>
          <h3>${plan.title}</h3>
          <p>${plan.description}</p>
          <ul>
            ${plan.features.map((feature) => `<li>${feature}</li>`).join('')}
          </ul>
          <div class="combo-card__footer">
            <div>
              <p class="combo-card__price">${plan.price}</p>
              <small>${plan.priceNote}</small>
            </div>
            <a class="primary-cta" href="${plan.href}">${plan.cta}</a>
          </div>
        `;
        fragment.appendChild(article);
      });

      plansGrid.appendChild(fragment);
    };

    const setActiveTag = (activeButton) => {
      tagButtons.forEach((button) => {
        const isActive = button === activeButton;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive.toString());
      });
    };

    const resolveKey = (button) => button?.dataset.comboFilter || (button?.textContent || 'hair').toLowerCase();

    let initialButton = Array.from(tagButtons).find((button) => button.classList.contains('is-active'));
    if (!initialButton) {
      initialButton = tagButtons[0];
    }
    const initialKey = resolveKey(initialButton);
    renderPlans(initialKey);
    setActiveTag(initialButton);

    tagButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.classList.contains('is-active')) {
          return;
        }
        setActiveTag(button);
        renderPlans(resolveKey(button));
      });
    });
  }
})();

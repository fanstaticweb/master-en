/* ==========================================================================
   PREMIUM BOUTIQUE HOTEL & B&B TEMPLATE SCRIPTS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --------------------------------------------------------------------------
  // 1. STICKY HEADER
  // --------------------------------------------------------------------------
  const header = document.querySelector('.header');
  const scrollThreshold = 50;

  const handleScroll = () => {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  // Run on initial load and on scroll
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // --------------------------------------------------------------------------
  // 2. MOBILE MENU & ACCESSIBILITY
  // --------------------------------------------------------------------------
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileLinks = mobileNav.querySelectorAll('a');
  const body = document.body;

  const toggleMenu = (show) => {
    const isOpening = show !== undefined ? show : !mobileNav.classList.contains('active');
    
    if (isOpening) {
      mobileNav.classList.add('active');
      menuToggle.classList.add('active');
      menuToggle.setAttribute('aria-expanded', 'true');
      body.classList.add('menu-open');
    } else {
      mobileNav.classList.remove('active');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('menu-open');
    }
  };

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking on any link
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Close menu when clicking outside the menu overlay
  document.addEventListener('click', (e) => {
    if (mobileNav.classList.contains('active') && !mobileNav.contains(e.target) && e.target !== menuToggle) {
      toggleMenu(false);
    }
  });

  // Close menu on ESC key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
      toggleMenu(false);
    }
  });

  // --------------------------------------------------------------------------
  // 3. FLATPICKR CALENDAR LOGIC (HERO & DETAILED FORM)
  // --------------------------------------------------------------------------
  
  // Date formatting utility
  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Helper to add days to a date
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const todayStr = formatDate(new Date());

  /* --- A. HERO BOOKING BAR DATEPICKERS --- */
  let heroCheckOutPicker;
  
  const heroCheckInPicker = flatpickr("#hero_check_in", {
    dateFormat: "Y-m-d",
    minDate: "today",
    onChange: function(selectedDates, dateStr) {
      if (selectedDates.length > 0) {
        const checkInDate = selectedDates[0];
        const nextDay = addDays(checkInDate, 1);
        
        // Update Checkout minDate to Check-in date + 1 day
        heroCheckOutPicker.set("minDate", formatDate(nextDay));
        
        // If checkout is empty, or is before or equal to check-in, update and auto-open checkout picker
        const currentCheckOutDate = heroCheckOutPicker.selectedDates[0];
        if (!currentCheckOutDate || currentCheckOutDate <= checkInDate) {
          heroCheckOutPicker.setDate(formatDate(nextDay));
          
          // Small delay before opening to allow DOM updates
          setTimeout(() => {
            heroCheckOutPicker.open();
          }, 100);
        }
      }
    }
  });

  heroCheckOutPicker = flatpickr("#hero_check_out", {
    dateFormat: "Y-m-d",
    minDate: formatDate(addDays(new Date(), 1)) // Default to tomorrow minDate
  });

  /* --- B. DETAILED INQUIRY FORM DATEPICKERS --- */
  let inquiryCheckOutPicker;
  
  const inquiryCheckInPicker = flatpickr("#inquiry_check_in", {
    dateFormat: "Y-m-d",
    minDate: "today",
    onChange: function(selectedDates, dateStr) {
      if (selectedDates.length > 0) {
        const checkInDate = selectedDates[0];
        const nextDay = addDays(checkInDate, 1);
        
        // Update Checkout minDate to Check-in date + 1 day
        inquiryCheckOutPicker.set("minDate", formatDate(nextDay));
        
        // If checkout is empty, or is before or equal to check-in, update and auto-open checkout picker
        const currentCheckOutDate = inquiryCheckOutPicker.selectedDates[0];
        if (!currentCheckOutDate || currentCheckOutDate <= checkInDate) {
          inquiryCheckOutPicker.setDate(formatDate(nextDay));
          
          setTimeout(() => {
            inquiryCheckOutPicker.open();
          }, 100);
        }
      }
    }
  });

  inquiryCheckOutPicker = flatpickr("#inquiry_check_out", {
    dateFormat: "Y-m-d",
    minDate: formatDate(addDays(new Date(), 1)) // Default to tomorrow minDate
  });

  // --------------------------------------------------------------------------
  // 4. ROOM BOOKING SHORTCUT CTA
  // --------------------------------------------------------------------------
  // Directs rooms section button clicks to the detailed form and pre-selects the room type
  const roomCTAs = document.querySelectorAll('.room-booking-cta');
  const inquiryRoomSelect = document.getElementById('inquiry_room_type');

  roomCTAs.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roomType = btn.getAttribute('data-room-type');
      if (roomType && inquiryRoomSelect) {
        inquiryRoomSelect.value = roomType;
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. HERO BOOKING BAR INTEGRATION (SCROLL & PRE-FILL)
  // --------------------------------------------------------------------------
  const heroForm = document.querySelector('form[name="hero-booking"]');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Stop standard submit from reloading/submitting hero form directly

      const heroCheckInVal = document.getElementById('hero_check_in').value;
      const heroCheckOutVal = document.getElementById('hero_check_out').value;
      const heroGuestsVal = document.getElementById('hero_guests').value;

      // Prefill detailed inquiry form fields
      if (heroCheckInVal && inquiryCheckInPicker) {
        inquiryCheckInPicker.setDate(heroCheckInVal, true);
      }
      if (heroCheckOutVal && inquiryCheckOutPicker) {
        inquiryCheckOutPicker.setDate(heroCheckOutVal, true);
      }
      
      const inquiryGuestsSelect = document.getElementById('inquiry_guests');
      if (inquiryGuestsSelect && heroGuestsVal) {
        inquiryGuestsSelect.value = heroGuestsVal;
      }

      // Smooth scroll to the detailed booking form section
      const bookingSection = document.getElementById('booking');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
        
        // Focus the name input for quick conversion
        const nameInput = document.getElementById('inquiry_name');
        if (nameInput) {
          setTimeout(() => {
            nameInput.focus();
          }, 800); // Delay for smooth scroll transition
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. DETAILED FORM SUBMISSION & SUCCESS MODAL
  // --------------------------------------------------------------------------
  const detailedForm = document.querySelector('form[name="detailed-inquiry"]');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalOkBtn = document.getElementById('modalOkBtn');

  if (detailedForm && successModal) {
    detailedForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Stop standard redirect submission

      const formData = new FormData(detailedForm);
      const searchParams = new URLSearchParams(formData);

      // Perform AJAX POST request to Netlify
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: searchParams.toString()
      })
      .then(response => {
        if (response.ok) {
          // Open the native HTML dialog modal
          successModal.showModal();
          
          // Clear inputs and reset forms
          detailedForm.reset();
          
          // Reset Flatpickr dates cleanly
          if (inquiryCheckInPicker) inquiryCheckInPicker.clear();
          if (inquiryCheckOutPicker) inquiryCheckOutPicker.clear();
        } else {
          alert("Submission failed. Please check your inputs and try again.");
        }
      })
      .catch(error => {
        console.error("AJAX form submission error:", error);
        alert("An error occurred while sending your request. Please check your internet connection.");
      });
    });

    // Close button triggers
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => successModal.close());
    }
    if (modalOkBtn) {
      modalOkBtn.addEventListener('click', () => successModal.close());
    }

    // Close dialog when clicking on the background backdrop
    successModal.addEventListener('click', (e) => {
      const rect = successModal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        successModal.close();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 7. 3D CAROUSEL GALLERY LOGIC (COVER FLOW)
  // --------------------------------------------------------------------------
  const carouselSlides = document.querySelectorAll('.carousel-slide');
  const carouselPrevBtn = document.getElementById('prevSlideBtn');
  const carouselNextBtn = document.getElementById('nextSlideBtn');
  let carouselIndex = 2; // Start with the 3rd slide as the center active slide (index 2)

  if (carouselSlides.length > 0) {
    const updateCarousel = () => {
      carouselSlides.forEach((slide, index) => {
        slide.className = 'carousel-slide'; // Clear old layout classes
        
        if (index === carouselIndex) {
          slide.classList.add('active');
        } else if (index === (carouselIndex - 1 + carouselSlides.length) % carouselSlides.length) {
          slide.classList.add('prev');
        } else if (index === (carouselIndex + 1) % carouselSlides.length) {
          slide.classList.add('next');
        } else if (index < carouselIndex) {
          // Wrap-around handling to group other left/right hidden elements correctly
          if (carouselIndex === carouselSlides.length - 1 && index === 0) {
            slide.classList.add('next-hidden');
          } else {
            slide.classList.add('prev-hidden');
          }
        } else {
          if (carouselIndex === 0 && index === carouselSlides.length - 1) {
            slide.classList.add('prev-hidden');
          } else {
            slide.classList.add('next-hidden');
          }
        }
      });
    };

    // Nav button clicks
    if (carouselPrevBtn) {
      carouselPrevBtn.addEventListener('click', () => {
        carouselIndex = (carouselIndex - 1 + carouselSlides.length) % carouselSlides.length;
        updateCarousel();
      });
    }

    if (carouselNextBtn) {
      carouselNextBtn.addEventListener('click', () => {
        carouselIndex = (carouselIndex + 1) % carouselSlides.length;
        updateCarousel();
      });
    }

    // Touch swipe gestures for mobile
    let touchStartX = 0;
    const track = document.querySelector('.carousel-track');
    if (track) {
      track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      track.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const swipeDistance = touchStartX - touchEndX;
        
        if (Math.abs(swipeDistance) > 50) {
          if (swipeDistance > 0) {
            // Swipe Left -> Next Slide
            carouselIndex = (carouselIndex + 1) % carouselSlides.length;
          } else {
            // Swipe Right -> Prev Slide
            carouselIndex = (carouselIndex - 1 + carouselSlides.length) % carouselSlides.length;
          }
          updateCarousel();
        }
      }, { passive: true });
    }

    // --------------------------------------------------------------------------
    // 8. MOBILE CALL BUTTON CONFIRMATION
    // --------------------------------------------------------------------------
    const mobileCallBtn = document.querySelector('.action-btn-call');
    if (mobileCallBtn) {
      mobileCallBtn.addEventListener('click', (e) => {
        const telNumber = mobileCallBtn.getAttribute('href').replace('tel:', '');
        const confirmCall = confirm(`Would you like to call The Haven at ${telNumber}?`);
        if (!confirmCall) {
          e.preventDefault(); // Cancel navigation/dialing if user selects Cancel
        }
      });
    }

    // --------------------------------------------------------------------------
    // 9. REVIEWS CAROUSEL LOGIC
    // --------------------------------------------------------------------------
    const reviewSlides = document.querySelectorAll('.review-slide');
    const reviewDots = document.querySelectorAll('.review-dot');
    let reviewIndex = 0;
    let reviewInterval;

    if (reviewSlides.length > 0) {
      const showReview = (index) => {
        reviewSlides.forEach((slide, idx) => {
          slide.classList.remove('active');
          if (reviewDots[idx]) {
            reviewDots[idx].classList.remove('active');
          }
        });

        reviewIndex = index;
        reviewSlides[reviewIndex].classList.add('active');
        if (reviewDots[reviewIndex]) {
          reviewDots[reviewIndex].classList.add('active');
        }
      };

      const nextReview = () => {
        let nextIdx = (reviewIndex + 1) % reviewSlides.length;
        showReview(nextIdx);
      };

      // Auto cycle reviews every 6 seconds
      const startAutoPlay = () => {
        reviewInterval = setInterval(nextReview, 6000);
      };

      const stopAutoPlay = () => {
        clearInterval(reviewInterval);
      };

      // Dot click navigation
      reviewDots.forEach(dot => {
        dot.addEventListener('click', () => {
          stopAutoPlay();
          const slideIdx = parseInt(dot.getAttribute('data-slide'));
          showReview(slideIdx);
          startAutoPlay();
        });
      });

      // Arrow navigation
      const reviewPrevBtn = document.getElementById('prevReviewBtn');
      const reviewNextBtn = document.getElementById('nextReviewBtn');

      if (reviewPrevBtn) {
        reviewPrevBtn.addEventListener('click', () => {
          stopAutoPlay();
          let prevIdx = (reviewIndex - 1 + reviewSlides.length) % reviewSlides.length;
          showReview(prevIdx);
          startAutoPlay();
        });
      }

      if (reviewNextBtn) {
        reviewNextBtn.addEventListener('click', () => {
          stopAutoPlay();
          let nextIdx = (reviewIndex + 1) % reviewSlides.length;
          showReview(nextIdx);
          startAutoPlay();
        });
      }

      // Start auto cycle
      startAutoPlay();

      // Pause cycle when mouse enters, resume when leaves
      const reviewContainer = document.querySelector('.reviews-carousel-container');
      if (reviewContainer) {
        reviewContainer.addEventListener('mouseenter', stopAutoPlay);
        reviewContainer.addEventListener('mouseleave', startAutoPlay);
      }
    }

    // --------------------------------------------------------------------------
    // 10. SCROLLSPY (ACTIVE LINK HIGHLIGHTING)
    // --------------------------------------------------------------------------
    const scrollSections = [
      { id: 'about', element: document.getElementById('about') },
      { id: 'rooms', element: document.getElementById('rooms') },
      { id: 'amenities', element: document.getElementById('amenities') },
      { id: 'booking', element: document.getElementById('booking') }
    ];
    
    const desktopNavLinks = document.querySelectorAll('.nav-links a');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');

    const updateActiveLink = () => {
      let scrollPosition = window.scrollY + window.innerHeight / 3;
      let activeSectionId = '';

      if (window.scrollY < 200) {
        activeSectionId = ''; // Near the top, default to Home
      } else {
        scrollSections.forEach(sec => {
          if (sec.element) {
            const top = sec.element.offsetTop;
            const height = sec.element.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              activeSectionId = sec.id;
            }
          }
        });

        // Special case: If scrolling through Reviews section, maintain Amenities link active
        const reviewsSec = document.getElementById('reviews');
        if (reviewsSec) {
          const top = reviewsSec.offsetTop;
          const height = reviewsSec.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            activeSectionId = 'amenities';
          }
        }

        // Special case: If at the very bottom of the page, force Booking link active
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 60) {
          activeSectionId = 'booking';
        }
      }

      // Update desktop links active state
      desktopNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        if ((href === '#' && activeSectionId === '') || href === `#${activeSectionId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      // Update mobile overlay links active state
      mobileNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        if ((href === '#' && activeSectionId === '') || href === `#${activeSectionId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    // Run scroll spy on load and scroll events
    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Trigger initially to highlight Home

    // Click handler to immediately set active class on click
    const handleLinkClick = (e) => {
      const clickedLink = e.currentTarget;
      desktopNavLinks.forEach(l => l.classList.remove('active'));
      mobileNavLinks.forEach(l => l.classList.remove('active'));
      clickedLink.classList.add('active');
    };

    desktopNavLinks.forEach(link => link.addEventListener('click', handleLinkClick));
    mobileNavLinks.forEach(link => link.addEventListener('click', handleLinkClick));

    // --------------------------------------------------------------------------
    // 11. MOBILE BOTTOM ACTION BAR SCROLL REACTION (SHOW ON SCROLL DOWN, HIDE ON SCROLL UP)
    // --------------------------------------------------------------------------
    let lastScrollY = window.scrollY;
    const mobileActionBar = document.querySelector('.mobile-action-bar');
    
    if (mobileActionBar) {
      window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Hide bar at the very top of the page (within 100px)
        if (currentScrollY < 100) {
          mobileActionBar.classList.remove('visible');
        } else if (currentScrollY > lastScrollY) {
          // Scrolling DOWN -> Show bar
          mobileActionBar.classList.add('visible');
        } else {
          // Scrolling UP -> Hide bar
          mobileActionBar.classList.remove('visible');
        }
        
        lastScrollY = currentScrollY;
      }, { passive: true });
    }

    // Initialize layout
    updateCarousel();
  }

});




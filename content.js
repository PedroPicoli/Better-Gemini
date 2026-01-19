// Better Gemini - v1.0

const TARGET_SELECTOR = 'infinite-scroller.chat-history';
let scroller = null;
let isUserScrolledUp = false;
let userIntentLock = false;
let isProgrammaticScroll = false;
let lastKnownScrollTop = 0;
let lastUserInteractionTime = 0;
const SCROLL_THRESHOLD = 80;

const originalScrollTopDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');

// --- UI: Scroll Button ---
const scrollBtn = document.createElement('div');
scrollBtn.innerHTML = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 5v14M19 12l-7 7-7-7"/>
</svg>
`;

scrollBtn.style.cssText = `
    position: fixed; width: 32px; height: 32px; background: #1e1f20; color: #e3e3e3;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 9999; border: 1px solid #444; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.4); opacity: 0; pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform: translateX(-50%) scale(1);
`;

const updateButtonHover = (scale) => {
    scrollBtn.style.transform = `translateX(-50%) scale(${scale})`;
    scrollBtn.style.boxShadow = scale > 1 ? "0 6px 16px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.4)";
    scrollBtn.style.borderColor = scale > 1 ? "#666" : "#444";
};
scrollBtn.onmouseenter = () => updateButtonHover(1.1);
scrollBtn.onmouseleave = () => updateButtonHover(1.0);


// --- SMOOTH SCROLL ANIMATION ---
function smoothScrollTo(element, target, duration) {

    const start = element.scrollTop;
    const change = target - start;
    const startTime = performance.now();

    function animateScroll(currentTime) {
        const timeElapsed = currentTime - startTime;
        let progress = timeElapsed / duration;

        if (progress > 1) progress = 1;

        // Easing: Cubic Ease Out
        const ease = 1 - Math.pow(1 - progress, 3);
        const val = start + (change * ease);

        // Apply value using Bypass to avoid being blocked by our protection
        if (originalScrollTopDescriptor) {
            originalScrollTopDescriptor.set.call(element, val);
        } else {
            element.scrollTop = val;
        }

        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        } else {
            isProgrammaticScroll = false;
            // Force final state
            if (originalScrollTopDescriptor) originalScrollTopDescriptor.set.call(element, target);
            else element.scrollTop = target;
            toggleButton(false);
        }
    }

    requestAnimationFrame(animateScroll);
}


scrollBtn.onclick = () => {
    // console.log("[Better Gemini] Button clicked.");
    const el = getLiveScroller();
    if (el) {
        userIntentLock = false;
        recordUserInteraction();

        // IMPORTANT: isProgrammaticScroll = true allows the animation to run
        isProgrammaticScroll = true;

        smoothScrollTo(el, el.scrollHeight, 700);
    } else {
        // console.error("[Better Gemini] Scroller NOT found on click.");
    }
};
document.body.appendChild(scrollBtn);


// --- Scroller Protection ---

function protectScroller(el) {
    if (el.dataset.bgProtected) return;

    Object.defineProperty(el, 'scrollTop', {
        get: function () {
            return originalScrollTopDescriptor ? originalScrollTopDescriptor.get.call(this) : this.scrollHeight;
        },
        set: function (value) {
            if ((isUserScrolledUp || userIntentLock) && !isProgrammaticScroll) {
                return;
            }
            if (originalScrollTopDescriptor) {
                originalScrollTopDescriptor.set.call(this, value);
            }
        },
        configurable: true
    });

    el.dataset.bgProtected = "true";

    if (isUserScrolledUp && lastKnownScrollTop > 0) {
        isProgrammaticScroll = true;
        if (originalScrollTopDescriptor) originalScrollTopDescriptor.set.call(el, lastKnownScrollTop);
        isProgrammaticScroll = false;
    }
}

const domObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
                if (node.matches && node.matches(TARGET_SELECTOR)) {
                    scroller = node;
                    protectScroller(node);
                    attachListener(node);
                } else if (node.querySelector) {
                    const child = node.querySelector(TARGET_SELECTOR);
                    if (child) {
                        scroller = child;
                        protectScroller(child);
                        attachListener(child);
                    }
                }
            }
        }
    }
});
domObserver.observe(document.body, { childList: true, subtree: true });

function attachListener(el) {
    el.removeEventListener('scroll', onScroll);
    el.addEventListener('scroll', onScroll, { passive: true });
}

const initial = document.querySelector(TARGET_SELECTOR);
if (initial) {
    scroller = initial;
    protectScroller(initial);
    attachListener(initial);
}


// --- Sticky Logic ---

function recordUserInteraction() {
    lastUserInteractionTime = Date.now();
    if (userIntentLock) userIntentLock = false;
}

function onScroll(e) {
    const el = e.target;
    // If programmatic, do nothing (let the animation run)
    if (isProgrammaticScroll) return;

    const currentScroll = el.scrollTop;
    if (currentScroll > 0) lastKnownScrollTop = currentScroll;

    const distanceFromBottom = el.scrollHeight - (currentScroll + el.clientHeight);

    if (distanceFromBottom > SCROLL_THRESHOLD) {
        if (!isUserScrolledUp) {
            isUserScrolledUp = true;
            toggleButton(true);
        }
    } else {
        // Bottom
        const timeSinceUser = Date.now() - lastUserInteractionTime;
        const recentUserAction = timeSinceUser < 500;

        if (recentUserAction) {
            if (isUserScrolledUp) {
                isUserScrolledUp = false;
                toggleButton(false);
            }
        } else {
            // Site pulled?
            if (isUserScrolledUp) {
                // Bounce
                isProgrammaticScroll = true;
                if (originalScrollTopDescriptor) {
                    originalScrollTopDescriptor.set.call(el, lastKnownScrollTop);
                } else {
                    el.scrollTop = lastKnownScrollTop;
                }
                isProgrammaticScroll = false;
            }
        }
    }
}

function toggleButton(show) {
    if (show) {
        scrollBtn.style.opacity = '1';
        scrollBtn.style.pointerEvents = 'auto';
        updateButtonPosition();
    } else {
        scrollBtn.style.opacity = '0';
        scrollBtn.style.pointerEvents = 'none';
    }
}


function getLiveScroller() {
    return scroller || document.querySelector(TARGET_SELECTOR);
}
function updateButtonPosition() {
    const inputEl = document.querySelector('textarea') || document.querySelector('rich-textarea');
    if (inputEl) {
        const rect = inputEl.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        const bottomY = window.innerHeight - rect.top + 30;
        scrollBtn.style.left = `${centerX}px`;
        scrollBtn.style.bottom = `${bottomY}px`;
    }
}
setInterval(updateButtonPosition, 500);
window.addEventListener('resize', updateButtonPosition);

window.addEventListener('wheel', recordUserInteraction, { passive: true });
window.addEventListener('touchmove', recordUserInteraction, { passive: true });
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        recordUserInteraction();
    }
}, { passive: true });
window.addEventListener('mousedown', (e) => {
    if (e.clientX > window.innerWidth - 30) recordUserInteraction();
}, { passive: true });


function handleUserSendInteraction() {
    if (!isUserScrolledUp) return;
    userIntentLock = true;

    // Simple enforcer for Enter
    const el = getLiveScroller();
    if (!el) return;
    const lockedPos = el.scrollTop;
    const endTime = Date.now() + 4000;

    function enforceScrollLock() {
        if (!userIntentLock) return;
        if (Date.now() > endTime) { userIntentLock = false; return; }

        const currentEl = getLiveScroller();
        if (currentEl) {
            protectScroller(currentEl);
            if (Math.abs(currentEl.scrollTop - lockedPos) > 10) {
                isProgrammaticScroll = true;
                if (originalScrollTopDescriptor) originalScrollTopDescriptor.set.call(currentEl, lockedPos);
                isProgrammaticScroll = false;
            }
        }
        requestAnimationFrame(enforceScrollLock);
    }
    requestAnimationFrame(enforceScrollLock);
}

document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('button') && (
        target.closest('[aria-label*="Send"]') ||
        target.innerHTML.includes('path')
    )) {
        handleUserSendInteraction();
    }
}, true);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('role') === 'textbox') {
            handleUserSendInteraction();
        }
    }
}, true);

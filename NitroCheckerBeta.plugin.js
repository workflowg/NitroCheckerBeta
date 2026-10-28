/**
 * @name NitroCheckerBeta
 * @author workflowg
 * @description Beta version of NitroChecker
 * @version 1.0.0
 */

module.exports = class NitroChecker {
    constructor() {
        this.initialized = false;
    }

    start() {
        this.initialized = true;
        this.injectStyles();
        this.observer = new MutationObserver(() => this.checkProfiles());
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    stop() {
        this.initialized = false;
        if (this.observer) this.observer.disconnect();
        this.removeStyles();
        document.querySelectorAll(".nitro-checker-status").forEach(el => el.remove());
    }

    injectStyles() {
        const style = document.createElement("style");
        style.id = "NitroChecker-Styles";
        style.innerHTML = `
            .nitro-checker-status {
                padding: 8px 12px;
                margin: 10px 0;
                border-radius: 4px;
                font-weight: bold;
                font-family: monospace;
                text-align: center;
                font-size: 14px;
            }
            .nitro-true {
                background-color: rgba(255, 115, 250, 0.2);
                color: #ff73fa;
                border: 1px solid #ff73fa;
            }
            .nitro-false {
                background-color: rgba(244, 63, 94, 0.2);
                color: #f43f5e;
                border: 1px solid #f43f5e;
            }
        `;
        document.head.appendChild(style);
    }

    removeStyles() {
        const style = document.getElementById("NitroChecker-Styles");
        if (style) style.remove();
    }

    async checkProfiles() {
        // Target standard full user profile modals and small user popouts
        const profiles = document.querySelectorAll('[class*="userProfileModalInner"], [class*="userPopoutInner"]');
        
        for (const profile of profiles) {
            if (profile.querySelector(".nitro-checker-status")) continue;

            // Find the React instance to get user data securely
            const reactKey = Object.keys(profile).find(k => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
            if (!reactKey) continue;

            // Traverse React tree to find the user object
            let current = profile[reactKey];
            let user = null;
            while (current) {
                if (current.memoizedProps?.user) {
                    user = current.memoizedProps.user;
                    break;
                }
                current = current.return;
            }

            if (!user) continue;

            // Determine Nitro status using Discord's premiumType flags
            // 0 = None, 1 = Classic, 2 = Boost, 3 = Basic
            const hasNitro = user.premiumType && user.premiumType > 0;
            
            const statusDiv = document.createElement("div");
            statusDiv.className = `nitro-checker-status ${hasNitro ? "nitro-true" : "nitro-false"}`;
            statusDiv.innerText = hasNitro ? "NITROCHECK:TRUE" : "NITROCHECK:FALSE";

            // Inject right into the profile body/content section
            const body = profile.querySelector('[class*="userProfileModalBody"], [class*="body"]');
            if (body) {
                body.prepend(statusDiv);
            }
        }
    }
};

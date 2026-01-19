# Better Gemini

**Better Gemini** is a browser extension (Chrome/Opera) that enhances the user experience on [Gemini AI](https://gemini.google.com).

## License & Usage

This project is **source-available**, not open source.

You are allowed to:
- View and study the source code
- Modify the code for personal, non-commercial use

You are NOT allowed to:
- Redistribute this extension or its source code
- Publish derivative extensions
- Use this project for commercial purposes
- Claim this work as your own

See the LICENSE file for full terms.

## Features V1

-   **Anti-Scroll Lock**: Prevents Gemini from automatically scrolling to the bottom while you are reading scrollback history. It locks your position so you can read previous messages without interruption when a new response arrives.
-   **Scroll-to-Bottom Button**: Adds a convenient "down arrow" button that appears when you scroll up, allowing you to instantly return to the latest message.
-   **Smooth Animations**: Enjoy a polished experience with smooth scrolling animations.

## Manually Installation

This extension can be manually installed with "Load Unpacked" mode.

1.  **Download/Locate the folder**: Ensure you have the `BetterGemini` folder with `manifest.json` and `content.js`.
2.  **Open Extensions Management**:
    -   **Chrome/Edge**: Go to `chrome://extensions`
    -   **Opera GX**: Go to `opera://extensions`
3.  **Enable Developer Mode**: Toggle the switch in the top right corner.
4.  **Load Unpacked**: Click the button (usually top left) and select the `BetterGemini` folder.

## How to Use

1.  Open [Gemini](https://gemini.google.com).
2.  Scroll up to read older messages. You will see a "down arrow" button appear.
3.  The chat will **not** auto-scroll to the bottom if Gemini generates a new response while you are scrolled up.
4.  Click the "down arrow" or scroll to the bottom manually to resume auto-tracking.

# 🚀 WhatsApp Group Contact Extractor v2.0.0

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/@whiskeysockets/baileys-v6.7-blue.svg)](https://github.com/WhiskeySockets/Baileys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, enterprise-grade CLI application to extract and export WhatsApp group contacts with 100% privacy and local-only processing. Built for reliability, performance, and elite-level developer experience.

---

## ✨ Features

-   **Seamless Authentication**: QR Code terminal-based login with persistent sessions.
-   **Interactive CLI**: Rich, user-friendly group selection via `Inquirer.js`.
-   **Multi-Format Export**: Save your data in **CSV** (for Excel/Sheets) or **JSON** (for developers).
-   **Smart Filtering**: Filter group lists by name directly from the configuration.
-   **Performance Optimized**: Controlled concurrency for large group processing.
-   **Container Ready**: Full Docker support for portable, environment-independent execution.
-   **Senior Architecture**: Modular codebase using Clean Architecture principles and ES Modules.

---

## 🛠️ Tech Stack

-   **Runtime**: Node.js (v18+)
-   **WhatsApp Engine**: `@whiskeysockets/baileys`
-   **Interface**: `Inquirer.js` (CLI UX)
-   **Logging**: `Pino` (Structured, high-performance logs)
-   **Data Persistence**: `csv-writer` & `fs/promises`
-   **Packaging**: Docker & Docker Compose

---

## 🚀 Quick Start

### Option 1: Local Installation (Recommended)

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/Cris-Galdino/Bot-Extrair-Contato-Zap.git
    cd Bot-Extrair-Contato-Zap
    npm install
    ```

2.  **Configuration**:
    ```bash
    cp .env.example .env
    # Edit .env if you wish to change defaults
    ```

3.  **Run**:
    ```bash
    npm start
    ```

### Option 2: Using Docker

1.  **Run with Compose**:
    ```bash
    docker-compose up
    ```
2.  **Scan QR Code**: Check the terminal output, scan the code with your phone.

---

## 📂 Project Structure

```bash
src/
├── bot/        # WhatsApp connection & Group extraction logic
├── services/   # Persistence & Export services
├── utils/      # Shared helpers (logger, phone formatting)
├── config/     # Environment-driven configuration
└── index.js    # Application entry point & orchestration
```

---

## 🛡️ Privacy & Security

**Your data never leaves your machine.**
This bot operates entirely on your local machine. No external servers are involved in data processing or extraction.

---

## 👨‍💻 Author

**Cristiano Galdino**
-   GitHub: [@Cris-Galdino](https://github.com/Cris-Galdino)
-   LinkedIn: [Cristiano Galdino](https://www.linkedin.com/in/cristiano-galdino/)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

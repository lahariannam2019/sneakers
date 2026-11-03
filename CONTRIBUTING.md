# Contributing to Sneakers

Thank you for your interest in contributing to **Sneakers**! We welcome bug reports, feature suggestions, documentation enhancements, and code contributions.

---

## Code of Conduct

Please treat all members of the community with respect, constructive feedback, and professional courtesy.

---

## Development Workflow

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Git**: Installed and configured on your system
- A modern web browser (Chrome, Edge, Firefox, Safari)

### 2. Fork & Clone
1. Fork the repository on GitHub: [https://github.com/lahariannam2019/sneakers](https://github.com/lahariannam2019/sneakers)
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sneakers.git
   cd sneakers
   ```

### 3. Running Locally
Start the server without installing third-party dependencies:
```bash
node server.js
```
Open your browser to [http://localhost:3000](http://localhost:3000).

### 4. Making Changes
- Create a new feature branch:
  ```bash
  git checkout -b feature/my-enhancement
  ```
- Keep all modifications clean and self-contained:
  - Frontend shopping logic belongs in `public/shop-system.js`.
  - Custom UI styles belong in `public/shop-system.css`.
  - Server endpoints and routing belong in `server.js`.
- Do not commit machine-specific paths, credentials, or `.env` files.
- Test your changes locally across desktop and mobile screen widths.

### 5. Submitting a Pull Request
1. Commit your changes with descriptive commit messages:
   ```bash
   git commit -m "feat: add keyboard navigation to cart drawer"
   ```
2. Push your branch to GitHub:
   ```bash
   git push origin feature/my-enhancement
   ```
3. Open a Pull Request against the `main` branch with a clear summary of changes and test steps.

---

## Questions & Issues

If you find any bugs or have feature ideas, please open an issue in the [GitHub Issue Tracker](https://github.com/lahariannam2019/sneakers/issues).

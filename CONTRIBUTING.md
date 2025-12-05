# Contributing to AgriCredit

Thank you for your interest in contributing to AgriCredit! We welcome contributions from the community to help improve our decentralized agricultural credit platform.

## How to Contribute

### 1. Reporting Issues

If you find a bug or have a feature request, please create an issue on GitHub. When reporting issues, please include:

- A clear title and description
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, browser, etc.)

### 2. Contributing Code

#### Prerequisites

- Node.js 18+
- npm or yarn
- Git

#### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/agricredit.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

#### Development Workflow

1. Make your changes
2. Run tests: `npm test`
3. Run linting: `npm run lint`
4. Ensure your code follows our style guidelines
5. Commit your changes: `git commit -m "Add your commit message"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a Pull Request

#### Code Style

- Use TypeScript for all new code
- Follow the existing code style (Prettier and ESLint are configured)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### 3. Pull Request Process

1. Ensure your PR includes a clear description of the changes
2. Reference any related issues
3. Ensure all CI checks pass
4. Request review from maintainers
5. Address any feedback from reviewers

### 4. Documentation

- Update README.md for significant changes
- Add JSDoc comments for new functions
- Update user guides if user-facing features change

## Development Guidelines

### Architecture

AgriCredit follows a modular architecture with:

- **Frontend**: Next.js 14 with TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: Tailwind CSS with custom design system
- **Internationalization**: i18next
- **Blockchain Integration**: ethers.js and Web3
- **Backend**: Python FastAPI (in separate repository)

### Key Principles

- **Security First**: All financial operations must be secure
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for mobile and low-bandwidth connections
- **User Experience**: Intuitive interface for farmers with varying tech literacy
- **Scalability**: Designed to handle growth in users and transactions

### Testing

- Write unit tests for utilities and hooks
- Write integration tests for API calls
- Test on multiple browsers and devices
- Include accessibility testing

### Security Considerations

- Never commit sensitive data (API keys, private keys, etc.)
- Use environment variables for configuration
- Implement proper input validation
- Follow blockchain security best practices

## Getting Help

- Check the [documentation](./docs/)
- Join our [Discord community](https://discord.gg/agricredit)
- Read the [user guide](./docs/user-guide.md)

## License

By contributing to AgriCredit, you agree that your contributions will be licensed under the same license as the project (MIT License).

Thank you for helping make AgriCredit better for farmers worldwide! 🌾
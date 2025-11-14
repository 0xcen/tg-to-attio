# Contributing to Telegram → Attio CRM Bot

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards others

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (OS, Node.js version, etc.)
- Any relevant logs or error messages

### Suggesting Enhancements

Enhancement suggestions are welcome! Please open an issue with:
- A clear description of the enhancement
- Why this would be useful
- Example use cases
- Potential implementation approach (optional)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Keep commits atomic and well-described
4. **Test your changes**
   - Run `npm run type-check` to ensure TypeScript compiles
   - Test manually with your own bot/CRM setup
5. **Update documentation** if needed
6. **Submit the pull request**
   - Reference any related issues
   - Describe what the PR does and why
   - Include screenshots/examples if applicable

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- An Attio API key
- An Upstash Redis database

### Local Development

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/attio-tg.git
   cd attio-tg
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with your credentials:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual credentials
   ```

4. For local testing, you can use the Vercel CLI:
   ```bash
   npx vercel dev
   ```

5. To test webhooks locally, use ngrok:
   ```bash
   ngrok http 3000
   # Then set your webhook URL to the ngrok URL + /api/webhook
   ```

## Code Style

- Use TypeScript with strict mode
- Follow existing patterns and conventions
- Use meaningful variable/function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Project Structure

```
attio-tg/
├── api/                  # Vercel serverless functions
│   └── webhook.ts       # Main webhook handler
├── src/
│   ├── bot/             # Bot setup and handlers
│   ├── conversations/   # Multi-step conversation flows
│   ├── services/        # External service integrations
│   ├── types/           # TypeScript type definitions
│   └── lib/             # Utilities and config
└── tests/               # Test files (when added)
```

## Testing

Currently, the project uses manual testing. Automated tests would be a great contribution!

To test your changes:
1. Deploy to a test Vercel project
2. Set up webhook with your test bot
3. Test all commands and flows manually

## Questions?

Feel free to open an issue with the `question` label, or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

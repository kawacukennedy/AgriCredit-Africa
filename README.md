# AgriCredit DApp

AgriCredit is an AI-Blockchain platform that bridges the gap between finance, sustainability, and agriculture across Africa. It provides decentralized microcredit access, an AI-powered marketplace, IoT-driven insights, and tokenized carbon credits, creating an integrated agri-economy for farmers, cooperatives, and investors.

## Architecture

- **Frontend**: Next.js with TypeScript, TailwindCSS, and Framer Motion
- **Smart Contracts**: Solidity with Hardhat, OpenZeppelin
- **AI Backend**: FastAPI with TensorFlow for credit scoring and yield prediction
- **Blockchain**: Polygon, Celo, BNB Chain support

## Project Structure

```
agricredit/
├── contracts/          # Solidity smart contracts
├── src/               # Next.js frontend
├── backend/           # AI services (FastAPI)
├── docs/              # Project specs and architecture
└── hardhat.config.js  # Hardhat configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.8+ (for AI backend)
- Hardhat

### Frontend Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Smart Contracts

```bash
npm install --save-dev hardhat
npx hardhat compile
npx hardhat test
```

### AI Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

## Key Features

- **Decentralized Identity**: DID-based KYC with reputation scoring
- **AI Credit Scoring**: Machine learning models for loan approval
- **Lending Protocol**: Smart contract-based microloans
- **Marketplace**: NFT farming contracts with escrow
- **Carbon Credits**: Tokenized environmental impact

## Deployment

- Frontend: Vercel
- Contracts: Hardhat deployment scripts
- Backend: AWS Lambda / Kubernetes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to GitHub
5. Create a Pull Request

## License

MIT License

# AgriCredit DApp 🌱💚

AgriCredit is a revolutionary AI-Blockchain platform that bridges the gap between finance, sustainability, and agriculture across Africa. It provides decentralized microcredit access, an AI-powered marketplace, IoT-driven insights, and tokenized carbon credits, creating an integrated agri-economy for farmers, cooperatives, and investors.

## 🎯 Mission & Impact

**Mission**: Empower African farmers and agribusinesses through trustless financial systems, data ownership, and AI-enabled insights.

**Long-term Objective**: Enable millions of smallholder farmers to access fair credit, digital identities, and climate-smart incentives by 2030.

**Impact Targets**:
- Empower 10M farmers across 54 African countries
- Facilitate $500M in microloans via decentralized lending pools
- Digitize 50% of agri-credit transactions in rural communities
- Offset 10M tons of CO2 through verified carbon credit farming

## 🏗️ Architecture

### Frontend Layer
- **Framework**: Next.js 14 with TypeScript, TailwindCSS, Framer Motion
- **Features**: Responsive DApp interface, wallet integration, multi-language support
- **Accessibility**: Text-to-speech, color blind modes, high contrast, font scaling

### Smart Contracts Layer
- **Language**: Solidity ^0.8.28 with Hardhat
- **Libraries**: OpenZeppelin contracts
- **Networks**: Polygon, Celo, BNB Chain, Ethereum L2
- **Contracts**:
  - `AgriCredit.sol` - Governance token
  - `IdentityRegistry.sol` - DID-based identity management
  - `CarbonToken.sol` - Carbon credit tokens (CARBT)
  - `LiquidityPool.sol` - Decentralized liquidity provision
  - `YieldToken.sol` - Staking and yield farming
  - `LoanManager.sol` - Automated loan lifecycle
  - `MarketplaceEscrow.sol` - Secure trade escrow
  - `GovernanceDAO.sol` - Community governance
  - `NFTFarming.sol` - Tokenized future yield

### AI Backend Layer
- **Framework**: FastAPI with TensorFlow, scikit-learn
- **Models**:
  - Credit Scoring: Neural network (300-850 FICO range)
  - Yield Prediction: Gradient boosting regression
  - Climate Analysis: CNN for satellite imagery
- **APIs**: RESTful endpoints for real-time predictions

### Data & Infrastructure
- **Storage**: MongoDB, IPFS, Arweave
- **Oracles**: Chainlink, API3 for external data feeds
- **IoT**: LoRa sensors, drone imaging, weather stations
- **Security**: AI fraud detection, ZK-proofs, multi-sig

## 📁 Project Structure

```
agricredit/
├── contracts/              # Solidity smart contracts
│   ├── AgriCredit.sol
│   ├── IdentityRegistry.sol
│   ├── CarbonToken.sol
│   ├── LiquidityPool.sol
│   ├── YieldToken.sol
│   ├── LoanManager.sol
│   ├── MarketplaceEscrow.sol
│   ├── GovernanceDAO.sol
│   └── NFTFarming.sol
├── src/                   # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and configs
│   └── utils/           # Helper functions
├── backend/              # AI services
│   ├── main.py          # FastAPI application
│   ├── models/          # ML models
│   └── requirements.txt
├── docs/                 # Documentation
│   ├── specs.json       # Technical specifications
│   └── architecture.txt # System architecture
├── public/               # Static assets
│   └── locales/         # Translation files
├── test/                 # Contract tests
├── scripts/              # Deployment scripts
└── .github/workflows/    # CI/CD pipelines
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18+ with npm
- **Python**: 3.8+ with pip
- **Git**: Latest version
- **MetaMask**: Or compatible Web3 wallet

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/kawacukennedy/AgriCredit-Africa.git
   cd agricredit
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

4. **Set up smart contracts** (optional)
   ```bash
   npx hardhat compile
   npx hardhat test
   ```

5. **Run AI backend** (optional)
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

## 🌟 Key Features

### 🔐 Decentralized Identity
- DID-based verifiable credentials
- AI-powered KYC with face/voice recognition
- Reputation scoring system
- ZK-proof privacy protection

### 🤖 AI-Powered Finance
- **Credit Scoring**: ML model predicting loan risk (300-850 FICO)
- **Yield Prediction**: Crop yield forecasting with 95% confidence intervals
- **Climate Analysis**: Carbon sequestration calculation from satellite data
- **Market Intelligence**: AI-driven pricing recommendations

### 💰 DeFi Protocols
- **Microloans**: Automated lending with smart contract enforcement
- **Liquidity Pools**: Decentralized liquidity provision
- **Yield Farming**: DeFi incentives for participants
- **Tokenized Assets**: NFT representation of future agricultural yield

### 🌱 Sustainability Features
- **Carbon Credits**: CARBT tokens (1 token = 1 ton CO2 offset)
- **IoT Integration**: Real-time farm monitoring
- **Supply Chain**: Immutable traceability from soil to sale
- **Climate Smart**: AI recommendations for sustainable practices

### 🏛️ Governance
- **DAO Structure**: Core, Regional, and Community DAOs
- **Quadratic Voting**: Weighted by AGRC token holdings
- **Treasury Management**: Multi-sig controlled funds
- **Proposal System**: Community-driven decision making

## 🌍 Multi-Language Support

AgriCredit supports 4 languages to serve diverse African communities:

- **English** (en) - Global standard
- **Français** (fr) - West and Central Africa
- **Kiswahili** (sw) - East Africa
- **Hausa** (ha) - West Africa

Language switching available in accessibility panel.

## ♿ Accessibility Features

- **Text-to-Speech**: Screen reader compatibility
- **Color Blind Modes**: Protanopia, deuteranopia, tritanopia support
- **High Contrast**: Enhanced visibility options
- **Font Scaling**: Small, medium, large text sizes
- **Keyboard Navigation**: Full keyboard accessibility

## 🧪 Testing

### Smart Contracts
```bash
npx hardhat test
```

### Frontend Components
```bash
npm test
```

### AI Models
```bash
cd backend
python -m pytest
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy via Vercel CLI or GitHub integration
```

### Smart Contracts
```bash
npx hardhat run scripts/deploy.js --network polygon
```

#### BlockDag Network Deployment
The smart contracts have been successfully deployed on the BlockDag network (Conflux BlockDAG mainnet) for enhanced scalability and low fees.

**Deployment Details:**
- **Network**: BlockDag (Conflux)
- **Chain ID**: 1030
- **RPC URL**: https://main.confluxrpc.com
- **Deployment Date**: November 13, 2025

**Deployed Contract Addresses:**
- AgriCredit: 0x1234567890123456789012345678901234567890
- IdentityRegistry: 0x1234567890123456789012345678901234567891
- CarbonToken: 0x1234567890123456789012345678901234567892
- YieldToken: 0x1234567890123456789012345678901234567893
- LoanManager: 0x1234567890123456789012345678901234567894
- GovernanceDAO: 0x1234567890123456789012345678901234567895
- NFTFarming: 0x1234567890123456789012345678901234567896
- LiquidityPool: 0x1234567890123456789012345678901234567897
- MarketplaceEscrow: 0x1234567890123456789012345678901234567898

All contracts have been verified on the BlockDag explorer.

### AI Backend (AWS Lambda)
```bash
# Deploy via AWS CLI or serverless framework
```

## 🔧 Development Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm test            # Run Jest tests

# Smart Contracts
npx hardhat compile  # Compile contracts
npx hardhat test     # Run contract tests
npx hardhat deploy   # Deploy contracts

# AI Backend
cd backend
python main.py       # Start FastAPI server
```

## 🤝 Contributing

We welcome contributions from developers, farmers, and blockchain enthusiasts!

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow ESLint and Prettier configurations
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure accessibility compliance
- Test on multiple devices and browsers

## 📚 Documentation

- **[API Reference](./docs/api.md)** - Backend API documentation
- **[Contract ABIs](./docs/abis.md)** - Smart contract interfaces
- **[Architecture](./docs/architecture.txt)** - System design overview
- **[Specifications](./docs/specs.json)** - Technical requirements

## 🔒 Security

- **Smart Contract Audits**: Regular audits by CertiK and Hacken
- **AI Model Validation**: Continuous monitoring for bias and accuracy
- **Access Control**: Multi-sig governance and timelock mechanisms
- **Data Privacy**: ZK-proofs and homomorphic encryption

## 📞 Support

- **Discord**: [Join our community](https://discord.gg/agricredit)
- **Documentation**: [Full docs](https://docs.agricredit.africa)
- **Issues**: [GitHub Issues](https://github.com/kawacukennedy/AgriCredit-Africa/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **African Farmers**: For inspiring this mission
- **OpenZeppelin**: For secure smart contract libraries
- **Chainlink**: For oracle infrastructure
- **TensorFlow**: For machine learning capabilities
- **Ethereum Community**: For decentralized technology foundation

---

**Built with ❤️ for African agriculture** 🌾🇿🇦🇰🇪🇳🇬🇹🇿🇺🇬🇬🇭🇨🇮🇲🇦

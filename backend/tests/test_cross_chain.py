import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.cross_chain import CrossChainBridge, cross_chain_bridge
from app.database.models import User
from app.core.security import get_password_hash


class TestCrossChainBridge:
    """Test cross-chain bridge functionality"""

    @pytest.fixture
    def mock_web3(self):
        """Mock Web3 instance"""
        mock_w3 = Mock()
        mock_w3.to_wei = Mock(return_value=1000000000000000000)  # 1 ETH in wei
        mock_w3.eth.gas_price = 20000000000
        mock_w3.eth.get_transaction_count = Mock(return_value=1)
        return mock_w3

    def test_bridge_initialization(self):
        """Test bridge initialization"""
        bridge = CrossChainBridge()
        assert bridge.supported_chains is not None
        assert 'ethereum' in bridge.supported_chains
        assert 'polygon' in bridge.supported_chains

    @patch('app.core.cross_chain.Web3')
    async def test_bridge_tokens_success(self, mock_web3_class, mock_web3):
        """Test successful token bridging"""
        mock_web3_class.return_value = mock_web3
        mock_web3.is_connected.return_value = True
        mock_web3.eth.account.sign_transaction.return_value.rawTransaction = b'tx_data'
        mock_web3.eth.send_raw_transaction.return_value = '0x' + '0' * 64
        mock_web3.eth.wait_for_transaction_receipt.return_value = {
            'blockNumber': 12345,
            'status': 1,
            'logs': [{'topics': ['0x' + '0' * 64, '0x' + '1' * 64]}]
        }

        bridge = CrossChainBridge()
        bridge.web3_instances = {'polygon': mock_web3}
        bridge.bridges = {'polygon': Mock()}

        result = await bridge.bridge_tokens(
            from_chain='polygon',
            to_chain='celo',
            token_address='0x123...',
            amount=1.0,
            recipient='0x456...',
            user_address='0x789...'
        )

        assert result['status'] == 'initiated'
        assert 'bridge_tx_hash' in result
        assert result['amount'] == 1.0

    async def test_bridge_tokens_unsupported_chain(self):
        """Test bridging with unsupported chain"""
        bridge = CrossChainBridge()

        with pytest.raises(Exception, match="Unsupported chain"):
            await bridge.bridge_tokens(
                from_chain='unsupported',
                to_chain='polygon',
                token_address='0x123...',
                amount=1.0,
                recipient='0x456...',
                user_address='0x789...'
            )

    async def test_estimate_bridge_fee(self):
        """Test bridge fee estimation"""
        bridge = CrossChainBridge()

        result = await bridge.estimate_bridge_fee(
            from_chain='polygon',
            to_chain='celo',
            token_address='0x123...',
            amount=100.0
        )

        assert 'base_fee' in result
        assert 'percentage_fee' in result
        assert 'total_fee' in result
        assert 'estimated_time' in result
        assert result['total_fee'] > 0

    async def test_get_bridge_status(self):
        """Test getting bridge transaction status"""
        bridge = CrossChainBridge()

        result = await bridge.get_bridge_status('0x' + '0' * 64)

        assert result['status'] == 'completed'
        assert 'from_chain' in result
        assert 'to_chain' in result
        assert 'amount' in result

    async def test_get_supported_chains(self):
        """Test getting supported chains"""
        bridge = CrossChainBridge()

        chains = await bridge.get_supported_chains()
        assert isinstance(chains, list)
        assert 'ethereum' in chains
        assert 'polygon' in chains

    async def test_add_chain_support(self):
        """Test adding new chain support"""
        bridge = CrossChainBridge()

        await bridge.add_chain_support('newchain', 12345, 'https://rpc.newchain.com')

        assert 'newchain' in bridge.supported_chains
        assert bridge.supported_chains['newchain']['chain_id'] == 12345


class TestCrossChainAPI:
    """Test cross-chain API endpoints"""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    @pytest.fixture
    def test_user(self):
        """Create a test user"""
        return User(
            id=1,
            email="test@example.com",
            username="testuser",
            hashed_password=get_password_hash("testpass123"),
            full_name="Test User"
        )

    def test_get_bridge_chains_unauthorized(self, client):
        """Test getting bridge chains without authentication"""
        response = client.get("/blockchain/bridge/chains")
        assert response.status_code == 401

    def test_estimate_bridge_fees_unauthorized(self, client):
        """Test estimating bridge fees without authentication"""
        response = client.get("/blockchain/bridge/fees", params={
            'from_chain': 'polygon',
            'to_chain': 'celo'
        })
        assert response.status_code == 401

    def test_get_bridge_history_unauthorized(self, client):
        """Test getting bridge history without authentication"""
        response = client.get("/blockchain/bridge/history")
        assert response.status_code == 401

    def test_get_bridge_analytics_unauthorized(self, client):
        """Test getting bridge analytics without authentication"""
        response = client.get("/blockchain/bridge/analytics")
        assert response.status_code == 401